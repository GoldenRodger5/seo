/**
 * Image processing pipeline.
 *
 * Reads the audit at docs/image-audit.json and rewrites raster images
 * under public/site-banners and public/niche-covers to canonical
 * dimensions (1200×750, 16:10) with @2x retina variants. Originals
 * are preserved under {dir}/_originals/.
 *
 * Run with: npx tsx scripts/process-images.ts
 *
 * Flags to docs/manual-image-replacements.md anything the script
 * can't fix safely: extreme aspect mismatch, severe low-res, suspected
 * watermarks.
 *
 * Watermark heuristic is conservative — produces false positives by
 * design. Manual review filters them. False negatives are the real
 * risk (shipping a watermarked image), so the heuristic errs toward
 * flagging.
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const DOCS_DIR = path.join(ROOT, "docs");

interface AuditRow {
  publicPath: string;
  bytes: number;
  width: number | null;
  height: number | null;
  aspect: number | null;
  format: string;
  surface: string | null;
  refs: { file: string; line: number; imagePath: string; context: string }[];
  issues: string[];
}

interface Audit {
  generated_at: string;
  summary: Record<string, number>;
  rows: AuditRow[];
}

interface Surface {
  // matches if publicPath starts with one of `dirs`
  dirs: string[];
  width: number;
  height: number;
  retina: 2;
  quality: number;
  targetBytes: number; // soft target
  label: string;
}

const SURFACES: Surface[] = [
  {
    dirs: ["/site-banners/"],
    width: 1200, height: 750, retina: 2,
    quality: 80, targetBytes: 150 * 1024,
    label: "Site banner",
  },
  {
    dirs: ["/niche-covers/"],
    width: 1200, height: 750, retina: 2,
    quality: 80, targetBytes: 150 * 1024,
    label: "Niche cover",
  },
  {
    dirs: ["/blog/"],
    width: 1600, height: 900, retina: 2,
    quality: 82, targetBytes: 200 * 1024,
    label: "Blog hero",
  },
];

function matchSurface(publicPath: string): Surface | null {
  for (const s of SURFACES) {
    if (s.dirs.some((d) => publicPath.startsWith(d))) return s;
  }
  return null;
}

function aspectRatio(s: Surface): number {
  return s.width / s.height;
}

interface ProcessingResult {
  publicPath: string;
  status: "processed" | "skipped" | "flagged";
  reason?: string;
  outputs?: { path: string; bytes: number; dims: string }[];
  flag?: string; // for manual review
}

async function ensureOriginalsCopy(absSrc: string): Promise<string> {
  const dir = path.dirname(absSrc);
  const originalsDir = path.join(dir, "_originals");
  await fs.mkdir(originalsDir, { recursive: true });
  const dest = path.join(originalsDir, path.basename(absSrc));
  try {
    await fs.access(dest);
  } catch {
    await fs.copyFile(absSrc, dest);
  }
  return dest;
}

/**
 * Conservative watermark heuristic. Looks for high-contrast regions in
 * the corners of the image — affiliate-network "VISIT US" badges and
 * aggregator stamps tend to live there. Returns true if a corner has
 * significantly higher edge density than the center. False positives
 * acceptable; manual review filters.
 */
async function looksWatermarked(absSrc: string): Promise<boolean> {
  try {
    const img = sharp(absSrc);
    const meta = await img.metadata();
    if (!meta.width || !meta.height) return false;
    const cw = Math.min(200, Math.floor(meta.width * 0.2));
    const ch = Math.min(120, Math.floor(meta.height * 0.2));
    // Sample top-right and bottom-right corners (where stamps typically sit)
    // and compare their grayscale variance to the image center.
    const grayBuf = async (left: number, top: number) =>
      await sharp(absSrc).extract({ left, top, width: cw, height: ch }).grayscale().raw().toBuffer();

    const center = await grayBuf(
      Math.floor((meta.width - cw) / 2),
      Math.floor((meta.height - ch) / 2),
    );
    const tr = await grayBuf(meta.width - cw, 0);
    const br = await grayBuf(meta.width - cw, meta.height - ch);

    const variance = (b: Buffer) => {
      let sum = 0, sumSq = 0;
      for (let i = 0; i < b.length; i++) { sum += b[i]; sumSq += b[i] * b[i]; }
      const m = sum / b.length;
      return sumSq / b.length - m * m;
    };
    const vCenter = variance(center);
    const vTR = variance(tr);
    const vBR = variance(br);
    // If a corner has >2.5× the variance of the center, likely a stamp/badge.
    return vTR > vCenter * 2.5 || vBR > vCenter * 2.5;
  } catch {
    return false;
  }
}

