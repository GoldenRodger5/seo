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
import { ALTERNATIVES_CONTENT } from "../src/data/alternatives-content.js";
import { GUIDE_CONTENT } from "../src/data/guide-content.js";
import { ISWORTHIT_CONTENT } from "../src/data/isworthit-content.js";
import { selectGuideHero } from "../src/lib/guideImagery.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const SERVER_DIST = resolve(__dirname, "..", "dist-server");
const BASE_URL = "https://twinkvault.com";
const YEAR = new Date().getFullYear();

interface RouteMeta {
  path: string;
  title: string;
  description: string;
  /** Absolute og:image/twitter:image URL. When set, injectMeta replaces the
   *  generic favicon default so the route ships a real social card image. */
  ogImage?: string;
  noindex?: boolean;
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
  "uncut": { displayName: "Uncut", seoTitle: "Best Uncut Gay Sites — Ranked & Reviewed", seoDescription: "Uncut gay sites ranked. European and international networks with uncircumcised performers scored on content depth, value, and update frequency." },
  "hairy": { displayName: "Hairy", seoTitle: "Best Hairy Gay Sites — Ranked & Reviewed", seoDescription: "Hairy gay sites ranked. Body-hair-focused performers across bear, daddy, and amateur networks scored on quality and depth." },
  "smooth": { displayName: "Smooth", seoTitle: "Best Smooth Gay Sites — Ranked & Reviewed", seoDescription: "Smooth gay sites ranked by quality. Twink and swimmer-aesthetic performers — hairless, lean physiques — scored on catalog depth, pricing, and update cadence." },
  "group": { displayName: "Group", seoTitle: "Best Group Gay Sites — Ranked & Reviewed", seoDescription: "Gay sites with strong group, threesome, and orgy content ranked. Catalog depth, scene length, and production quality scored across studios and networks." },
  "fetish": { displayName: "Fetish", seoTitle: "Best Fetish Gay Sites — Ranked & Reviewed", seoDescription: "Fetish gay sites ranked by depth across kink, leather, gear, BDSM, and adjacent niches. Quality, authenticity, and update cadence scored across the category." },
  "interracial": { displayName: "Interracial", seoTitle: "Best Interracial Gay Sites — Ranked & Reviewed", seoDescription: "Interracial gay sites ranked by performer diversity and content quality. Cross-ethnic networks scored honestly on catalog depth, production values, and value." },
  "muscle": { displayName: "Muscle", seoTitle: "Best Muscle Gay Sites — Ranked & Reviewed", seoDescription: "Muscle gay sites ranked by content quality. Bodybuilder-aesthetic performers and gym-focused content scored on catalog depth, updates, and production polish." },
  "str8-curious": { displayName: "Straight-Curious", seoTitle: "Best Straight-Curious Gay Sites Ranked", seoDescription: "Straight-curious and str8-bait gay sites ranked. First-time, reluctant, and roleplay content scored across networks on chemistry, production quality, and value." },
  "japanese": { displayName: "Japanese", seoTitle: "Best Japanese Gay Sites — Ranked & Reviewed", seoDescription: "Japanese gay sites and JAV-style networks ranked. Authentic Japanese performers and content scored on quality and depth." },
  "solo": { displayName: "Solo", seoTitle: "Best Solo Male Gay Sites — Ranked & Reviewed", seoDescription: "Solo male gay sites ranked by quality and depth. Single-performer JO, cam, and self-shot content scored on production polish, catalog size, and update cadence." },
};

