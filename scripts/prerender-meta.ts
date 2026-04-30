/**
 * Build-time meta tag pre-renderer.
 *
 * Generates HTML files for each route with the correct <title>, <meta>,
 * <link canonical>, and OG tags baked into the initial response.
 * This means search engine crawlers see proper meta tags in the raw HTML
 * without waiting for React/Helmet to execute.
 *
 * Runs AFTER `vite build` — it reads dist/index.html, clones it per route,
 * injects route-specific meta, and writes to dist/{route}/index.html.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const BASE_URL = "https://twinkvault.com";

// Read the built index.html as a template
const template = readFileSync(resolve(DIST, "index.html"), "utf-8");

// ---------------------------------------------------------------------------
// Route definitions with SEO meta
// ---------------------------------------------------------------------------
interface RouteMeta {
  path: string;
  title: string;
  description: string;
}

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

const SITE_NAMES: Record<string, string> = {
  "helix-studios": "Helix Studios",
  "next-door-twink": "Next Door Twink",
  "next-door-world": "Next Door World",
  "twinks-in-shorts": "Twinks in Shorts",
  "athletic-twinks": "Athletic Twinks",
  "southern-strokes": "Southern Strokes",
  "daddy-on-twink": "Daddy on Twink",
  "touch-that-boy": "Touch That Boy",
  "breed-me-raw": "Breed Me Raw",
  "bareback-that-hole": "Bareback That Hole",
  "hard-brit-lads": "Hard Brit Lads",
  "prideflame": "Prideflame",
  "rawhole": "RawHole",
  "peterfever": "PeterFever",
  "gayasiannetwork": "GayAsianNetwork",
  "alternadudes": "AlternaDudes",
  "dirtyboyvideo": "DirtyBoyVideo",
  "dudesraw": "DudesRaw",
  "nakedsword": "NakedSword",
  "trailertrashboys": "TrailerTrashBoys",
  "japanboyz": "Japanboyz",
  "sexjapantv": "SexJapanTV",
  "hiroyaxxx": "HiroyaXXX",
  "yoshikawasakixxx": "Yoshi Kawasaki XXX",
  "wuboyz": "WuBoyz",
  "barebackrtxxx": "Bareback RT XXX",
  "cumpigmen": "Cum Pig Men",
  "realmenfuck": "Real Men Fuck",
  "swinginballs": "Swingin Balls",
  "squirtstudios": "Squirt Studios",
  "aussiesdoit": "Aussies Do It",
  "twinktrade": "Twink Trade",
  "dadcreep": "Dad Creep",
  "brothercrush": "Brother Crush",
  "familydick": "Family Dick",
  "sayuncle": "Say Uncle",
  "boysatcamp": "Boys at Camp",
  "missionaryboys": "Missionary Boys",
  "militarydick": "Military Dick",
  "latinleche": "Latin Leche",
  "yesfather": "Yes Father",
  "bullyhim": "Bully Him",
  "youngperps": "Young Perps",
  "barebackcumpigs": "Bareback Cum Pigs",
  "bearchubs": "Bear Chubs",
  "bearfilms": "Bear Films",
  "hairyandraw": "Hairy and Raw",
  "boyfun": "BoyFun",
  "jawked": "Jawked",
};

const CATEGORY_SLUGS = [
  "amateur-twinks",
  "premium-studios",
  "best-value",
  "hd-quality",
  "free-trials",
  "mobile-friendly",
] as const;

const CATEGORY_NAMES: Record<string, string> = {
  "amateur-twinks": "Amateur Twinks",
  "premium-studios": "Premium Studios",
  "best-value": "Best Value",
  "hd-quality": "HD Quality",
  "free-trials": "Free Trials",
  "mobile-friendly": "Mobile Friendly",
};

const YEAR = new Date().getFullYear();

// Static pages
const routes: RouteMeta[] = [
  { path: "/top-sites", title: `Top Gay Twink Sites ${YEAR} — Ranked & Reviewed | TwinkVault`, description: "Our ranked list of the best gay twink sites. Real scores, real pricing, updated monthly." },
  { path: "/reviews", title: `All Twink Site Reviews ${YEAR} | TwinkVault`, description: "Browse every twink site review on TwinkVault. Honest scores, pricing breakdowns, and pros/cons." },
  { path: "/best-deals", title: `Best Gay Twink Site Deals & Discounts ${YEAR} | TwinkVault`, description: "The best current gay twink site deals and discounts. Verified offers updated weekly." },
  { path: "/compare", title: "Compare Twink Sites — Side by Side | TwinkVault", description: "Compare the best twink content sites side by side. See scores, prices, and features at a glance." },
  { path: "/best-twink-sites", title: `Best Twink Sites ${YEAR} — Expert Ranked | TwinkVault`, description: `The best twink sites in ${YEAR}, ranked by content quality, value, and features. Updated monthly.` },
  { path: "/free-trial-twink-sites", title: `Twink Sites with Free Trials ${YEAR} | TwinkVault`, description: `The best gay twink sites offering free trials in ${YEAR}. Try before you commit.` },
  { path: "/cheapest-twink-sites", title: `Cheapest Twink Sites ${YEAR} | TwinkVault`, description: `The cheapest twink sites in ${YEAR}. Quality content at the lowest prices.` },
  { path: "/gay-dating-sites", title: `Best Gay Dating Sites ${YEAR} — Find Men Near You | TwinkVault`, description: `Find the best gay dating and hookup sites in ${YEAR}. Meet gay men near you — compare options, read reviews, and connect.` },
  { path: "/ask-ai", title: "AI Twink Site Recommender | TwinkVault", description: "Tell us what you're looking for and our AI recommends the best twink site for you." },
  { path: "/find-my-site", title: "Find Your Perfect Twink Site — Quiz | TwinkVault", description: "Take our 30-second quiz and we'll recommend the best twink content site for you." },
  { path: "/about", title: "About TwinkVault — Who We Are", description: "Learn about TwinkVault's mission: honest, independent reviews of gay twink content sites." },
  { path: "/methodology", title: `Review Methodology — How TwinkVault Scores Sites | TwinkVault`, description: `How TwinkVault scores gay membership sites: four weighted pillars, transparent checks, monthly re-verification.` },
  { path: "/contact", title: "Contact TwinkVault", description: "Get in touch with the TwinkVault team. Questions, corrections, or partnership inquiries." },
  { path: "/privacy-policy", title: "Privacy Policy | TwinkVault", description: "TwinkVault's privacy policy. How we handle your data." },
  { path: "/terms", title: "Terms of Service | TwinkVault", description: "TwinkVault terms of service and conditions of use." },
  { path: "/affiliate-disclosure", title: "Affiliate Disclosure | TwinkVault", description: "How TwinkVault earns revenue through affiliate partnerships." },
  { path: "/2257", title: "2257 Compliance Statement | TwinkVault", description: "TwinkVault 18 U.S.C. § 2257 compliance statement." },
  { path: "/sitemap", title: "Sitemap — TwinkVault", description: "Browse everything on TwinkVault. All reviews, categories, comparisons, and info pages." },
];

// Review pages
for (const slug of SITE_SLUGS) {
  const name = SITE_NAMES[slug];
  routes.push({
    path: `/reviews/${slug}`,
    title: `${name} Review ${YEAR} — Is It Worth It? | TwinkVault`,
    description: `Honest ${name} review with real scores, pricing breakdown, and pros/cons. Updated ${YEAR}.`,
  });
}

// Discount pages
for (const slug of SITE_SLUGS) {
  const name = SITE_NAMES[slug];
  routes.push({
    path: `/discount/${slug}`,
    title: `${name} Discount Code ${YEAR} — Save Big | TwinkVault`,
    description: `Get the latest ${name} discount code. Verified deals and savings for ${YEAR}.`,
  });
}

// Category pages
for (const slug of CATEGORY_SLUGS) {
  const name = CATEGORY_NAMES[slug];
  routes.push({
    path: `/category/${slug}`,
    title: `${name} Twink Sites ${YEAR} | TwinkVault`,
    description: `The best ${name.toLowerCase()} twink sites ranked and reviewed for ${YEAR}.`,
  });
}

// Compare pages (top 20 most important pairs)
const topSlugs = SITE_SLUGS.slice(0, 6);
for (let i = 0; i < topSlugs.length; i++) {
  for (let j = i + 1; j < topSlugs.length; j++) {
    const a = topSlugs[i];
    const b = topSlugs[j];
    routes.push({
      path: `/compare/${a}-vs-${b}`,
      title: `${SITE_NAMES[a]} vs ${SITE_NAMES[b]} ${YEAR} | TwinkVault`,
      description: `Compare ${SITE_NAMES[a]} vs ${SITE_NAMES[b]} side by side. Scores, pricing, pros and cons.`,
    });
  }
}

// ---------------------------------------------------------------------------
// Generate HTML files
// ---------------------------------------------------------------------------
function injectMeta(html: string, route: RouteMeta): string {
  const url = `${BASE_URL}${route.path}`;

  // Replace <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${route.title}</title>`
  );

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${route.description}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${url}" />`
  );

  // Replace OG tags
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${url}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${route.description}" />`
  );

  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${route.description}" />`
  );

  return html;
}

let count = 0;
for (const route of routes) {
  const html = injectMeta(template, route);
  // e.g. /reviews/helix-studios → dist/reviews/helix-studios/index.html
  const dir = resolve(DIST, route.path.slice(1)); // remove leading /
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), html, "utf-8");
  count++;
}

console.log(`Pre-rendered meta tags for ${count} routes`);
console.log(`  Reviews: ${SITE_SLUGS.length}`);
console.log(`  Discounts: ${SITE_SLUGS.length}`);
console.log(`  Categories: ${CATEGORY_SLUGS.length}`);
console.log(`  Compare pairs: ${(topSlugs.length * (topSlugs.length - 1)) / 2}`);
console.log(`  Static pages: ${routes.length - SITE_SLUGS.length * 2 - CATEGORY_SLUGS.length - (topSlugs.length * (topSlugs.length - 1)) / 2}`);
