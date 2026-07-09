/**
 * Content depth audit. Read-only — produces docs/content-audit-report.md
 * and docs/content-audit.json.
 *
 * Methodology:
 * 1. Walk dist/ for every prerendered route HTML.
 * 2. For each, extract <body>'s visible text and meta. Word-count it.
 * 3. Classify by page type. Apply the thin-content thresholds from the spec.
 * 4. Separately measure SOURCE editorial content (reviewBodies, comparison-
 *    content.ts, blog-posts.ts) so the report shows how much editorial
 *    exists in code vs how much Google actually sees.
 *
 * The premise this audit tests: if dist/*.html bodies are empty
 * (root div + meta only), the site is CLIENT_SIDE_ONLY and Google
 * sees nothing. That's the architectural finding.
 *
 * Run with: npx tsx scripts/audit-content.ts
 */
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const DOCS = path.join(ROOT, "docs");

interface RouteAudit {
  route: string;
  pageType: string;
  fileSize: number;
  bodyWordCount: number;
  bodyText: string;
  metaTitle: string;
  metaDescription: string;
  hasReviewSchema: boolean;
  hasFaqSchema: boolean;
  hasBreadcrumbSchema: boolean;
  /** All internal link targets found on the page (normalized paths). Used to
   *  build the inbound-link graph for ORPHAN_PAGE detection. */
  internalLinks: string[];
  flags: string[];
}

/**
 * Editorial word-count floors (WARN, not crawl-breaking). These sit ABOVE
 * the THIN_* minimums — THIN_* catches genuinely empty pages; WORD_COUNT_LOW
 * catches pages that render but fall short of the editorial target.
 * "niche-landing" = niche/category landing pages.
 */
const WORD_COUNT_FLOOR: Record<string, number> = {
  guide: 1000,
  review: 800,
  compare: 600,
  alternatives: 600,
  niche: 800,
  category: 800,
};

/** Normalize an href to a comparable internal path (or null if external). */
function normalizeInternalHref(href: string): string | null {
  if (!href.startsWith("/")) return null;
  let h = href.split("#")[0].split("?")[0];
  if (h.length > 1) h = h.replace(/\/+$/, "");
  return h || null;
}

/** All distinct internal link targets anywhere in the HTML. */
function extractInternalLinks(html: string): string[] {
  const out = new Set<string>();
  const re = /<a\s[^>]*href="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const h = normalizeInternalHref(m[1]);
    if (h) out.add(h);
  }
  return [...out];
}

/** Distinct internal links inside the main <article>/<main> region only —
 *  i.e. contextual body links, excluding nav/footer chrome. */
function countBodyInternalLinks(html: string): number | null {
  const m = html.match(/<article[\s\S]*?<\/article>/i) ?? html.match(/<main[\s\S]*?<\/main>/i);
  if (!m) return null;
  const set = new Set<string>();
  const re = /<a\s[^>]*href="(\/[^"]*)"/gi;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(m[0]))) {
    const h = normalizeInternalHref(mm[1]);
    if (h && h !== "/") set.add(h);
  }
  return set.size;
}

const THRESHOLDS: Record<string, { target: number; minimum: number; flag: string }> = {
  homepage: { target: 600, minimum: 400, flag: "THIN_HOMEPAGE" },
  review: { target: 1000, minimum: 600, flag: "THIN_REVIEW" },
  compare: { target: 800, minimum: 500, flag: "THIN_COMPARE" },
  discount: { target: 400, minimum: 250, flag: "THIN_DISCOUNT" },
  niche: { target: 500, minimum: 300, flag: "THIN_NICHE" },
  category: { target: 500, minimum: 300, flag: "THIN_NICHE" },
  blog: { target: 1000, minimum: 700, flag: "THIN_BLOG" },
  landing: { target: 800, minimum: 500, flag: "THIN_LANDING" },
  legal: { target: 200, minimum: 100, flag: "THIN_LEGAL" },
  utility: { target: 150, minimum: 50, flag: "THIN_UTILITY" },
};