// ---------------------------------------------------------------------------
// Build the route list (same logic as the prior prerender-meta.ts)
// ---------------------------------------------------------------------------
const routes: RouteMeta[] = [
  { path: "/", title: `TwinkVault — Best Gay Twink Sites ${YEAR} Ranked & Reviewed`, description: `Honest reviews of the best gay twink sites — ranked by content quality, value, updates, and mobile UX. Real scores, real pricing, updated ${YEAR}.`, ogImage: `${BASE_URL}/site-banners/twinks-in-shorts-hero.jpg` },
  { path: "/top-sites", title: `Gay Twink Site Rankings ${YEAR} — All Sites Scored | TwinkVault`, description: `Our ranked list of the best gay twink sites of ${YEAR}. Real scores, real pricing, paid membership reviews, updated monthly. Filter by HD, free trial, or value.` },
  { path: "/reviews", title: `All Twink Site Reviews ${YEAR} | TwinkVault`, description: `Browse every twink site review on TwinkVault. Honest scores, pricing breakdowns, pros and cons after a paid membership — sortable by value, score, or update cadence.` },
  { path: "/best-deals", title: `Best Gay Twink Site Deals & Discounts ${YEAR} | TwinkVault`, description: `The best current gay twink site deals and discounts for ${YEAR}. Verified offers updated weekly with annual savings, free trial info, and verdict on each.` },
  { path: "/compare", title: "Compare Twink Sites — Side by Side | TwinkVault", description: `Compare the best twink content sites of ${YEAR} side by side. See scores, prices, library size, and features at a glance — pick any two sites for a full head-to-head.` },
  { path: "/best-twink-sites", title: `Best Twink Sites ${YEAR} — Expert Ranked | TwinkVault`, description: `The best twink sites of ${YEAR}, ranked by content quality, value, update frequency, and mobile experience. Honest scores after a paid membership on each.` },
  { path: "/free-trial-twink-sites", title: `Twink Sites with Free Trials ${YEAR} | TwinkVault`, description: `The best gay twink sites offering free trials in ${YEAR}. Try before you commit — trial length, content included, and post-trial pricing for each one.` },
  { path: "/cheapest-twink-sites", title: `Cheapest Twink Sites ${YEAR} | TwinkVault`, description: `The cheapest twink sites in ${YEAR}. Quality content at the lowest verified prices — annual rates, value scores, and what's worth paying for at each tier.` },
  { path: "/gay-dating-sites", title: `Best Gay Dating Sites ${YEAR} — Find Men Near You | TwinkVault`, description: `The best gay dating and hookup sites in ${YEAR}. Compare options and read honest reviews — broken out by serious dating, casual hookups, and travel-friendly apps.` },
  { path: "/ask-ai", title: "AI Twink Site Recommender | TwinkVault", description: "Tell our AI what you're looking for — body type, niche, budget, must-haves — and get a personalized gay twink site recommendation based on real scores and pricing." },
  { path: "/find-my-site", title: "Find Your Perfect Twink Site — Quiz | TwinkVault", description: `Take our 30-second quiz — niche, budget, must-haves — and we'll recommend the best twink content site for you. Based on real scores from paid memberships.` },
  { path: "/about", title: "About TwinkVault — Who Reviews These Gay Porn Sites", description: "TwinkVault is an independent gay porn site review platform. Honest paid-membership reviews, real pricing, no commission-rigged rankings. Meet the team behind it." },
  { path: "/methodology", title: `Review Methodology — How TwinkVault Scores Sites | TwinkVault`, description: `How TwinkVault scores gay membership sites — four weighted pillars (content, value, updates, mobile), transparent checks, monthly re-verification.` },
  { path: "/contact", title: "Contact TwinkVault — Questions & Corrections", description: `Get in touch with the TwinkVault team. Editorial questions, score corrections, fact-check feedback, partnership inquiries, and DMCA requests all routed here.` },
  { path: "/privacy-policy", title: "Privacy Policy & Data Practices | TwinkVault", description: `TwinkVault's privacy policy: what data we collect, how we use it, cookie practices, third-party tracking, your data rights, and how to opt out. Updated for ${YEAR}.` },
  { path: "/terms", title: "Terms of Service & Use Agreement | TwinkVault", description: `TwinkVault terms of service: eligibility, acceptable use, intellectual property, disclaimers, liability limits, and dispute resolution. Updated ${YEAR}.` },
  { path: "/affiliate-disclosure", title: "Affiliate Disclosure | TwinkVault", description: "How TwinkVault earns revenue through affiliate partnerships, why rankings are never influenced by commissions, and how to spot affiliate links on the site." },
  { path: "/2257", title: "2257 Compliance Statement | TwinkVault", description: "TwinkVault's 18 U.S.C. § 2257 Record-Keeping Requirements Compliance Statement. Records of age verification for all content referenced on the site." },
  { path: "/sitemap", title: "Sitemap — All TwinkVault Pages", description: `Every page on TwinkVault in one index — all reviews, niche categories, comparisons, deal pages, guides, and editorial coverage. Navigate the catalog.` },
  { path: "/best-gay-sites-under-10", title: `Best Gay Porn Sites Under $10 (${YEAR}) | TwinkVault`, description: `The best gay membership sites under $10/mo on the annual plan. Real scores, real prices, ranked by value-for-money in ${YEAR}.` },
  { path: "/best-bareback-gay-sites", title: `Best Bareback Gay Sites (${YEAR}) | TwinkVault`, description: `Every bareback gay site we've tested, ranked by content quality, library depth, update frequency, and pricing for ${YEAR}. Paid membership reviews only.` },
  { path: "/best-asian-gay-sites", title: `Best Asian Gay Porn Sites (${YEAR}) | TwinkVault`, description: `The best Asian gay porn sites of ${YEAR} ranked by content quality, performer authenticity, library depth, and value. Japanese, Thai, Chinese, pan-Asian covered.` },
  { path: "/best-amateur-gay-sites", title: `Best Amateur Gay Porn Sites (${YEAR}) | TwinkVault`, description: `Real performers, authentic chemistry. The best amateur gay porn sites of ${YEAR} ranked by quality, value, and update cadence — paid membership reviews.` },
  { path: "/best-premium-gay-sites", title: `Best Premium Gay Porn Sites (${YEAR}) | TwinkVault`, description: `The premium-tier studio gay sites — high production values, exclusive performers, and the catalogs that built the modern industry. Ranked for ${YEAR}.` },
  { path: "/helix-studios-alternatives", title: `Helix Studios Alternatives (${YEAR}) | TwinkVault`, description: `The 5 best alternatives to Helix Studios — premium twink-focused sites with comparable production quality. Updated for ${YEAR}.` },
  { path: "/sean-cody-alternatives", title: `Sean Cody Alternatives (${YEAR}) | TwinkVault`, description: `The 5 best alternatives to Sean Cody — athletic, all-American, bareback gay sites ranked by similarity, content quality, value, and update cadence.` },
  { path: "/nakedsword-alternatives", title: `NakedSword Alternatives (${YEAR}) | TwinkVault`, description: `The 5 best alternatives to NakedSword — large-library multi-studio gay platforms ranked by content depth, library size, pricing, and feature parity with NakedSword.` },
  { path: "/best-gay-sites-for-beginners", title: `Best Gay Porn Sites for Beginners (${YEAR}) | TwinkVault`, description: `New to gay membership sites? These are the most approachable: low entry price, strong mobile experience, and free trials where available.` },
  { path: "/best-gay-sites-with-downloads", title: `Best Gay Porn Sites with Downloads (${YEAR}) | TwinkVault`, description: `Gay membership sites that let you download scenes for offline viewing in ${YEAR}. Streaming-only sites excluded — ranked by library size, quality, and value.` },
  { path: "/best-daddy-twink-sites", title: `Best Daddy/Twink Gay Sites (${YEAR}) | TwinkVault`, description: `The best daddy and older/younger gay sites ranked. Authentic age-gap chemistry, family-fantasy taboo, and dedicated daddy/twink studios scored honestly.` },
  { path: "/best-twink-porn-sites-with-free-trials", title: `Best Twink Porn Sites with Free Trials ${YEAR} | TwinkVault`, description: `The best twink porn sites offering free trials in ${YEAR}. Try before you commit — ranked by trial length, content quality, and post-trial pricing.` },
  { path: "/gay-porn-pricing-index", title: `Gay Porn Pricing Index ${YEAR}: Real Costs | TwinkVault`, description: `How much does gay porn actually cost in ${YEAR}? Original pricing data from 60+ membership sites — median prices, annual-vs-monthly gaps, and best value picks.` },
  { path: "/best-cheap-gay-porn-sites", title: `Best Cheap Gay Porn Sites ${YEAR} — Budget Picks Ranked | TwinkVault`, description: `The best cheap gay porn sites in ${YEAR}. Real quality at budget prices — ranked by content depth and value per dollar, cheap-but-bad sites filtered out.` },
  { path: "/best-bareback-twink-sites", title: `Best Bareback Twink Sites ${YEAR} — Ranked & Reviewed | TwinkVault`, description: `The best bareback twink porn sites in ${YEAR}, ranked by content quality, performer roster, and update frequency. Every site tested on the same methodology.` },
  { path: "/best-gay-porn-sites", title: `Best Gay Porn Sites in ${YEAR} — Ranked & Reviewed | TwinkVault`, description: `The 15 best gay porn sites of ${YEAR}, ranked by content quality, value, update frequency, and mobile experience. Paid memberships only.` },
  { path: "/best-gay-porn-subscription", title: `Best Gay Porn Subscriptions (${YEAR}) | TwinkVault`, description: `The most worth-paying-for gay porn subscriptions of ${YEAR} — ranked by value-for-money, with monthly vs annual pricing and content volume broken out.` },
  { path: "/best-twink-porn-sites", title: `Best Twink Porn Sites (${YEAR}) | TwinkVault`, description: `The best twink porn sites of ${YEAR}, ranked specifically on content quality. Real performers, real production values, scored by someone who actually subscribes.` },
  { path: "/gay-porn-sites-with-free-trial", title: `Gay Porn Sites with Free Trial (${YEAR}) | TwinkVault`, description: `Every gay porn site offering a free or low-cost intro trial. Try before you commit — verified offers across twink, bareback, premium, and Asian niches.` },
  { path: "/best-value-gay-porn-sites", title: `Best Value Gay Porn Sites (${YEAR}) | TwinkVault`, description: `The gay porn sites that deliver the most content for your money. Ranked by value-for-money score, with annual price-per-month and library size factored in.` },
  { path: "/gay-porn-site-reviews", title: `Gay Porn Site Reviews — 62 Sites Scored | TwinkVault`, description: `Honest reviews of 62 gay porn sites in ${YEAR} — paid memberships only, scored on content quality, value, updates, and mobile UX. Browse the catalog by niche or score.` },
  { path: "/gay-porn-sites-ranked", title: `Gay Porn Sites Ranked (${YEAR}) — Sortable Table | TwinkVault`, description: `All 62 gay porn sites in our database in one sortable table — content quality, value, updates, mobile, and price comparable at a glance. Refreshed monthly.` },
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
  routes.push({
    path: `/blog/category/${cat.slug}`,
    title: `${cat.label} — Gay Porn Site Articles | TwinkVault Blog`,
    description: `${cat.description} Every ${cat.label.toLowerCase()} article on TwinkVault — analysis, comparisons, and editorial coverage.`,
  });
}
for (const post of BLOG_POSTS) {
  // Blog post titles are editorial and often >60 chars on their own.
  // Drop the " | TwinkVault" suffix when the combined string exceeds 60.
  const withSuffix = `${post.title} | TwinkVault`;
  // Social-card image: a seeded clean cover (matches BlogPost's render-time
  // pick), replacing the generic favicon default. Falls back to the post's
  // featured_image only if no related-site cover exists.
  const blogHero = selectGuideHero(post.related_sites ?? [], post.slug);
  routes.push({
    path: `/blog/${post.slug}`,
    title: withSuffix.length <= 60 ? withSuffix : post.title,
    description: post.meta_description,
    ogImage: blogHero ? `${BASE_URL}${blogHero.hero_image}` : undefined,
  });
}
const PENDING_SLUGS = new Set(sites.filter((s) => s.editorial_status === "pending-review").map((s) => s.slug));
for (const slug of SITE_SLUGS) {
  const name = SITE_NAMES[slug];
  // Title kept under 60 chars even for long names like "Yoshi Kawasaki XXX".
  // "Is It Worth It?" moved into the meta description hook.
  const baseTitle = `${name} Review ${YEAR} — TwinkVault`;
  const title = baseTitle.length <= 60 ? baseTitle : `${name} Review | TwinkVault`;
  // Social card from the site's own clean cover when we have one — the money
  // pages shipped the generic favicon as og:image before this.
  const reviewHero = selectGuideHero([slug]);
  routes.push({
    path: `/reviews/${slug}`,
    title,
    description: `Is ${name} worth the membership? Honest ${YEAR} review — real scores on content, value, updates, mobile, plus pricing and pros/cons.`,
    ogImage: reviewHero && reviewHero.hero_site_slug === slug ? `${BASE_URL}${reviewHero.hero_image}` : undefined,
    noindex: PENDING_SLUGS.has(slug),
  });
}
for (const site of sites) {
  const pct = site.deal_discount;
  const hasDeal = pct > 0;
  // Title kept under 60 chars even for long names. Verification month
  // moved to the description to free up title characters.
  // Exact-match "Discount" in the title — the demand queries are literally
  // "{brand} discount" (200+ imp on twinktrade alone) and the old title
  // omitted the word; Bing treats exact title matches as a direct signal.
  const dealTitle = `${site.name} Discount: ${pct}% Off (${YEAR}) | TwinkVault`;
  const noDealTitle = `${site.name} Discount Code ${YEAR} | TwinkVault`;
  routes.push({
    path: `/discount/${site.slug}`,
    title: hasDeal
      ? (dealTitle.length <= 60 ? dealTitle : `${site.name}: ${pct}% Off | TwinkVault`)
      : (noDealTitle.length <= 60 ? noDealTitle : `${site.name} Discount | TwinkVault`),
    noindex: PENDING_SLUGS.has(site.slug),
    description: hasDeal
      ? `${site.name} discount code ${YEAR}: ${site.price_annual} with our verified ${pct}% off — confirmed ${DEAL_VERIFIED_DATE}. Activate the lowest verified annual price.`
      : `Looking for a ${site.name} discount code? Get the lowest verified ${site.name} membership price. Updated ${DEAL_VERIFIED_DATE} — read pricing tiers and value verdict.`,
  });
}
for (const slug of CATEGORY_SLUGS) {
  routes.push({
    path: `/category/${slug}`,
    title: `${CATEGORY_NAMES[slug]} Twink Sites ${YEAR} | TwinkVault`,
    description: `The best ${CATEGORY_NAMES[slug].toLowerCase()} twink sites of ${YEAR}, ranked and reviewed. Verified pricing, real scores, paid membership reviews — no commission-rigged rankings.`,
  });
}
for (const slug of Object.keys(NICHE_META)) {
  const meta = NICHE_META[slug];
  routes.push({ path: `/niche/${slug}`, title: `${meta.seoTitle} ${YEAR} | TwinkVault`, description: meta.seoDescription });
}
// Generic /alternatives/{site} routes — one per entry in
// ALTERNATIVES_CONTENT that isn't already routed at /{site}-alternatives.
const LEGACY_ALT_ROUTES = new Set(["helix-studios-alternatives", "sean-cody-alternatives", "nakedsword-alternatives"]);
for (const key of Object.keys(ALTERNATIVES_CONTENT)) {
  if (LEGACY_ALT_ROUTES.has(key)) continue;
  const siteSlug = key.replace(/-alternatives$/, "");
  const site = sites.find((s) => s.slug === siteSlug);
  if (!site) continue;
  routes.push({
    path: `/alternatives/${siteSlug}`,
    title: `${site.name} Alternatives (${YEAR}) | TwinkVault`,
    description: `The best alternatives to ${site.name} — ranked by overlap on content style, pricing, library depth, and update frequency. Honest reviews, updated for ${YEAR}.`,
  });
}

