import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { sites, categories } from "../src/data/sites.js";
import { getFeaturedComparePairsList } from "../src/data/featured-compare-pairs.js";

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
}

function urlEntry({ loc, changefreq, priority }: UrlEntry): string {
  return [
    "  <url>",
    `    <loc>${BASE_URL}${loc}</loc>`,
    `    <lastmod>${TODAY}</lastmod>`,
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
  "/best-gay-sites-for-beginners",
  "/best-gay-twink-sites-2026",
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

// Review pages  /reviews/:slug
for (const slug of SITE_SLUGS) {
  urls.push(
    urlEntry({ loc: `/reviews/${slug}`, changefreq: "weekly", priority: "0.8" })
  );
}

// Discount pages  /discount/:slug
for (const slug of SITE_SLUGS) {
  urls.push(
    urlEntry({
      loc: `/discount/${slug}`,
      changefreq: "weekly",
      priority: "0.8",
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
  urls.push(
    urlEntry({
      loc: `/compare/${a}-vs-${b}`,
      changefreq: "monthly",
      priority: "0.6",
    })
  );
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
  `  Breakdown: 1 homepage + ${corePages.length} core + ${toolPages.length} tools + ${infoPages.length} info + ${legalPages.length} legal + ${SITE_SLUGS.length} reviews + ${SITE_SLUGS.length} discounts + ${CATEGORY_SLUGS.length} categories + ${NICHE_SLUGS.length} niches + ${pairs.length} compare`
);