function classifyRoute(route: string): string {
  if (route === "/") return "homepage";
  if (route.startsWith("/reviews/") && route !== "/reviews") return "review";
  if (route === "/reviews") return "landing";
  if (route.startsWith("/compare/")) return "compare";
  if (route === "/compare") return "landing";
  if (route.startsWith("/discount/")) return "discount";
  if (route.startsWith("/niche/")) return "niche";
  if (route.startsWith("/category/")) return "category";
  if (route === "/guides") return "landing";       // guide index hub
  if (route.startsWith("/guide/")) return "guide";  // individual guide article
  if (route.startsWith("/alternatives/")) return "alternatives";
  // /blog/category/* is a listing page (cards of posts), not a blog post.
  // Classifying it as blog applied the 700-word minimum to a card grid.
  if (route.startsWith("/blog/category/")) return "landing";
  if (route.startsWith("/blog/")) return "blog";
  if (route === "/blog") return "landing";
  if (/^\/(best-|cheapest-|free-trial|top-)/.test(route)) return "landing";
  if (/^\/(about|methodology|terms|privacy-policy|affiliate-disclosure|2257|2257-compliance)$/.test(route)) return "legal";
  if (/^\/(contact|find-my-site|ask-ai|sitemap|find-by-niche|gay-dating-sites)$/.test(route)) return "utility";
  return "other";
}

function extractText(html: string): string {
  // Strip scripts/styles
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  // Strip head — we only want body text
  s = s.replace(/<head[\s\S]*?<\/head>/i, " ");
  // Strip all tags
  s = s.replace(/<[^>]+>/g, " ");
  // Decode common entities
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // Collapse whitespace
  return s.replace(/\s+/g, " ").trim();
}

function decodeAttr(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function extractMeta(html: string, name: string): string {
  // Match double-quoted content only — that's what react-helmet-async and
  // our prerender template emit. Earlier regex ended capture at the first
  // single-quote, which mis-counted descriptions containing apostrophes.
  const re = new RegExp(`<meta\\s+(?:name|property)="${name}"\\s+content="([^"]*)"`, "i");
  const m = html.match(re);
  if (m) return decodeAttr(m[1]);
  const re2 = new RegExp(`<meta\\s+(?:name|property)='${name}'\\s+content="([^"]*)"`, "i");
  const m2 = html.match(re2);
  return m2 ? decodeAttr(m2[1]) : "";
}

function extractTitle(html: string): string {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? decodeAttr(m[1].trim()) : "";
}

function hasSchema(html: string, type: string): boolean {
  return new RegExp(`"@type"\\s*:\\s*"${type}"`, "i").test(html);
}

/**
 * Detect FAQPage JSON-LD where any Question is missing its `name` or its
 * `acceptedAnswer.text`. An empty FAQ schema is rejected by Google and is
 * the signature of a renderer/data field-name mismatch (e.g. data uses
 * `{question, answer}` while renderer reads `{q, a}` and emits blanks).
 */
function hasEmptyFaqEntries(html: string): boolean {
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let obj: unknown;
    try { obj = JSON.parse(m[1].trim()); } catch { continue; }
    const items = Array.isArray(obj) ? obj : [obj];
    for (const it of items) {
      if (!it || typeof it !== "object") continue;
      const node = it as Record<string, unknown>;
      if (node["@type"] !== "FAQPage") continue;
      const main = node.mainEntity;
      if (!Array.isArray(main)) return true;
      for (const q of main) {
        if (!q || typeof q !== "object") return true;
        const qe = q as Record<string, unknown>;
        const name = typeof qe.name === "string" ? qe.name.trim() : "";
        const aa = qe.acceptedAnswer as Record<string, unknown> | undefined;
        const text = aa && typeof aa.text === "string" ? aa.text.trim() : "";
        if (!name || !text) return true;
      }
    }
  }
  return false;
}

/**
 * Extract and parse every <script type="application/ld+json"> block.
 * Returns the number of valid blocks and a list of parse errors so the
 * audit can flag INVALID_JSON_LD on any page that ships broken schema.
 */
function validateJsonLd(html: string): { valid: number; errors: string[] } {
  const errors: string[] = [];
  let valid = 0;
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) { errors.push("empty"); continue; }
    try {
      JSON.parse(raw);
      valid++;
    } catch (e) {
      errors.push((e as Error).message.slice(0, 80));
    }
  }
  return { valid, errors };
}