// Dynamic worth-it routes — ISWORTHIT_CONTENT keys beyond the 10 hand-routed
// slugs (which are already in the static route list). Same title trim as
// guides so prerendered <title> matches the hydrated Helmet output.
const HAND_ROUTED_WORTHIT = new Set([
  "nakedsword", "sean-cody", "helix-studios", "men", "twinks-in-shorts",
  "southern-strokes", "peterfever", "sayuncle", "rawhole", "athletic-twinks",
]);
for (const slug of Object.keys(ISWORTHIT_CONTENT)) {
  if (HAND_ROUTED_WORTHIT.has(slug)) continue;
  const body = ISWORTHIT_CONTENT[slug];
  const withSuffix = `${body.h1} | TwinkVault`;
  const wTitle =
    withSuffix.length <= 60 ? withSuffix
    : body.h1.length <= 60 ? body.h1
    : body.h1.slice(0, 57) + "…";
  const wHero = selectGuideHero([slug]);
  routes.push({
    path: `/is-${slug}-worth-it`,
    title: wTitle,
    description: body.meta_description,
    ogImage: wHero && wHero.hero_site_slug === slug ? `${BASE_URL}${wHero.hero_image}` : undefined,
  });
}

// /guides index — hub linking every guide (real intro copy lives in
// src/pages/GuidesIndex.tsx; this just supplies <title>/<meta>).
routes.push({
  path: "/guides",
  title: "Gay Porn Site Guides — Billing, Cancelling & Trials | TwinkVault",
  description:
    "Plain-English guides to gay porn site memberships: how billing and trials work, how to cancel cleanly, decode mystery charges, and protect your privacy.",
});

