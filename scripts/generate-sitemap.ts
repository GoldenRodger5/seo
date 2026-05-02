import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = "https://twinkvault.com";
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

const SITE_SLUGS = [
  "helix-studios",
  "next-door-twink",
  "next-door-world",
  "twinks-in-shorts",
  "athletic-twinks",
  "southern-strokes",
  "daddy-on-twink",
  "touch-that-boy",
  "breed-me-raw",
  "bareback-that-hole",
  "hard-brit-lads",
  "prideflame",
  "rawhole",
  "peterfever",
  "gayasiannetwork",
  "alternadudes",
  "dirtyboyvideo",
  "dudesraw",
  "nakedsword",
  "trailertrashboys",
  "japanboyz",
  "sexjapantv",
  "hiroyaxxx",
  "yoshikawasakixxx",
  "wuboyz",
  "barebackrtxxx",
  "cumpigmen",
  "realmenfuck",
  "swinginballs",
  "squirtstudios",
  "aussiesdoit",
  "twinktrade",
  "dadcreep",
  "brothercrush",
  "familydick",
  "sayuncle",
  "boysatcamp",
  "missionaryboys",
  "militarydick",
  "latinleche",
  "yesfather",
  "bullyhim",
  "youngperps",
  "barebackcumpigs",
  "bearchubs",
  "bearfilms",
  "hairyandraw",
  "boyfun",
  "jawked",
] as const;

const CATEGORY_SLUGS = [
  "amateur-twinks",
  "premium-studios",
  "best-value",
  "hd-quality",
  "free-trials",
  "mobile-friendly",
] as const;

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

// Compare pages  /compare/:slugA-vs-:slugB  (66 pairs)
const pairs = generatePairs(SITE_SLUGS);
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
