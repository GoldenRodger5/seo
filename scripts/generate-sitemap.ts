import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { sites, categories } from "../src/data/sites.js";
import { getFeaturedComparePairsList } from "../src/data/featured-compare-pairs.js";
import { BLOG_POSTS, BLOG_CATEGORIES } from "../src/data/blog-posts.js";
import { ALTERNATIVES_CONTENT } from "../src/data/alternatives-content.js";
import { GUIDE_CONTENT } from "../src/data/guide-content.js";
import { ISWORTHIT_CONTENT } from "../src/data/isworthit-content.js";
import { readFileSync } from "fs";

// Per-route lastmod stamps written by generate-daily-content.ts whenever
// an AI body upserts. Falls back to TODAY if a route isn't stamped (e.g.
// for routes that get hand-edited but don't go through the daily engine).
let CONTENT_LASTMOD: Record<string, string> = {};
try {
  const __dirname2 = dirname(fileURLToPath(import.meta.url));
  CONTENT_LASTMOD = JSON.parse(readFileSync(resolve(__dirname2, "..", "docs/content-lastmod.json"), "utf-8"));
} catch { /* first run before any stamps */ }
// Only routes with a REAL content-change stamp get a <lastmod>. The old
// fallback stamped every unstamped URL with the build date — and since the
// engine deploys daily, the sitemap claimed ~399/409 URLs "changed today"
// every single day, teaching Google to distrust the signal entirely.
const lastmodFor = (path: string): string | undefined => CONTENT_LASTMOD[path];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = "https://twinkvault.com";
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

// Single source of truth — adding a site to sites.ts auto-includes it here.
const SITE_SLUGS = sites.map((s) => s.slug);
const CATEGORY_SLUGS = categories.map((c) => c.slug);