// Guide routes — one per entry in GUIDE_CONTENT. Title trim matches the
// fallback in src/pages/GuidePage.tsx so prerendered HTML <title> agrees
// with the React Helmet output after hydration.
for (const slug of Object.keys(GUIDE_CONTENT)) {
  const body = GUIDE_CONTENT[slug];
  const withSuffix = `${body.h1} | TwinkVault`;
  const title =
    withSuffix.length <= 60 ? withSuffix
    : body.h1.length <= 60 ? body.h1
    : body.h1.slice(0, 57) + "…";
  routes.push({
    path: `/guide/${slug}`,
    title,
    description: body.meta_description,
    // Hero cover (seeded by slug, chosen from existing clean site creative)
    // doubles as the social-card image; replaces the generic favicon default.
    // Computed here so it matches GuidePage's render-time selection exactly.
    ogImage: (() => {
      const h = selectGuideHero(body.related_sites ?? [], slug);
      return h ? `${BASE_URL}${h.hero_image}` : undefined;
    })(),
  });
}

for (const pairSlug of getFeaturedComparePairsList()) {
  const [a, b] = pairSlug.split("-vs-");
  const aName = SITE_NAMES[a] ?? a;
  const bName = SITE_NAMES[b] ?? b;
  // Social-card image from the compared sites' clean covers (seeded by pair
  // slug — matches ComparePage's render-time pick). Replaces the favicon.
  const pairHero = selectGuideHero([a, b], pairSlug);
  // Tighter title — "Which Is Worth It?" hook moved to meta description
  // to keep titles under 60 chars in SERPs.
  routes.push({
    path: `/compare/${pairSlug}`,
    title: `${aName} vs ${bName} (${YEAR}) | TwinkVault`,
    description: `${aName} vs ${bName} compared side by side — scores, pricing, pros/cons, and the verdict on which is the better gay porn site subscription in ${YEAR}.`,
    ogImage: pairHero ? `${BASE_URL}${pairHero.hero_image}` : undefined,
  });
}