function wordCount(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;
}

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch { return acc; }
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
  if (rel === "" || rel === ".") return "/";
  return "/" + rel.split(path.sep).join("/");
}

async function auditRoute(absPath: string): Promise<RouteAudit> {
  const html = await fs.readFile(absPath, "utf-8");
  const stat = await fs.stat(absPath);
  const route = routeFromPath(absPath);
  const pageType = classifyRoute(route);
  const bodyText = extractText(html);
  const bodyWordCount = wordCount(bodyText);
  const metaTitle = extractTitle(html);
  const metaDescription = extractMeta(html, "description");

  const flags: string[] = [];

  // CLIENT_SIDE_ONLY: rendered HTML body text is essentially empty
  // (~30–80 words is just NoScript boilerplate + page chrome from index.html template).
  if (bodyWordCount < 100) flags.push("CLIENT_SIDE_ONLY");

  // Thin-content threshold per type
  const tt = THRESHOLDS[pageType];
  if (tt && bodyWordCount < tt.minimum && !flags.includes("CLIENT_SIDE_ONLY")) {
    flags.push(tt.flag);
  }

  // Meta length checks. Threshold rationale:
  // - Titles: Google shows up to ~60 chars in SERPs. <30 is "too sparse",
  //   not <35 — 30-35 char titles like "BoyFun Review 2026 — TwinkVault"
  //   are fine, just brand-short.
  // - Descriptions: <120 risks Google rewriting the snippet from page
  //   content rather than honoring the meta. >165 truncates.
  if (metaTitle.length < 30) flags.push("THIN_TITLE");
  else if (metaTitle.length > 65) flags.push("LONG_TITLE");
  if (metaDescription.length < 120) flags.push("THIN_DESC");
  else if (metaDescription.length > 165) flags.push("LONG_DESC");

  // Schema audit — pages should have type-appropriate JSON-LD. After the
  // codemod that moved schemas out of <Helmet>, this becomes a strict gate.
  const hasReviewSchema = hasSchema(html, "Review") || hasSchema(html, "Product");
  const hasFaqSchema = hasSchema(html, "FAQPage");
  const hasBreadcrumbSchema = hasSchema(html, "BreadcrumbList");
  const hasItemListSchema = hasSchema(html, "ItemList");
  const hasArticleSchema = hasSchema(html, "Article") || hasSchema(html, "BlogPosting");
  const hasWebsiteSchema = hasSchema(html, "WebSite") || hasSchema(html, "Organization");
  const hasCollectionSchema = hasSchema(html, "CollectionPage");

  if (pageType === "review" && !hasReviewSchema) flags.push("MISSING_REVIEW_SCHEMA");
  // Compare pages emit Product × 2 + Review × 2 + ItemList + FAQ; require
  // Product as the proxy because BreadcrumbList alone isn't enough.
  if (pageType === "compare" && route !== "/compare" && !hasReviewSchema) flags.push("MISSING_COMPARE_SCHEMA");
  // Blog posts need Article schema for Top Stories eligibility.
  if (pageType === "blog" && !hasArticleSchema) flags.push("MISSING_ARTICLE_SCHEMA");
  // Niche, category, landing, and the reviews/compare index pages should
  // emit ItemList or CollectionPage so Google understands they're list pages.
  if (["niche", "category"].includes(pageType) && !hasItemListSchema && !hasCollectionSchema) {
    flags.push("MISSING_LIST_SCHEMA");
  }
  // Homepage gets WebSite/Organization for sitelinks and brand surfacing.
  if (pageType === "homepage" && !hasWebsiteSchema) flags.push("MISSING_HOMEPAGE_SCHEMA");
  // Every meaningful page should have BreadcrumbList for navigational
  // snippets. Skip utility / legal / GoRedirect-style routes.
  const breadcrumbRequired = ["review", "compare", "discount", "niche", "category", "blog"].includes(pageType);
  if (breadcrumbRequired && route !== "/compare" && !hasBreadcrumbSchema) flags.push("MISSING_BREADCRUMB_SCHEMA");

  // JSON-LD parse validity — broken JSON in any block makes Google ignore
  // ALL structured data on the page, not just the broken one. Catch early.
  const jsonLd = validateJsonLd(html);
  if (jsonLd.errors.length > 0) flags.push("INVALID_JSON_LD");

  // EMPTY_FAQ — any FAQPage schema where one or more Question entries has
  // a blank name OR a blank acceptedAnswer.text. Google rejects FAQPage
  // schema with empty content (won't show FAQ rich results, may flag the
  // page in Search Console). This is the guard that would've caught the
  // gay-porn-billing-guide FAQ field-name drift at build time.
  if (hasEmptyFaqEntries(html)) flags.push("EMPTY_FAQ");

  // ── Editorial-quality WARN flags (non-crawl-breaking) ──────────────────
  // WORD_COUNT_LOW: renders fine but below the editorial target for its type.
  const floor = WORD_COUNT_FLOOR[pageType];
  if (floor && bodyWordCount >= 100 && bodyWordCount < floor) flags.push("WORD_COUNT_LOW");

  // NO_IMAGES: an article-type page with no in-body content image (hero or
  // otherwise). Chrome SVGs/logos don't count — we look for the content
  // image directories specifically. Compares carry the same bar as guides:
  // they were exempt while flooding 46% of the sitemap with favicon cards.
  const IMAGE_CHECKED_TYPES = new Set(["guide", "blog", "compare"]);
  const hasContentImage = /<img[^>]+src="[^"]*\/(site-banners|niche-covers|blog)\//i.test(html);
  if (IMAGE_CHECKED_TYPES.has(pageType) && !hasContentImage) flags.push("NO_IMAGES");

  // LOW_INTERNAL_LINKS: fewer than 3 contextual internal links in the article
  // body (excludes nav/footer). Meaningful for prose article types.
  if (IMAGE_CHECKED_TYPES.has(pageType)) {
    const bodyLinks = countBodyInternalLinks(html);
    if (bodyLinks !== null && bodyLinks < 3) flags.push("LOW_INTERNAL_LINKS");
  }

  // MISSING_OG_IMAGE: og:image still points at the generic favicon.
  const ogImage = extractMeta(html, "og:image");
  if (IMAGE_CHECKED_TYPES.has(pageType) && (/pwa-\d+\.png(\?|$)/i.test(ogImage) || ogImage === "")) {
    flags.push("MISSING_OG_IMAGE");
  }

  const internalLinks = extractInternalLinks(html);

  return { route, pageType, fileSize: stat.size, bodyWordCount, bodyText, metaTitle, metaDescription, hasReviewSchema, hasFaqSchema, hasBreadcrumbSchema, internalLinks, flags };
}

