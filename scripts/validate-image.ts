/**
 * Pre-commit image validator. Usage:
 *   npx tsx scripts/validate-image.ts [file1 file2 ...]
 * With no args, validates all images in public/site-banners,
 * public/niche-covers, public/blog. Exits non-zero on violations.
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");

interface Rule {
  prefix: string;
  width: number;
  height: number;
  maxBytes: number;
  aspectTolerance: number;
  label: string;
}

const RULES: Rule[] = [
  { prefix: "site-banners", width: 1200, height: 750, maxBytes: 250 * 1024, aspectTolerance: 0.1, label: "Site banner" },
  { prefix: "niche-covers", width: 1200, height: 750, maxBytes: 250 * 1024, aspectTolerance: 0.1, label: "Niche cover" },
  { prefix: "blog", width: 1600, height: 900, maxBytes: 350 * 1024, aspectTolerance: 0.1, label: "Blog hero" },
];

function ruleFor(relPath: string): Rule | null {
  const norm = relPath.replace(/\\/g, "/");
  return RULES.find((r) => norm.includes(`/${r.prefix}/`) || norm.startsWith(`${r.prefix}/`)) ?? null;
}

interface Violation {
  file: string;
  reasons: string[];
}

async function validate(absPath: string, relPath: string): Promise<Violation | null> {
  // Skip non-image files and originals backups
  if (relPath.includes("/_originals/")) return null;
  if (!/\.(jpe?g|png|webp)$/i.test(absPath)) return null;

  const rule = ruleFor(relPath);
  if (!rule) return null;

  const reasons: string[] = [];
  let stat;
  try {
    stat = await fs.stat(absPath);
  } catch {
    return { file: relPath, reasons: ["file not found"] };
  }
  if (stat.size > rule.maxBytes) {
    reasons.push(`size ${(stat.size / 1024).toFixed(0)}KB exceeds ${(rule.maxBytes / 1024).toFixed(0)}KB`);
  }
  try {
    const meta = await sharp(absPath).metadata();
    if (!meta.width || !meta.height) {
      reasons.push("unreadable dimensions");
    } else {
      // Allow either 1x or @2x sizing
      const w = meta.width, h = meta.height;
      const isOneX = Math.abs(w - rule.width) <= 10 && Math.abs(h - rule.height) <= 10;
      const isTwoX = Math.abs(w - rule.width * 2) <= 20 && Math.abs(h - rule.height * 2) <= 20;
      if (!isOneX && !isTwoX) {
        const targetAspect = rule.width / rule.height;
        const actualAspect = w / h;
        if (Math.abs(targetAspect - actualAspect) > rule.aspectTolerance) {
          reasons.push(`aspect ${actualAspect.toFixed(2)} ≠ target ${targetAspect.toFixed(2)} (±${rule.aspectTolerance})`);
        }
        if (w < rule.width * 0.9) {
          reasons.push(`width ${w}px below ${rule.width}px minimum`);
        }
      }
    }
  } catch (e) {
    reasons.push(`sharp error: ${(e as Error).message}`);
  }
  return reasons.length ? { file: relPath, reasons } : null;
}

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.name === "_originals" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

async function main() {
  const args = process.argv.slice(2);
  let files: string[];
  if (args.length > 0) {
    files = args.map((a) => path.isAbsolute(a) ? a : path.join(ROOT, a));
  } else {
    files = [];
    for (const r of RULES) {
      const sub = path.join(PUBLIC_DIR, r.prefix);
      files.push(...(await walk(sub)));
    }
  }

  const violations: Violation[] = [];
  for (const abs of files) {
    const rel = path.relative(PUBLIC_DIR, abs);
    const v = await validate(abs, rel);
    if (v) violations.push(v);
  }

  if (violations.length === 0) {
    console.log(`✓ ${files.length} image(s) validated, no issues.`);
    return;
  }

  console.error(`✗ ${violations.length} image(s) failed validation:`);
  for (const v of violations) {
    console.error(`  ${v.file}`);
    for (const r of v.reasons) console.error(`    – ${r}`);
  }
  console.error(`\nRun \`npm run images:process\` to normalize, or replace the source.`);
  console.error(`See docs/image-guidelines.md for canonical dimensions.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
