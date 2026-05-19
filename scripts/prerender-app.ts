/**
 * Build-time React tree prerenderer.
 *
 * Replaces the prior prerender-meta.ts (which only injected meta tags).
 * This script renders every route's React tree to HTML at build time via
 * dist-server/entry-server.js, splices the rendered body into the
 * index.html template, and writes per-route index.html files.
 *
 * Pipeline:
 *   vite build              -> dist/                (SPA bundle)
 *   vite build --ssr ...    -> dist-server/         (SSR entry)
 *   npx tsx prerender-app   -> dist/<route>/        (per-route HTML with body)
 *
 * Run with: npx tsx scripts/prerender-app.ts
 */
// SSR-safe DOM via jsdom. Some bundled libs probe window/document at
// module-init time, before the React render runs. jsdom gives them a
// complete DOM so we don't have to patch each missing API piecemeal.
import { JSDOM } from "jsdom";
{
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    url: "https://twinkvault.com/",
    pretendToBeVisual: true,
  });
  const g = globalThis as Record<string, unknown>;
  const define = (key: string, value: unknown) => {
    try { g[key] = value; } catch { /* read-only on this Node */ }
    try {
      Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    } catch { /* ignore */ }
  };
  define("window", dom.window);
  define("document", dom.window.document);
  define("navigator", dom.window.navigator);
  define("localStorage", dom.window.localStorage);
  define("sessionStorage", dom.window.sessionStorage);
  define("HTMLElement", dom.window.HTMLElement);
  define("Element", dom.window.Element);
  define("Node", dom.window.Node);
  define("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
  define("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number);
  define("cancelAnimationFrame", (id: number) => clearTimeout(id));
}

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { sites, categories } from "../src/data/sites.js";
import { DEAL_VERIFIED_DATE } from "../src/lib/dates.js";
import { getFeaturedComparePairsList } from "../src/data/featured-compare-pairs.js";
import { BLOG_POSTS, BLOG_CATEGORIES } from "../src/data/blog-posts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const SERVER_DIST = resolve(__dirname, "..", "dist-server");
const BASE_URL = "https://twinkvault.com";
const YEAR = new Date().getFullYear();

interface RouteMeta {
  path: string;
  title: string;
  description: string;
}

const SITE_SLUGS = sites.map((s) => s.slug);
const SITE_NAMES: Record<string, string> = Object.fromEntries(sites.map((s) => [s.slug, s.name]));
const CATEGORY_SLUGS = categories.map((c) => c.slug);
const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

const NICHE_META: Record<string, { displayName: string; seoTitle: string; seoDescription: string }> = {
  "twink": { displayName: "Twink", seoTitle: "Best Twink Sites — Ranked & Reviewed", seoDescription: "Every twink site we've tested, ranked by content quality, pricing, and updates. Slim, smooth performers from studio-polished to genuinely amateur." },
  "bareback": { displayName: "Bareback", seoTitle: "Best Bareback Gay Sites — Raw Content Ranked", seoDescription: "Bareback gay sites ranked by catalog size, update frequency, and quality. Twink, daddy, bear, and crossover bareback content all scored honestly." },
  "asian": { displayName: "Asian", seoTitle: "Best Asian Gay Sites — Ranked & Reviewed", seoDescription: "The best Asian gay content sites ranked by quality and authenticity. Japanese, Thai, Chinese, and pan-Asian networks scored." },
  "latin": { displayName: "Latin", seoTitle: "Best Latin Gay Sites — Ranked & Reviewed", seoDescription: "Latin gay sites ranked by content quality and authentic Latino performers. Brazilian, Colombian, Mexican, and pan-Latin networks scored honestly." },
  "bear": { displayName: "Bear", seoTitle: "Best Bear Gay Sites — Ranked & Reviewed", seoDescription: "The best gay bear content sites ranked. Hairy, mature, and cub performers from dedicated bear studios — scored on catalog depth and value." },
  "daddy": { displayName: "Daddy", seoTitle: "Best Daddy Gay Sites — Ranked & Reviewed", seoDescription: "Daddy/son gay sites ranked by content quality and authentic chemistry. Mature-on-younger niche covered across studios and networks." },
  "college": { displayName: "College", seoTitle: "Best College Gay Sites — Ranked & Reviewed", seoDescription: "College gay sites ranked by authenticity and content quality. Frat, dorm, and amateur college-age performers scored across networks." },
  "military": { displayName: "Military", seoTitle: "Best Military Gay Sites — Ranked & Reviewed", seoDescription: "Military-themed gay sites ranked. Uniformed performers, recruit roleplay, and ex-military content scored on quality and authenticity." },
  "amateur": { displayName: "Amateur", seoTitle: "Best Amateur Gay Sites — Ranked & Reviewed", seoDescription: "The best amateur gay sites ranked. Real performers, authentic chemistry, no studio gloss — scored on quality and value across networks." },
  "big-dick": { displayName: "Big Dick", seoTitle: "Best Big Dick Gay Sites — Ranked & Reviewed", seoDescription: "Big dick gay sites ranked by performer quality and content depth. Hung-focused content scored across studios and amateur networks." },
  "jock": { displayName: "Jock", seoTitle: "Best Jock Gay Sites — Ranked & Reviewed", seoDescription: "Jock and athletic gay sites ranked by content quality. Locker room, gym, and athletic-aesthetic performers scored honestly." },
  "uncut": { displayName: "Uncut", seoTitle: "Best Uncut Gay Sites — Ranked & Reviewed", seoDescription: "Uncut gay sites ranked. European and international networks with uncircumcised performers scored on content quality." },
  "hairy": { displayName: "Hairy", seoTitle: "Best Hairy Gay Sites — Ranked & Reviewed", seoDescription: "Hairy gay sites ranked. Body-hair-focused performers across bear, daddy, and amateur networks scored on quality and depth." },
  "smooth": { displayName: "Smooth", seoTitle: "Best Smooth Gay Sites — Ranked & Reviewed", seoDescription: "Smooth gay sites ranked by quality. Twink and swimmer-aesthetic performers scored on catalog depth and pricing." },
  "group": { displayName: "Group", seoTitle: "Best Group Gay Sites — Ranked & Reviewed", seoDescription: "Gay sites with strong group, threesome, and orgy content ranked. Catalog depth and quality scored across networks." },
  "fetish": { displayName: "Fetish", seoTitle: "Best Fetish Gay Sites — Ranked & Reviewed", seoDescription: "Fetish gay sites ranked by depth across kink, leather, gear, and adjacent niches. Quality and authenticity scored." },
  "interracial": { displayName: "Interracial", seoTitle: "Best Interracial Gay Sites — Ranked & Reviewed", seoDescription: "Interracial gay sites ranked by performer diversity and content quality. Cross-ethnic networks scored honestly." },
  "muscle": { displayName: "Muscle", seoTitle: "Best Muscle Gay Sites — Ranked & Reviewed", seoDescription: "Muscle gay sites ranked. Bodybuilder-aesthetic performers and gym-focused content scored on catalog depth and quality." },
  "str8-curious": { displayName: "Straight-Curious", seoTitle: "Best Straight-Curious Gay Sites — Ranked & Reviewed", seoDescription: "Straight-curious and str8-bait gay sites ranked. First-time, reluctant, and roleplay content scored across networks." },
  "japanese": { displayName: "Japanese", seoTitle: "Best Japanese Gay Sites — Ranked & Reviewed", seoDescription: "Japanese gay sites and JAV-style networks ranked. Authentic Japanese performers and content scored on quality and depth." },
  "solo": { displayName: "Solo", seoTitle: "Best Solo Male Gay Sites — Ranked & Reviewed", seoDescription: "Solo male gay sites ranked. Single-performer JO, cam, and self-shot content scored on quality and catalog depth." },
};

// ---------------------------------------------------------------------------
// Build the route list (same logic as the prior prerender-meta.ts)
// ---------------------------------------------------------------------------
const routes: RouteMeta[] = [
  { path: "/", title: `TwinkVault — Best Gay Twink Sites ${YEAR} Ranked & Reviewed`, description: `Honest reviews of the best gay twink sites, ranked by quality and value. Real scores, real pricing, updated ${YEAR}.` },
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
  { path: "/best-gay-sites-under-10", title: `Best Gay Porn Sites Under $10 (${YEAR}) | TwinkVault`, description: `The best gay membership sites under $10/mo on the annual plan. Real scores, real prices, ranked by value-for-money in ${YEAR}.` },
  { path: "/best-bareback-gay-sites", title: `Best Bareback Gay Sites (${YEAR}) | TwinkVault`, description: `Every bareback gay site we've tested, ranked by content quality, library depth, and pricing for ${YEAR}.` },
  { path: "/best-asian-gay-sites", title: `Best Asian Gay Porn Sites (${YEAR}) | TwinkVault`, description: `The best Asian gay sites ranked by quality, performer authenticity, and library depth in ${YEAR}.` },
  { path: "/best-amateur-gay-sites", title: `Best Amateur Gay Porn Sites (${YEAR}) | TwinkVault`, description: `Real performers, authentic chemistry, no studio gloss. The best amateur gay sites ranked by quality and value in ${YEAR}.` },
  { path: "/best-premium-gay-sites", title: `Best Premium Gay Porn Sites (${YEAR}) | TwinkVault`, description: `The premium-tier studio gay sites — high production values, exclusive performers, and the catalogs that built the modern industry. Ranked for ${YEAR}.` },
  { path: "/helix-studios-alternatives", title: `Helix Studios Alternatives (${YEAR}) | TwinkVault`, description: `The 5 best alternatives to Helix Studios — premium twink-focused sites with comparable production quality. Updated for ${YEAR}.` },
  { path: "/sean-cody-alternatives", title: `Sean Cody Alternatives (${YEAR}) | TwinkVault`, description: `The 5 best alternatives to Sean Cody — athletic, all-American, bareback gay sites ranked by similarity and value.` },
  { path: "/nakedsword-alternatives", title: `NakedSword Alternatives (${YEAR}) | TwinkVault`, description: `The 5 best alternatives to NakedSword — large-library multi-studio gay platforms ranked by content depth and value.` },
  { path: "/best-gay-sites-for-beginners", title: `Best Gay Porn Sites for Beginners (${YEAR}) | TwinkVault`, description: `New to gay membership sites? These are the most approachable: low entry price, strong mobile experience, and free trials where available.` },
  { path: "/best-gay-twink-sites-2026", title: `Best Gay Twink Sites 2026 | TwinkVault`, description: `The top 15 gay twink sites for 2026, ranked by content quality, value, and update frequency. Updated monthly.` },
  { path: "/best-gay-sites-with-downloads", title: `Best Gay Porn Sites with Downloads (${YEAR}) | TwinkVault`, description: `Gay membership sites that let you download scenes for offline viewing. Streaming-only sites excluded.` },
  { path: "/best-daddy-twink-sites", title: `Best Daddy/Twink Gay Sites (${YEAR}) | TwinkVault`, description: `The best daddy and older/younger gay sites ranked. Authentic age-gap chemistry, family-fantasy taboo, and dedicated daddy/twink studios scored honestly.` },
  { path: "/best-twink-porn-sites-with-free-trials", title: `Best Twink Porn Sites with Free Trials ${YEAR} | TwinkVault`, description: `The best twink porn sites offering free trials in ${YEAR}. Try before you commit — ranked by trial length, content quality, and post-trial pricing.` },
  { path: "/best-cheap-gay-porn-sites", title: `Best Cheap Gay Porn Sites ${YEAR} — Budget Picks Ranked | TwinkVault`, description: `The best cheap gay porn sites in ${YEAR}. Real quality at budget prices — ranked by content depth and value per dollar, cheap-but-bad sites filtered out.` },
  { path: "/best-bareback-twink-sites", title: `Best Bareback Twink Sites ${YEAR} — Ranked & Reviewed | TwinkVault`, description: `The best bareback twink porn sites in ${YEAR}, ranked by content quality, performer roster, and update frequency. Every site tested on the same methodology.` },
  { path: "/best-gay-porn-sites", title: `Best Gay Porn Sites in ${YEAR} — Ranked & Reviewed | TwinkVault`, description: `The 15 best gay porn sites of ${YEAR}, ranked by content quality, value, update frequency, and mobile experience. Paid memberships only.` },
  { path: "/best-gay-porn-subscription", title: `Best Gay Porn Subscriptions (${YEAR}) | TwinkVault`, description: `The most worth-paying-for gay porn subscriptions of ${YEAR} — ranked by value-for-money, with monthly vs annual pricing and content volume broken out.` },
  { path: "/best-twink-porn-sites", title: `Best Twink Porn Sites (${YEAR}) | TwinkVault`, description: `The best twink porn sites of ${YEAR}, ranked specifically on content quality. Real performers, real production values, scored by someone who actually subscribes.` },
  { path: "/gay-porn-sites-with-free-trial", title: `Gay Porn Sites with Free Trial (${YEAR}) | TwinkVault`, description: `Every gay porn site offering a free or low-cost intro trial. Try before you commit — verified offers across twink, bareback, premium, and Asian niches.` },
  { path: "/best-value-gay-porn-sites", title: `Best Value Gay Porn Sites (${YEAR}) | TwinkVault`, description: `The gay porn sites that deliver the most content for your money. Ranked by value-for-money score, with annual price-per-month and library size factored in.` },
  { path: "/gay-porn-site-reviews", title: `Gay Porn Site Reviews — 62 Sites Tested & Scored (${YEAR}) | TwinkVault`, description: `Honest reviews of 62 gay porn sites — paid memberships only, scored on content quality, value, updates, and mobile UX. Browse by niche.` },
  { path: "/gay-porn-sites-ranked", title: `Gay Porn Sites Ranked — 62 Sites Scored on 4 Criteria (${YEAR}) | TwinkVault`, description: `All 62 gay porn sites in our database in one sortable table — content quality, value, updates, mobile, and price.` },
  { path: "/is-nakedsword-worth-it", title: `Is NakedSword Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is NakedSword worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-sean-cody-worth-it", title: `Is Sean Cody Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is Sean Cody worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-helix-studios-worth-it", title: `Is Helix Studios Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is Helix Studios worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-men-worth-it", title: `Is Men.com Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is Men.com worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-twinks-in-shorts-worth-it", title: `Is Twinks in Shorts Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is Twinks in Shorts worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-southern-strokes-worth-it", title: `Is Southern Strokes Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is Southern Strokes worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-peterfever-worth-it", title: `Is PeterFever Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is PeterFever worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-sayuncle-worth-it", title: `Is SayUncle Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is SayUncle worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-rawhole-worth-it", title: `Is RawHole Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is RawHole worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/is-athletic-twinks-worth-it", title: `Is Athletic Twinks Worth It? (${YEAR} Review) | TwinkVault`, description: `Honest answer to "is Athletic Twinks worth it" — score breakdown, monthly vs annual pricing, real pros and cons, and the bottom line.` },
  { path: "/blog", title: `TwinkVault Blog — Guides, Comparisons & Industry Analysis`, description: `Editorial coverage of gay porn sites — buyer guides, head-to-head comparisons, pricing analysis, and industry trends from the TwinkVault editorial team.` },
];

for (const cat of BLOG_CATEGORIES) {
  routes.push({ path: `/blog/category/${cat.slug}`, title: `${cat.label} — TwinkVault Blog`, description: `${cat.description} Browse all ${cat.label.toLowerCase()} articles from TwinkVault Editorial.` });
}
for (const post of BLOG_POSTS) {
  routes.push({ path: `/blog/${post.slug}`, title: `${post.title} | TwinkVault`, description: post.meta_description });
}
for (const slug of SITE_SLUGS) {
  routes.push({ path: `/reviews/${slug}`, title: `${SITE_NAMES[slug]} Review ${YEAR} — Is It Worth It? | TwinkVault`, description: `Honest ${SITE_NAMES[slug]} review with real scores, pricing breakdown, and pros/cons. Updated ${YEAR}.` });
}
for (const site of sites) {
  const pct = site.deal_discount;
  const hasDeal = pct > 0;
  routes.push({
    path: `/discount/${site.slug}`,
    title: hasDeal ? `${site.name} Discount Code: ${pct}% Off (Verified ${DEAL_VERIFIED_DATE}) — Save Now` : `${site.name} Discount Code (${YEAR}) — Best Verified Price`,
    description: hasDeal ? `Get ${site.name} for just ${site.price_annual} with our verified ${pct}% discount. Lowest price guaranteed — deal confirmed ${DEAL_VERIFIED_DATE}. Click to activate instantly.` : `Looking for a ${site.name} discount code? Get the lowest verified price on ${site.name} membership. Updated ${DEAL_VERIFIED_DATE}.`,
  });
}
for (const slug of CATEGORY_SLUGS) {
  routes.push({ path: `/category/${slug}`, title: `${CATEGORY_NAMES[slug]} Twink Sites ${YEAR} | TwinkVault`, description: `The best ${CATEGORY_NAMES[slug].toLowerCase()} twink sites ranked and reviewed for ${YEAR}.` });
}
for (const slug of Object.keys(NICHE_META)) {
  const meta = NICHE_META[slug];
  routes.push({ path: `/niche/${slug}`, title: `${meta.seoTitle} ${YEAR} | TwinkVault`, description: meta.seoDescription });
}
for (const pairSlug of getFeaturedComparePairsList()) {
  const [a, b] = pairSlug.split("-vs-");
  const aName = SITE_NAMES[a] ?? a;
  const bName = SITE_NAMES[b] ?? b;
  routes.push({ path: `/compare/${pairSlug}`, title: `${aName} vs ${bName} ${YEAR} — Which Is Worth It? | TwinkVault`, description: `${aName} vs ${bName} compared side by side. Scores, pricing, pros and cons — find out which is the better gay porn site subscription in ${YEAR}.` });
}

// ---------------------------------------------------------------------------
// Inject meta + body into the template
// ---------------------------------------------------------------------------
function injectMeta(html: string, route: RouteMeta, helmetHtml: string): string {
  const url = `${BASE_URL}${route.path}`;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${route.description}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${route.title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${route.description}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${route.title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${route.description}" />`);

  // Append helmet output (schema scripts, JSON-LD, etc.) just before </head>
  if (helmetHtml) {
    html = html.replace("</head>", `${helmetHtml}\n  </head>`);
  }

  return html;
}

function injectBody(html: string, body: string): string {
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

async function main() {
  const templatePath = resolve(DIST, "index.html");
  const template = readFileSync(templatePath, "utf-8");

  // Dynamically import the compiled SSR entry
  const entryPath = pathToFileURL(resolve(SERVER_DIST, "entry-server.js")).href;
  const { render } = await import(entryPath) as { render: (url: string) => { html: string; helmet: any } };

  let written = 0;
  let failed = 0;
  for (const route of routes) {
    try {
      const { html: body, helmet } = render(route.path);
      const helmetHtml = helmet
        ? [helmet.script?.toString(), helmet.link?.toString()].filter(Boolean).join("\n")
        : "";
      let out = injectMeta(template, route, helmetHtml);
      out = injectBody(out, body);

      const dir = resolve(DIST, route.path.replace(/^\//, ""));
      mkdirSync(dir, { recursive: true });
      writeFileSync(resolve(dir, "index.html"), out);
      written++;
    } catch (e) {
      failed++;
      console.error(`✗ ${route.path}: ${(e as Error).message}`);
    }
  }

  // Also write the homepage to dist/index.html (overwriting the SPA shell)
  const homeRoute = routes.find((r) => r.path === "/");
  if (homeRoute) {
    try {
      const { html: body, helmet } = render("/");
      const helmetHtml = helmet ? [helmet.script?.toString(), helmet.link?.toString()].filter(Boolean).join("\n") : "";
      let out = injectMeta(template, homeRoute, helmetHtml);
      out = injectBody(out, body);
      writeFileSync(templatePath, out);
    } catch (e) {
      console.error(`✗ /: ${(e as Error).message}`);
    }
  }

  console.log(`\n✓ Prerendered ${written} routes${failed > 0 ? `, ${failed} failed` : ""}.`);
  if (failed > 0) process.exit(1);
  // jsdom + bundled libs leave timers/animations queued; force-exit so
  // the build pipeline doesn't hang after all writes complete.
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