async function processImage(row: AuditRow): Promise<ProcessingResult> {
  const surface = matchSurface(row.publicPath);
  if (!surface) {
    return { publicPath: row.publicPath, status: "skipped", reason: "No matching surface" };
  }
  if (row.bytes === 0 || row.width === null || row.height === null) {
    return { publicPath: row.publicPath, status: "skipped", reason: "Missing or unreadable file" };
  }
  if (row.format === "gif" || row.format === "svg") {
    return { publicPath: row.publicPath, status: "skipped", reason: `${row.format.toUpperCase()} not processed` };
  }

  const absSrc = path.join(PUBLIC_DIR, row.publicPath.replace(/^\//, ""));
  const sourceAspect = (row.width as number) / (row.height as number);
  const targetAspect = aspectRatio(surface);
  const aspectDelta = Math.abs(sourceAspect - targetAspect);

  // Extreme aspect mismatch → don't process, flag for manual replacement
  if (aspectDelta > 0.5) {
    return {
      publicPath: row.publicPath,
      status: "flagged",
      flag: `EXTREME_ASPECT (${sourceAspect.toFixed(2)} source vs ${targetAspect.toFixed(2)} target — cropping would destroy the image)`,
    };
  }

  // Severe low-res → flag for replacement
  if ((row.width as number) < surface.width * 0.75) {
    return {
      publicPath: row.publicPath,
      status: "flagged",
      flag: `LOW_RES (${row.width}px source vs ${surface.width}px target — upscaling would produce visible artifacts)`,
    };
  }

  // Watermark suspicion
  const wm = await looksWatermarked(absSrc);
  if (wm) {
    return {
      publicPath: row.publicPath,
      status: "flagged",
      flag: "WATERMARK_SUSPECTED (high-contrast corner detected — likely affiliate badge or stamp)",
    };
  }

  // Preserve original
  await ensureOriginalsCopy(absSrc);

  // Crop strategy
  // - Wider than target: center-crop horizontally (default sharp cover)
  // - Taller than target: crop top 60% — faces typically in upper portion
  const position =
    sourceAspect > targetAspect ? "centre" : sharp.gravity.north;

  const outputs: { path: string; bytes: number; dims: string }[] = [];
  for (const scale of [1, surface.retina]) {
    const w = surface.width * scale;
    const h = surface.height * scale;
    const outName = scale === 1
      ? path.basename(absSrc, path.extname(absSrc)) + ".jpg"
      : path.basename(absSrc, path.extname(absSrc)) + "@2x.jpg";
    const outAbs = path.join(path.dirname(absSrc), outName);

    let quality = surface.quality;
    let buf: Buffer;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      buf = await sharp(absSrc)
        .resize(w, h, { fit: "cover", position })
        .jpeg({ quality, progressive: true, mozjpeg: true })
        .withMetadata({})
        .toBuffer();
      if (buf.length <= surface.targetBytes * 1.5 || quality <= 70) break;
      quality -= 5;
    }
    await fs.writeFile(outAbs, buf);
    outputs.push({ path: outAbs, bytes: buf.length, dims: `${w}×${h}` });
  }
  return { publicPath: row.publicPath, status: "processed", outputs };
}

async function main() {
  const auditPath = path.join(DOCS_DIR, "image-audit.json");
  let audit: Audit;
  try {
    audit = JSON.parse(await fs.readFile(auditPath, "utf-8"));
  } catch (e) {
    console.error(`Cannot read audit at ${auditPath}. Run \`npm run images:audit\` first.`);
    process.exit(1);
    return;
  }

  console.log(`Processing ${audit.rows.length} images…`);
  const results: ProcessingResult[] = [];
  for (const row of audit.rows) {
    if (row.issues.includes("MISSING")) continue;
    if (row.issues.includes("UNREFERENCED") && !row.surface) continue; // skip unrelated files
    const r = await processImage(row);
    results.push(r);
    const tag = r.status === "processed" ? "✓" : r.status === "flagged" ? "⚑" : "·";
    console.log(`  ${tag} ${r.publicPath} ${r.reason ?? r.flag ?? ""}`);
  }

  // Write reports
  const processed = results.filter((r) => r.status === "processed");
  const flagged = results.filter((r) => r.status === "flagged");
  const skipped = results.filter((r) => r.status === "skipped");

  const reportLines = [
    `# Image Processing Report — ${new Date().toISOString().slice(0, 10)}\n`,
    `- Processed: **${processed.length}**`,
    `- Flagged for manual replacement: **${flagged.length}**`,
    `- Skipped: **${skipped.length}**\n`,
    "## Processed\n",
    processed.length === 0
      ? "_None._"
      : processed.map((r) => `- \`${r.publicPath}\` → ${(r.outputs ?? []).map((o) => `${path.basename(o.path)} (${o.dims}, ${(o.bytes / 1024).toFixed(0)}KB)`).join(", ")}`).join("\n"),
    "\n## Skipped\n",
    skipped.length === 0
      ? "_None._"
      : skipped.map((r) => `- \`${r.publicPath}\` — ${r.reason}`).join("\n"),
  ];
  await fs.writeFile(path.join(DOCS_DIR, "image-processing-report.md"), reportLines.join("\n"));

  const manualLines = [
    "# Manual image replacements needed\n",
    "_Generated by `scripts/process-images.ts`. Each entry below is an image the pipeline could not fix safely. Replace the source with a clean banner that meets the target dimensions; re-run the audit + processing pipeline._\n",
    `Total flagged: **${flagged.length}**\n`,
    "## Items\n",
    flagged.length === 0
      ? "_None._"
      : flagged.map((r) => {
          const row = audit.rows.find((x) => x.publicPath === r.publicPath);
          const refs = row?.refs.map((rf) => `  - \`${rf.file}:${rf.line}\``).join("\n") ?? "  - _no references_";
          return [
            `### \`${r.publicPath}\``,
            `- **Issue:** ${r.flag}`,
            `- **Where it renders:**`,
            refs,
            `- **Current dimensions:** ${row?.width}×${row?.height}`,
            `- **Target dimensions:** 1200×750 (16:10 site banner)`,
            `- **Recommended source:** studio press kit / affiliate dashboard creative library — clean banner, no watermarks, no competitor branding`,
            "",
          ].join("\n");
        }).join("\n"),
  ];
  await fs.writeFile(path.join(DOCS_DIR, "manual-image-replacements.md"), manualLines.join("\n"));

  console.log(`\nWrote docs/image-processing-report.md and docs/manual-image-replacements.md`);
  console.log(`Originals preserved in {dir}/_originals/ — never overwritten.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