const NICHE_SLUGS = [
  "twink",
  "bareback",
  "asian",
  "latin",
  "bear",
  "daddy",
  "college",
  "military",
  "amateur",
  "big-dick",
  "jock",
  "uncut",
  "hairy",
  "smooth",
  "group",
  "fetish",
  "interracial",
  "muscle",
  "str8-curious",
  "japanese",
  "solo",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface UrlEntry {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

function urlEntry({ loc, changefreq, priority, lastmod }: UrlEntry): string {
  return [
    "  <url>",
    `    <loc>${BASE_URL}${loc}</loc>`,
    // <lastmod> only when we have a genuine content-change date — an
    // omitted lastmod is honest; a fabricated one erodes sitemap trust.
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

/**
 * Generate all unique pairs (order-independent) from an array of slugs.
 * For 12 slugs this yields C(12,2) = 66 pairs.
 */
function generatePairs(slugs: readonly string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      pairs.push([slugs[i], slugs[j]]);
    }
  }
  return pairs;
}

// ---------------------------------------------------------------------------
// Build URL list
// ---------------------------------------------------------------------------
const urls: string[] = [];

// Homepage
urls.push(urlEntry({ loc: "/", changefreq: "daily", priority: "1.0" }));

// Core content pages
const corePages = [
  "/top-sites",
  "/reviews",
  "/best-deals",
  "/compare",
  "/best-twink-sites",
  "/free-trial-twink-sites",
  "/cheapest-twink-sites",
  "/gay-dating-sites",
  "/best-gay-sites-under-10",
  "/best-bareback-gay-sites",
  "/best-asian-gay-sites",
  "/best-amateur-gay-sites",
  "/best-premium-gay-sites",
  "/helix-studios-alternatives",
  "/sean-cody-alternatives",
  "/nakedsword-alternatives",
  // Generic /alternatives/{slug} and /guide/{slug} routes are appended
  // dynamically below from the content data maps.
  "/best-gay-sites-for-beginners",
  "/best-gay-sites-with-downloads",
  "/best-daddy-twink-sites",
  "/best-twink-porn-sites-with-free-trials",
  "/best-cheap-gay-porn-sites",
  "/best-bareback-twink-sites",
  "/best-gay-porn-sites",
  "/best-gay-porn-subscription",
  "/best-twink-porn-sites",
  "/gay-porn-sites-with-free-trial",
  "/best-value-gay-porn-sites",
  "/gay-porn-site-reviews",
  "/gay-porn-sites-ranked",
  "/is-nakedsword-worth-it",
  "/is-sean-cody-worth-it",
  "/is-helix-studios-worth-it",
  "/is-men-worth-it",
  "/is-twinks-in-shorts-worth-it",
  "/is-southern-strokes-worth-it",
  "/is-peterfever-worth-it",
  "/is-sayuncle-worth-it",
  "/is-rawhole-worth-it",
  "/is-athletic-twinks-worth-it",
  "/blog",
];
for (const page of corePages) {
  urls.push(urlEntry({ loc: page, changefreq: "weekly", priority: "0.9" }));
}

// Interactive / tool pages
const toolPages = ["/ask-ai", "/find-my-site"];
for (const page of toolPages) {
  urls.push(urlEntry({ loc: page, changefreq: "monthly", priority: "0.7" }));
}

// Info pages
const infoPages = ["/about", "/methodology", "/contact", "/sitemap"];
for (const page of infoPages) {
  urls.push(urlEntry({ loc: page, changefreq: "monthly", priority: "0.5" }));
}

// Legal pages
const legalPages = [
  "/privacy-policy",
  "/affiliate-disclosure",
  "/terms",
  "/2257",
];
for (const page of legalPages) {
  urls.push(urlEntry({ loc: page, changefreq: "yearly", priority: "0.3" }));
}

// Review pages  /reviews/:slug — pending-review sites get a low priority
// (0.3) so they're discoverable but not prioritized for crawl until coverage
// is written.
const PENDING_REVIEW_SLUGS = new Set(
  sites.filter((s) => s.editorial_status === "pending-review").map((s) => s.slug)
);
for (const slug of SITE_SLUGS) {
  const pending = PENDING_REVIEW_SLUGS.has(slug);
  urls.push(
    urlEntry({
      loc: `/reviews/${slug}`,
      changefreq: pending ? "monthly" : "weekly",
      priority: pending ? "0.3" : "0.8",
    })
  );
}

// Discount pages  /discount/:slug — same downgrade for pending-review.
for (const slug of SITE_SLUGS) {
  const pending = PENDING_REVIEW_SLUGS.has(slug);
  urls.push(
    urlEntry({
      loc: `/discount/${slug}`,
      changefreq: pending ? "monthly" : "weekly",
      priority: pending ? "0.3" : "0.8",
    })
  );
}

// Category pages  /category/:slug
for (const slug of CATEGORY_SLUGS) {
  urls.push(
    urlEntry({
      loc: `/category/${slug}`,
      changefreq: "weekly",
      priority: "0.7",
    })
  );
}

// Niche pages  /niche/:slug — long-tail SEO
for (const slug of NICHE_SLUGS) {
  urls.push(
    urlEntry({
      loc: `/niche/${slug}`,
      changefreq: "weekly",
      priority: "0.8",
    })
  );
}

// Compare pages — only featured pairs are included in the sitemap. The
// other ~1,840 pairs are still reachable through internal links (the
// /compare picker UI, niche pages, related comparisons on review pages),
// but we don't actively ask Google to crawl them because they share a
// near-identical template and risk being classified as duplicates. The
// featured allowlist is computed at module-eval time from the live
// scoring algorithm, so this auto-updates as data changes.
const pairs = getFeaturedComparePairsList().map((slug): [string, string] => {
  const [a, b] = slug.split("-vs-");
  return [a, b];
});
for (const [a, b] of pairs) {
  const path = `/compare/${a}-vs-${b}`;
  urls.push(
    urlEntry({
      loc: path,
      changefreq: "monthly",
      priority: "0.6",
      lastmod: lastmodFor(path),
    })
  );
}

// Generic alternatives & guide pages — generated by the daily content
// engine. Each entry that has body content gets a sitemap row so Google
// can discover it without relying on internal links alone.
const LEGACY_ALT_ROUTES = new Set(["helix-studios-alternatives", "sean-cody-alternatives", "nakedsword-alternatives"]);
let altCount = 0;
for (const key of Object.keys(ALTERNATIVES_CONTENT)) {
  if (LEGACY_ALT_ROUTES.has(key)) continue;
  const siteSlug = key.replace(/-alternatives$/, "");
  const path = `/alternatives/${siteSlug}`;
  urls.push(urlEntry({ loc: path, changefreq: "monthly", priority: "0.7", lastmod: lastmodFor(path) }));
  altCount++;
}
// Dynamic worth-it pages (ISWORTHIT_CONTENT keys beyond the 10 static
// corePages entries above).
const STATIC_WORTHIT = new Set([
  "nakedsword", "sean-cody", "helix-studios", "men", "twinks-in-shorts",
  "southern-strokes", "peterfever", "sayuncle", "rawhole", "athletic-twinks",
]);
for (const slug of Object.keys(ISWORTHIT_CONTENT)) {
  if (STATIC_WORTHIT.has(slug)) continue;
  const path = `/is-${slug}-worth-it`;
  urls.push(urlEntry({ loc: path, changefreq: "monthly", priority: "0.6", lastmod: lastmodFor(path) }));
}

// /guides hub — higher priority than individual guides (it's the index).
urls.push(urlEntry({ loc: "/guides", changefreq: "weekly", priority: "0.8", lastmod: lastmodFor("/guides") }));
let guideCount = 0;
for (const slug of Object.keys(GUIDE_CONTENT)) {
  const path = `/guide/${slug}`;
  urls.push(urlEntry({ loc: path, changefreq: "monthly", priority: "0.6", lastmod: lastmodFor(path) }));
  guideCount++;
}

// ---------------------------------------------------------------------------
// Assemble XML
// ---------------------------------------------------------------------------
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  "</urlset>",
  "", // trailing newline
].join("\n");

// ---------------------------------------------------------------------------
// Write to public/sitemap.xml
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "..", "public", "sitemap.xml");

