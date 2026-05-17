/**
 * Image audit. Walks public/ and src/ and produces:
 *   • docs/image-audit-report.md  — human-readable
 *   • docs/image-audit.json       — machine-readable for downstream scripts
 *
 * Detects: MISSING, UNREFERENCED, DIMENSION_MISMATCH, LOW_RESOLUTION,
 *          HUGE_FILE, POTENTIAL_DUPLICATE, NON_STANDARD_FORMAT.
 *
 * Does NOT detect watermarks (impossible reliably) or judge content.
 */
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const SRC_DIR = path.join(ROOT, "src");
const DOCS_DIR = path.join(ROOT, "docs");

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|svg)$/i;
const RASTER_EXT = /\.(jpe?g|png|webp|gif)$/i;

// Canonical container dimensions per surface — used to flag dimension mismatches.
// Maps a path prefix to its expected aspect ratio (and a label for the report).
const SURFACES: { dir: string; aspect: number; label: string; minWidth: number }[] = [
  { dir: "/site-banners/",  aspect: 16 / 10, label: "Site banner",  minWidth: 800 },
  { dir: "/niche-covers/",  aspect: 16 / 10, label: "Niche cover",  minWidth: 800 },
  { dir: "/blog/",          aspect: 16 / 9,  label: "Blog hero",    minWidth: 1200 },
  { dir: "/pwa-",           aspect: 1,       label: "PWA icon",     minWidth: 192 },
];

const HUGE_FILE_KB = 500;
const LOW_RES_FACTOR = 1.5; // anything below 1.5× target width on Retina is pixelated

interface DiskImage {
  absPath: string;
  publicPath: string; // /-prefixed, as referenced from code
  bytes: number;
  width: number | null;
  height: number | null;
  aspect: number | null;
  format: string;
  sha256: string;
}

interface CodeRef {
  file: string;
  line: number;
  imagePath: string;     // /site-banners/foo.jpg
  context: string;       // surrounding line for grep
}

interface AuditRow {
  publicPath: string;
  bytes: number;
  width: number | null;
  height: number | null;
  aspect: number | null;
  format: string;
  surface: string | null;     // matched surface label
  refs: CodeRef[];
  issues: string[];           // MISSING / UNREFERENCED / DIMENSION_MISMATCH etc.
}