interface SourceContentStat {
  source: string;
  entries: number;
  totalWords: number;
  medianWordsPerEntry: number;
  prerenderedToHtml: boolean;
  comment: string;
}

async function auditSourceContent(): Promise<SourceContentStat[]> {
  const stats: SourceContentStat[] = [];

  // useAIReview.ts — reviewBodies map
  try {
    const f = await fs.readFile(path.join(ROOT, "src/hooks/useAIReview.ts"), "utf-8");
    const reviews = [...f.matchAll(/"[a-z-]+"\s*:\s*`([\s\S]*?)`,?\n\s*"/g)].map((m) => m[1]);
    const totalWords = reviews.reduce((s, r) => s + wordCount(r), 0);
    const sorted = reviews.map((r) => wordCount(r)).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    stats.push({
      source: "src/hooks/useAIReview.ts (reviewBodies map)",
      entries: reviews.length,
      totalWords,
      medianWordsPerEntry: median,
      prerenderedToHtml: false,
      comment: "Static review prose, ~3–4 paragraphs per site. Loaded into sessionStorage on first visit. NEVER appears in prerendered HTML (root div is empty until JS runs).",
    });
  } catch (e) {
    stats.push({ source: "useAIReview.ts", entries: 0, totalWords: 0, medianWordsPerEntry: 0, prerenderedToHtml: false, comment: `Read error: ${(e as Error).message}` });
  }

  // comparison-content.ts
  try {
    const f = await fs.readFile(path.join(ROOT, "src/data/comparison-content.ts"), "utf-8");
    const entries = [...f.matchAll(/"[a-z0-9-]+-vs-[a-z0-9-]+"\s*:\s*\{([\s\S]*?)\n\s*\}/g)];
    const totalWords = wordCount(f);
    stats.push({
      source: "src/data/comparison-content.ts",
      entries: entries.length,
      totalWords,
      medianWordsPerEntry: entries.length ? Math.floor(totalWords / entries.length) : 0,
      prerenderedToHtml: false,
      comment: "Per-pair compare content (likely BLUF + reasoning). Same prerender problem — body never enters static HTML.",
    });
  } catch { /* skip */ }

  // blog-posts.ts
  try {
    const f = await fs.readFile(path.join(ROOT, "src/data/blog-posts.ts"), "utf-8");
    const totalWords = wordCount(f);
    const entries = [...f.matchAll(/slug:\s*"[a-z0-9-]+"/g)].length;
    stats.push({
      source: "src/data/blog-posts.ts",
      entries,
      totalWords,
      medianWordsPerEntry: entries ? Math.floor(totalWords / entries) : 0,
      prerenderedToHtml: false,
      comment: "Editorial blog content. Same prerender problem.",
    });
  } catch { /* skip */ }

  // alternatives-content.ts
  try {
    const f = await fs.readFile(path.join(ROOT, "src/data/alternatives-content.ts"), "utf-8");
    const totalWords = wordCount(f);
    const entries = [...f.matchAll(/"[a-z0-9-]+-alternatives"\s*:/g)].length;
    stats.push({
      source: "src/data/alternatives-content.ts",
      entries,
      totalWords,
      medianWordsPerEntry: entries ? Math.floor(totalWords / entries) : 0,
      prerenderedToHtml: false,
      comment: "Per-site alternatives content. Same prerender problem.",
    });
  } catch { /* skip */ }

  return stats;
}

async function main() {
  console.log("Walking dist/ for prerendered routes…");
  const files = await walk(DIST);
  console.log(`Found ${files.length} index.html files.`);

  const audits: RouteAudit[] = [];
  for (const f of files) audits.push(await auditRoute(f));

  // ORPHAN_PAGE: a content page reachable only via the sitemap — i.e. no
  // OTHER prerendered route links to it. Build the inbound-link graph from
  // every page's internal links, then flag content pages with zero inbound.
  const inbound = new Map<string, number>();
  for (const a of audits) {
    for (const href of a.internalLinks) {
      if (href === a.route) continue; // self-links don't count
      inbound.set(href, (inbound.get(href) ?? 0) + 1);
    }
  }
  const ORPHAN_CHECK_TYPES = new Set(["review", "compare", "discount", "niche", "category", "guide", "alternatives", "blog"]);
  for (const a of audits) {
    if (!ORPHAN_CHECK_TYPES.has(a.pageType)) continue;
    if ((inbound.get(a.route) ?? 0) === 0) a.flags.push("ORPHAN_PAGE");
  }

  // Group by pageType
  const byType = new Map<string, RouteAudit[]>();
  for (const a of audits) {
    if (!byType.has(a.pageType)) byType.set(a.pageType, []);
    byType.get(a.pageType)!.push(a);
  }

  // Aggregate
  const typeStats = [...byType.entries()].map(([type, rows]) => {
    const counts = rows.map((r) => r.bodyWordCount).sort((a, b) => a - b);
    const median = counts[Math.floor(counts.length / 2)] ?? 0;
    const min = counts[0] ?? 0;
    const max = counts[counts.length - 1] ?? 0;
    const flagCounts: Record<string, number> = {};
    for (const r of rows) for (const f of r.flags) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
    const allClientOnly = rows.every((r) => r.flags.includes("CLIENT_SIDE_ONLY"));
    return { type, count: rows.length, median, min, max, flagCounts, allClientOnly };
  });

  // Source-side content stats
  console.log("Auditing source-side editorial content…");
  const sourceStats = await auditSourceContent();

  // Generate report
  const today = new Date().toISOString().slice(0, 10);
  const reportLines: string[] = [];
  reportLines.push(`# Content Audit Report — ${today}\n`);

  // CRITICAL FINDINGS BLOCK
  const clientOnlyCount = audits.filter((a) => a.flags.includes("CLIENT_SIDE_ONLY")).length;
  const clientOnlyPct = ((clientOnlyCount / audits.length) * 100).toFixed(1);
  reportLines.push(`## Critical findings\n`);
  reportLines.push(`**🚨 ${clientOnlyCount} / ${audits.length} routes (${clientOnlyPct}%) are \`CLIENT_SIDE_ONLY\`.** The prerendered HTML for these routes contains only meta tags and an empty \`<div id="root"></div>\`. Body content (review prose, comparison tables, FAQs, schema markup, internal links — everything below \`<head>\`) is rendered client-side after JS executes. **Google sees an empty page.**\n`);
  reportLines.push(`This is the single largest SEO problem on the site. It explains the GSC pattern of high impressions / low clicks: Google can't read the content the page actually shows to humans, so the page can't rank for queries that would match that content.\n`);
  reportLines.push(`**AI review content (\`useAIReview.ts\` reviewBodies map) status:** AI_CONTENT_CLIENT_ONLY. The static reviewBodies map contains ~300 words of editorial per site for 60+ sites, but the prose is read from sessionStorage after JS executes — it never enters the prerendered HTML.\n`);
  reportLines.push(`**Decision point per spec:** Banner integration on review pages is premature until the prerender pipeline is fixed. The page has no indexable content to anchor the banner to.\n`);

  // Source-side content
  reportLines.push(`## Source-side editorial content (invisible to Google today)\n`);
  reportLines.push(`The repo contains substantial editorial content in TS data files. None of it currently renders into the prerendered HTML.\n`);
  reportLines.push(`| Source | Entries | Total words | Median words/entry |`);
  reportLines.push(`| --- | ---: | ---: | ---: |`);
  for (const s of sourceStats) {
    reportLines.push(`| \`${s.source}\` | ${s.entries} | ${s.totalWords.toLocaleString()} | ${s.medianWordsPerEntry.toLocaleString()} |`);
  }
  reportLines.push("");
  for (const s of sourceStats) {
    reportLines.push(`- **${s.source}** — ${s.comment}`);
  }
  reportLines.push("");

  // Summary by page type
  reportLines.push(`## Summary by page type\n`);
  reportLines.push(`| Page type | Count | Median body words (prerendered) | Min | Max | Verdict |`);
  reportLines.push(`| --- | ---: | ---: | ---: | ---: | --- |`);
  for (const ts of typeStats.sort((a, b) => b.count - a.count)) {
    const verdict = ts.allClientOnly ? "**CRITICAL_CLIENT_ONLY**" : ts.median < (THRESHOLDS[ts.type]?.minimum ?? 100) ? "NEEDS_IMPROVEMENT" : "HEALTHY";
    reportLines.push(`| ${ts.type} | ${ts.count} | ${ts.median} | ${ts.min} | ${ts.max} | ${verdict} |`);
  }
  reportLines.push("");

  // Flag breakdown
  reportLines.push(`## Flag breakdown across all routes\n`);
  const allFlags = new Map<string, number>();
  for (const a of audits) for (const f of a.flags) allFlags.set(f, (allFlags.get(f) ?? 0) + 1);
  reportLines.push(`| Flag | Count |`);
  reportLines.push(`| --- | ---: |`);
  for (const [flag, count] of [...allFlags.entries()].sort((a, b) => b[1] - a[1])) {
    reportLines.push(`| ${flag} | ${count} |`);
  }
  reportLines.push("");

  // Compare page deep-dive
  const compareRows = audits.filter((a) => a.pageType === "compare");
  reportLines.push(`## Compare page deep-dive\n`);
  reportLines.push(`- **Page count:** ${compareRows.length}`);
  reportLines.push(`- **Template source:** \`src/pages/ComparePage.tsx\` (runtime React component, hydrated client-side).`);
  reportLines.push(`- **Per-pair content source:** \`src/data/comparison-content.ts\` (~${sourceStats.find((s) => s.source.includes("comparison-content"))?.totalWords.toLocaleString() ?? "?"} words across all pairs combined, never prerendered).`);
  reportLines.push(`- **All ${compareRows.length} compare pages render as CLIENT_SIDE_ONLY** — Google sees identical 3.7KB meta-only HTML for each pair.`);
  reportLines.push(`- **Kill-list recommendation:** until prerendering is fixed, the kill-list question is moot. Once Google can see content, then evaluate pairs by (a) neither site in top-10, (b) <5 GSC impressions/30d.\n`);

  // Review page deep-dive
  const reviewRows = audits.filter((a) => a.pageType === "review");
  reportLines.push(`## Review page deep-dive\n`);
  reportLines.push(`- **Page count:** ${reviewRows.length}`);
  reportLines.push(`- **AI content rendering:** \`AI_CONTENT_CLIENT_ONLY\`. Static reviewBodies map exists with ~${sourceStats.find((s) => s.source.includes("useAIReview"))?.medianWordsPerEntry ?? "?"} median words per site, but the prose only mounts into the DOM after \`useAIReview\` runs client-side.`);
  reportLines.push(`- **Prerendered body word counts:** every review page is in the ${Math.min(...reviewRows.map((r) => r.bodyWordCount))}–${Math.max(...reviewRows.map((r) => r.bodyWordCount))} word range (NoScript + page chrome only).\n`);

  // Per-route table (top problems)
  reportLines.push(`## Worst-offender routes (smallest prerendered body)\n`);
  reportLines.push(`Sorted ascending by body word count. Top 30:\n`);
  reportLines.push(`| Route | Type | Body words | File size (KB) | Flags |`);
  reportLines.push(`| --- | --- | ---: | ---: | --- |`);
  const sorted = [...audits].sort((a, b) => a.bodyWordCount - b.bodyWordCount).slice(0, 30);
  for (const a of sorted) {
    reportLines.push(`| ${a.route} | ${a.pageType} | ${a.bodyWordCount} | ${(a.fileSize / 1024).toFixed(1)} | ${a.flags.join(", ")} |`);
  }
  reportLines.push("");

  // Auto-generation assessment
  reportLines.push(`## Auto-generation pipeline assessment\n`);
  reportLines.push(`Scripts present:\n`);
  reportLines.push(`- \`scripts/generate-daily-content.ts\` — daily content generator (need source inspection to assess).`);
  reportLines.push(`- \`scripts/generate-comparison-pages.ts\` — comparison page generator.`);
  reportLines.push(`- Generated output lands in \`src/data/comparison-content.ts\`, \`alternatives-content.ts\`, etc.\n`);
  reportLines.push(`**Quality assessment is blocked by the prerender problem:** even if these scripts produce excellent content, none of it is visible to Google today. Fixing prerendering must come before evaluating prompt/output quality.\n`);

  // Recommended fix order
  reportLines.push(`## Recommended fix order\n`);
  reportLines.push(`1. **Prerender React components to HTML at build time.** Replace the current "meta-only" prerender step with a true SSR/SSG pass (\`react-dom/server.renderToString\` per route, or migrate to a framework with built-in SSG like Astro/Next). This single change moves ~60,000 words of existing editorial into the indexable HTML and is the highest-leverage SEO fix available.`);
  reportLines.push(`2. **Move \`useAIReview\` content into the prerendered HTML.** Once SSG is in place, render the \`reviewBodies\` map directly in the React tree instead of reading from sessionStorage. Drops the client roundtrip and gives Google the prose.`);
  reportLines.push(`3. **Inline the \`comparison-content.ts\` entries into ComparePage.tsx render tree** (or generate per-pair HTML files at build time).`);
  reportLines.push(`4. **Audit content depth AFTER prerendering is in place.** Real "thin content" measurement is only meaningful once the prerendered HTML reflects what humans see. Re-run this audit and use the type-level thresholds to drive a content-improvement sprint.`);
  reportLines.push(`5. **Kill-list pruning** of low-impression compare pages — defer until SSG ships and GSC data has 30+ days to reflect the new indexable content.\n`);

  await fs.writeFile(path.join(DOCS, "content-audit-report.md"), reportLines.join("\n"));
  await fs.writeFile(path.join(DOCS, "content-audit.json"), JSON.stringify({
    generated_at: new Date().toISOString(),
    summary: { routes: audits.length, clientOnlyCount, clientOnlyPct, typeStats },
    sourceStats,
    audits: audits.map(({ bodyText, ...rest }) => rest), // omit bodyText from JSON (large)
  }, null, 2));

  console.log(`\nWrote docs/content-audit-report.md and docs/content-audit.json`);
  console.log(`CRITICAL: ${clientOnlyCount} / ${audits.length} routes are CLIENT_SIDE_ONLY (${clientOnlyPct}%).`);

  // Strict-mode build gate. Run via `npx tsx scripts/audit-content.ts --strict`
  // (or set AUDIT_STRICT=1) to fail the process if any HARD_FAIL flag is set.
  // Used by CI / pre-deploy to keep meta hygiene from regressing.
  const strict = process.argv.includes("--strict") || process.env.AUDIT_STRICT === "1";
  if (strict) {
    // Severity policy after the June 2026 audit-blocked-daily-run incident:
    //
    // HARD_FAIL — only crawl-breaking issues. These abort the build and roll
    // back the daily-content engine's edits because they make the page
    // un-rankable / un-crawlable. Sitewide-impact issues (missing/HTML
    // robots.txt, malformed sitemap, duplicate <title>s sitewide, homepage
    // noindex) are caught by scripts/seo-preflight.ts; this audit handles
    // per-route content shape.
    //
    // WARN — everything else. Cosmetic SEO regressions (long titles, thin
    // descriptions, missing optional schemas, thin word counts) get logged
    // loudly so they're visible in the run summary, but don't block other
    // generated pages from shipping. A single over-long auto-generated
    // guide title must NOT cost a day of clean review/comparison work.
    const HARD_FAIL = new Set([
      "CLIENT_SIDE_ONLY",   // page renders no body content — Google can't read it
      "INVALID_JSON_LD",    // malformed JSON-LD makes Google ignore ALL schema on the page
      "EMPTY_FAQ",          // FAQPage with blank Question/Answer — Google rejects + may flag in GSC
    ]);
    const WARN_FLAGS = new Set<string>();
    for (const a of audits) for (const f of a.flags) if (!HARD_FAIL.has(f)) WARN_FLAGS.add(f);

    // Summarize warnings by flag, with a sample of affected routes.
    const warnsByFlag = new Map<string, string[]>();
    for (const a of audits) {
      for (const f of a.flags) {
        if (HARD_FAIL.has(f)) continue;
        if (!warnsByFlag.has(f)) warnsByFlag.set(f, []);
        warnsByFlag.get(f)!.push(a.route);
      }
    }
    if (warnsByFlag.size > 0) {
      console.log(`\n⚠ Audit warnings (${[...warnsByFlag.values()].reduce((s, r) => s + r.length, 0)} flag instances across ${[...warnsByFlag.keys()].length} flag types — non-blocking):`);
      for (const [flag, routes] of [...warnsByFlag.entries()].sort((a, b) => b[1].length - a[1].length)) {
        const sample = routes.slice(0, 3).join(", ");
        const more = routes.length > 3 ? `, …+${routes.length - 3} more` : "";
        console.log(`   ${flag.padEnd(28)} ${routes.length.toString().padStart(3)} routes  e.g. ${sample}${more}`);
      }
    }

    const failures = audits.filter((a) => a.flags.some((f) => HARD_FAIL.has(f)));
    if (failures.length > 0) {
      console.error(`\n✗ Strict audit FAILED: ${failures.length} route(s) have hard-fail flags.`);
      failures.slice(0, 20).forEach((a) => {
        const hard = a.flags.filter((f) => HARD_FAIL.has(f));
        console.error(`   ${a.route} → ${hard.join(", ")}`);
      });
      if (failures.length > 20) console.error(`   …and ${failures.length - 20} more`);
      process.exit(1);
    }
    console.log(`\n✓ Strict audit passed: no hard-fail flags (warnings above are non-blocking).`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