// ---------------------------------------------------------------------------
// Inject meta + body into the template
// ---------------------------------------------------------------------------
/**
 * Escape characters that would corrupt a double-quoted HTML attribute.
 * Without this, descriptions containing inner double-quotes (e.g.
 * `Honest answer to "is X worth it"`) prematurely terminate the
 * content="" attribute and Google reads only the leading fragment.
 */
function htmlAttrEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectMeta(html: string, route: RouteMeta, helmetHtml: string): string {
  const url = `${BASE_URL}${route.path}`;
  const title = htmlAttrEscape(route.title);
  const desc = htmlAttrEscape(route.description);

  // Title body uses HTML entity encoding too — &quot; renders as " in
  // SERPs the same as the literal char.
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${desc}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${desc}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${desc}" />`);

  // Per-route social-card image. Without this every route inherits the
  // generic favicon (pwa-512.png) from the template. Site-banner heroes are
  // 1200×750, so the og:image dimension hints are updated to match.
  if (route.ogImage) {
    const img = htmlAttrEscape(route.ogImage);
    html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${img}" />`);
    html = html.replace(/<meta property="og:image:width" content="[^"]*" \/>/, `<meta property="og:image:width" content="1200" />`);
    html = html.replace(/<meta property="og:image:height" content="[^"]*" \/>/, `<meta property="og:image:height" content="750" />`);
    html = html.replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${img}" />`);
  }

  // Pending-review placeholders: flip the template's default index,follow.
  // (Helmet meta tags are NOT carried into prerendered HTML — only script/link
  // are — so noindex MUST be applied here at the template level.)
  if (route.noindex) {
    html = html.replace(/<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="noindex, follow" />`);
  }

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