async function walkDir(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".") || entry.name === "_originals") continue;
      await walkDir(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

async function getImageMetadata(abs: string): Promise<{ width: number | null; height: number | null; format: string }> {
  try {
    const meta = await sharp(abs).metadata();
    return { width: meta.width ?? null, height: meta.height ?? null, format: meta.format ?? "unknown" };
  } catch {
    return { width: null, height: null, format: path.extname(abs).slice(1) };
  }
}

async function hashFile(abs: string): Promise<string> {
  const data = await fs.readFile(abs);
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

function matchSurface(publicPath: string): { aspect: number; label: string; minWidth: number } | null {
  for (const s of SURFACES) {
    if (publicPath.startsWith(s.dir) || publicPath.includes(s.dir)) {
      return s;
    }
  }
  return null;
}

async function scanCodeReferences(): Promise<Map<string, CodeRef[]>> {
  const refs = new Map<string, CodeRef[]>();
  const codeFiles = (await walkDir(SRC_DIR)).filter((f) => /\.(tsx?|jsx?|css|md)$/.test(f));
  // Match: "/site-banners/foo.jpg", "/niche-covers/x.jpg", "/pwa-512.png" etc.
  const pathRe = /(["'`])(\/(?:[a-z0-9_-]+\/)*[a-z0-9_.-]+\.(?:jpe?g|png|webp|gif|svg))\1/gi;
  for (const file of codeFiles) {
    let content: string;
    try { content = await fs.readFile(file, "utf-8"); } catch { continue; }
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      let m: RegExpExecArray | null;
      const re = new RegExp(pathRe.source, pathRe.flags);
      while ((m = re.exec(line)) !== null) {
        const imagePath = m[2];
        if (!refs.has(imagePath)) refs.set(imagePath, []);
        refs.get(imagePath)!.push({
          file: path.relative(ROOT, file),
          line: i + 1,
          imagePath,
          context: line.trim().slice(0, 160),
        });
      }
    });
  }
  return refs;
}

async function main() {
  console.log("Walking public/…");
  const allFiles = await walkDir(PUBLIC_DIR);
  const imageFiles = allFiles.filter((f) => IMAGE_EXT.test(f));
  console.log(`  ${imageFiles.length} image files on disk`);

  console.log("Scanning src/ for image references…");
  const codeRefs = await scanCodeReferences();
  const totalRefs = [...codeRefs.values()].reduce((s, arr) => s + arr.length, 0);
  console.log(`  ${codeRefs.size} unique paths, ${totalRefs} references`);

  console.log("Reading image metadata + hashes…");
  const diskImages: DiskImage[] = [];
  for (const abs of imageFiles) {
    const publicPath = "/" + path.relative(PUBLIC_DIR, abs).split(path.sep).join("/");
    const stat = await fs.stat(abs);
    const meta = RASTER_EXT.test(abs)
      ? await getImageMetadata(abs)
      : { width: null, height: null, format: "svg" };
    const sha256 = RASTER_EXT.test(abs) ? await hashFile(abs) : "";
    diskImages.push({
      absPath: abs,
      publicPath,
      bytes: stat.size,
      width: meta.width,
      height: meta.height,
      aspect: meta.width && meta.height ? meta.width / meta.height : null,
      format: meta.format,
      sha256,
    });
  }

  console.log("Building audit rows…");
  const rows: AuditRow[] = [];
  const hashToPaths = new Map<string, string[]>();
  for (const img of diskImages) {
    if (img.sha256) {
      if (!hashToPaths.has(img.sha256)) hashToPaths.set(img.sha256, []);
      hashToPaths.get(img.sha256)!.push(img.publicPath);
    }
  }

  // Build a row per image on disk
  for (const img of diskImages) {
    const surface = matchSurface(img.publicPath);
    const refs = codeRefs.get(img.publicPath) ?? [];
    const issues: string[] = [];
    if (refs.length === 0) issues.push("UNREFERENCED");
    if (img.bytes > HUGE_FILE_KB * 1024) issues.push("HUGE_FILE");
    if (surface && img.aspect !== null) {
      if (Math.abs(img.aspect - surface.aspect) > 0.2) issues.push("DIMENSION_MISMATCH");
    }
    if (surface && img.width !== null && img.width < surface.minWidth * LOW_RES_FACTOR) {
      issues.push("LOW_RESOLUTION");
    }
    if (img.format === "png" && surface && surface.label !== "PWA icon") {
      issues.push("NON_STANDARD_FORMAT");
    }
    if (img.sha256) {
      const dupes = hashToPaths.get(img.sha256) ?? [];
      if (dupes.length > 1) issues.push("POTENTIAL_DUPLICATE");
    }
    rows.push({
      publicPath: img.publicPath,
      bytes: img.bytes,
      width: img.width,
      height: img.height,
      aspect: img.aspect,
      format: img.format,
      surface: surface?.label ?? null,
      refs,
      issues,
    });
  }

  // Code refs that have no matching file on disk → MISSING
  const onDisk = new Set(diskImages.map((d) => d.publicPath));
  for (const [imagePath, refs] of codeRefs) {
    if (!onDisk.has(imagePath)) {
      rows.push({
        publicPath: imagePath,
        bytes: 0,
        width: null,
        height: null,
        aspect: null,
        format: path.extname(imagePath).slice(1),
        surface: matchSurface(imagePath)?.label ?? null,
        refs,
        issues: ["MISSING"],
      });
    }
  }

  // Sort: issues first, then alphabetical
  rows.sort((a, b) => {
    const ai = a.issues.length, bi = b.issues.length;
    if (ai !== bi) return bi - ai;
    return a.publicPath.localeCompare(b.publicPath);
  });

  // Write JSON
  await fs.mkdir(DOCS_DIR, { recursive: true });
  const jsonOut = {
    generated_at: new Date().toISOString(),
    summary: {
      total_images_on_disk: diskImages.length,
      total_code_references: totalRefs,
      unique_referenced_paths: codeRefs.size,
      total_issues: rows.reduce((s, r) => s + r.issues.length, 0),
    },
    rows,
  };
  await fs.writeFile(path.join(DOCS_DIR, "image-audit.json"), JSON.stringify(jsonOut, null, 2));

  // Write Markdown
  const md = renderMarkdownReport(jsonOut);
  await fs.writeFile(path.join(DOCS_DIR, "image-audit-report.md"), md);

  // Print headline
  console.log("\n=== Audit complete ===");
  console.log(`Images on disk:        ${jsonOut.summary.total_images_on_disk}`);
  console.log(`Code references:       ${jsonOut.summary.total_code_references}`);
  console.log(`Unique paths referenced: ${jsonOut.summary.unique_referenced_paths}`);
  console.log(`Total issues:          ${jsonOut.summary.total_issues}`);
  const byType = new Map<string, number>();
  for (const r of rows) for (const i of r.issues) byType.set(i, (byType.get(i) ?? 0) + 1);
  console.log("Top issue types:");
  [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(24)} ${v}`);
  });
}

function renderMarkdownReport(data: {
  generated_at: string;
  summary: Record<string, number>;
  rows: AuditRow[];
}): string {
  const date = data.generated_at.slice(0, 10);
  const issueCounts = new Map<string, number>();
  for (const r of data.rows) for (const i of r.issues) issueCounts.set(i, (issueCounts.get(i) ?? 0) + 1);
  const by = (issue: string) => data.rows.filter((r) => r.issues.includes(issue));

  const row = (r: AuditRow) => {
    const dims = r.width && r.height ? `${r.width}×${r.height}` : "?";
    const sizeKb = r.bytes > 0 ? `${(r.bytes / 1024).toFixed(0)}KB` : "—";
    const refs = r.refs.length === 0 ? "—" : `${r.refs.length} ref${r.refs.length === 1 ? "" : "s"}`;
    return `| \`${r.publicPath}\` | ${dims} | ${sizeKb} | ${r.surface ?? "—"} | ${refs} | ${r.issues.join(", ") || "—"} |`;
  };

  const tableHeader = "| Path | Dimensions | Size | Surface | Refs | Issues |\n|---|---|---|---|---|---|\n";

  const sections: string[] = [];
  sections.push(`# Image Audit Report — ${date}\n`);
  sections.push("## Summary\n");
  sections.push(`- Total images on disk: **${data.summary.total_images_on_disk}**`);
  sections.push(`- Total code references: **${data.summary.total_code_references}**`);
  sections.push(`- Unique referenced paths: **${data.summary.unique_referenced_paths}**`);
  sections.push(`- Total issues: **${data.summary.total_issues}**\n`);
  sections.push("## Issues by type\n");
  for (const [k, v] of [...issueCounts.entries()].sort((a, b) => b[1] - a[1])) {
    sections.push(`- \`${k}\`: ${v}`);
  }
  sections.push("");

  sections.push("## Broken — must fix\n");
  const missing = by("MISSING");
  sections.push(`### MISSING (${missing.length}) — referenced in code but no file on disk\n`);
  if (missing.length > 0) sections.push(tableHeader + missing.map(row).join("\n"));
  else sections.push("_None._\n");

  const unref = by("UNREFERENCED");
  sections.push(`\n### UNREFERENCED (${unref.length}) — file on disk but never referenced\n`);
  if (unref.length > 0) sections.push(tableHeader + unref.map(row).join("\n"));
  else sections.push("_None._\n");

  sections.push("\n## Quality issues — visible to users\n");
  const dim = by("DIMENSION_MISMATCH");
  sections.push(`### DIMENSION_MISMATCH (${dim.length})\n`);
  if (dim.length > 0) sections.push(tableHeader + dim.map(row).join("\n"));
  else sections.push("_None._\n");

  const low = by("LOW_RESOLUTION");
  sections.push(`\n### LOW_RESOLUTION (${low.length})\n`);
  if (low.length > 0) sections.push(tableHeader + low.map(row).join("\n"));
  else sections.push("_None._\n");

  const dup = by("POTENTIAL_DUPLICATE");
  sections.push(`\n### POTENTIAL_DUPLICATE (${dup.length})\n`);
  if (dup.length > 0) sections.push(tableHeader + dup.map(row).join("\n"));
  else sections.push("_None._\n");

  sections.push("\n## Performance\n");
  const huge = by("HUGE_FILE");
  sections.push(`### HUGE_FILE (${huge.length}) — over 500KB\n`);
  if (huge.length > 0) sections.push(tableHeader + huge.map(row).join("\n"));
  else sections.push("_None._\n");

  const nsf = by("NON_STANDARD_FORMAT");
  sections.push(`\n### NON_STANDARD_FORMAT (${nsf.length})\n`);
  if (nsf.length > 0) sections.push(tableHeader + nsf.map(row).join("\n"));
  else sections.push("_None._\n");

  sections.push("\n## Full inventory\n");
  sections.push(tableHeader + data.rows.map(row).join("\n"));

  return sections.join("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
