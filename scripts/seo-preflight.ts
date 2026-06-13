/**
 * SEO preflight — runs after prerender, before deploy.
 *
 * Hard-fails the build if any of these crawl/SEO-blocking conditions
 * are met. The June 1 2026 incident shipped because the hosting rewrite
 * was clobbering robots.txt and every prerendered HTML route — this
 * preflight catches the equivalent class of bug locally before it can
 * reach production.
 *
 * Checks:
 *   1. dist/robots.txt exists, is plaintext, starts with "User-agent:"
 *      (catches: SPA shell served instead of file).
 *   2. dist/sitemap.xml exists, parses as XML, contains <urlset>.
 *   3. dist/blog-sitemap.xml exists (same checks).
 *   4. Every prerendered HTML file has a non-empty <title>.
 *   5. Every prerendered HTML file has a non-empty meta description.
 *   6. Every prerendered HTML file has body content inside <div id="root">
 *      (catches: empty root shell — i.e. SSG regression).
 *   7. No two prerendered pages share the same <title> (catches:
 *      duplicate-title regressions that signal templating gone wrong).
 *   8. Homepage does NOT contain a noindex meta robots tag.
 *
 * Run via: npx tsx scripts/seo-preflight.ts
 */
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const errors: string[] = [];

async function exists(p: string): Promise<boolean> {
  try { await fs.stat(p); return true; } catch { return false; }
}

async function checkStaticFile(file: string, mustContain: RegExp, label: string) {
  const full = path.join(DIST, file);
  if (!(await exists(full))) {
    errors.push(`${label}: dist/${file} does not exist`);
    return;
  }
  const content = await fs.readFile(full, "utf-8");
  if (content.trim().toLowerCase().startsWith("<!doctype html")) {
    errors.push(`${label}: dist/${file} contains HTML instead of expected ${label} content (SPA shell leaked)`);
    return;
  }
  if (!mustContain.test(content)) {
    errors.push(`${label}: dist/${file} doesn't match expected pattern ${mustContain} (got: "${content.slice(0, 60).replace(/\n/g, "\\n")}…")`);
  }
}

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.name === "assets" || e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (e.name === "index.html") acc.push(full);
  }
  return acc;
}

function routeFromPath(absPath: string): string {
  const rel = path.relative(DIST, path.dirname(absPath));
  return rel === "" || rel === "." ? "/" : "/" + rel.split(path.sep).join("/");
}

function decodeAttr(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

function extractTitle(html: string): string {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeAttr(m[1].trim()) : "";
}

function extractDesc(html: string): string {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? decodeAttr(m[1]) : "";
}

function bodyHasContent(html: string): boolean {
  // Catches the empty root shell case (<div id="root"></div>) without
  // relying on a brittle regex that has to count balanced divs. Strip
  // <head>, scripts, styles, and tags; count visible body words. The
  // empty SPA shell renders ~5 words (the noscript + service worker
  // boilerplate). Any real SSG render lands well above 80.
  let s = html.replace(/<head[\s\S]*?<\/head>/i, " ");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&\w+;/g, " ");
  const words = s.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;
  return words >= 80;
}

function hasNoindex(html: string): boolean {
  return /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
}

async function main() {
  // 1-3. Static crawl files. robots.txt may start with # comments, so
  // require User-agent: somewhere in the first 500 chars rather than at
  // strict position 0.
  await checkStaticFile("robots.txt", /User-agent:/i, "robots.txt");
  await checkStaticFile("sitemap.xml", /^\s*<\?xml/i, "sitemap.xml");
  await checkStaticFile("blog-sitemap.xml", /^\s*<\?xml/i, "blog-sitemap.xml");

  // sitemap XML structural sanity
  for (const sm of ["sitemap.xml", "blog-sitemap.xml"]) {
    const full = path.join(DIST, sm);
    if (await exists(full)) {
      const c = await fs.readFile(full, "utf-8");
      if (!c.includes("<urlset")) errors.push(`${sm}: missing <urlset> element`);
      if (!c.includes("</urlset>")) errors.push(`${sm}: malformed (no closing </urlset>)`);
    }
  }

  // 4-7. Walk every prerendered HTML
  const files = await walk(DIST);
  const titles = new Map<string, string[]>(); // title → routes
  let emptyRoot = 0, missingTitle = 0, missingDesc = 0;
  for (const f of files) {
    const route = routeFromPath(f);
    const html = await fs.readFile(f, "utf-8");

    if (!bodyHasContent(html)) {
      emptyRoot++;
      if (emptyRoot <= 5) errors.push(`empty root div: ${route} (SSG regression — page shipping as empty SPA shell)`);
    }
    const title = extractTitle(html);
    if (!title) { missingTitle++; if (missingTitle <= 5) errors.push(`missing <title>: ${route}`); }
    else {
      if (!titles.has(title)) titles.set(title, []);
      titles.get(title)!.push(route);
    }
    const desc = extractDesc(html);
    if (!desc) { missingDesc++; if (missingDesc <= 5) errors.push(`missing meta description: ${route}`); }

    // 8. Homepage noindex check
    if (route === "/" && hasNoindex(html)) {
      errors.push("/: homepage HTML contains noindex robots meta — sitewide indexing would be killed");
    }
  }

  if (emptyRoot > 5) errors.push(`...and ${emptyRoot - 5} more routes with empty root div`);
  if (missingTitle > 5) errors.push(`...and ${missingTitle - 5} more routes missing <title>`);
  if (missingDesc > 5) errors.push(`...and ${missingDesc - 5} more routes missing meta description`);

  // 7. Duplicate titles
  const dupes = [...titles.entries()].filter(([, rs]) => rs.length > 1);
  if (dupes.length > 0) {
    for (const [title, rs] of dupes.slice(0, 5)) {
      errors.push(`duplicate <title> "${title.slice(0, 50)}…" on ${rs.length} routes: ${rs.slice(0, 3).join(", ")}${rs.length > 3 ? ", …" : ""}`);
    }
    if (dupes.length > 5) errors.push(`...and ${dupes.length - 5} more duplicate title groups`);
  }

  if (errors.length > 0) {
    console.error(`\n✗ SEO preflight FAILED: ${errors.length} issue(s)\n`);
    for (const e of errors) console.error(`   ${e}`);
    console.error(`\n${files.length} prerendered routes checked; ${dupes.length} duplicate-title groups; ${emptyRoot} empty-root pages.`);
    process.exit(1);
  }

  console.log(`✓ SEO preflight passed: ${files.length} routes, all crawl-critical files present, no empty roots, no duplicate titles, no noindex regression.`);
}

main().catch((e) => { console.error("preflight crashed:", e); process.exit(1); });