writeFileSync(outPath, sitemap, "utf-8");

const totalUrls = urls.length;
console.log(`Sitemap generated: ${outPath}`);
console.log(`  Total URLs: ${totalUrls}`);
console.log(`  Last modified: ${TODAY}`);
console.log(
  `  Breakdown: 1 homepage + ${corePages.length} core + ${toolPages.length} tools + ${infoPages.length} info + ${legalPages.length} legal + ${SITE_SLUGS.length} reviews + ${SITE_SLUGS.length} discounts + ${CATEGORY_SLUGS.length} categories + ${NICHE_SLUGS.length} niches + ${pairs.length} compare + ${altCount} alternatives + ${guideCount} guides`
);

// ---------------------------------------------------------------------------
// Blog sitemap (separate file — Google handles split sitemaps fine when
// each is referenced from robots.txt)
// ---------------------------------------------------------------------------
const blogUrls: string[] = [];
// Listing pages: no fabricated lastmod — they only truly change when a post
// ships, and the per-post entries below carry the real updated_date.
blogUrls.push(urlEntry({ loc: "/blog", changefreq: "daily", priority: "0.9" }));
for (const cat of BLOG_CATEGORIES) {
  blogUrls.push(urlEntry({ loc: `/blog/category/${cat.slug}`, changefreq: "weekly", priority: "0.7" }));
}
for (const post of BLOG_POSTS) {
  blogUrls.push(urlEntry({
    loc: `/blog/${post.slug}`,
    changefreq: "monthly",
    priority: "0.8",
    lastmod: post.updated_date,
  }));
}

const blogSitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...blogUrls,
  "</urlset>",
  "",
].join("\n");

const blogOutPath = resolve(__dirname, "..", "public", "blog-sitemap.xml");
writeFileSync(blogOutPath, blogSitemap, "utf-8");
console.log(`Blog sitemap: ${blogOutPath}`);
console.log(`  Blog URLs: ${blogUrls.length} (1 index + ${BLOG_CATEGORIES.length} categories + ${BLOG_POSTS.length} posts)`);
