/**
 * Anchor-text variation pools for internal links.
 *
 * Why this exists: when the same page consistently links to a destination
 * with identical anchor text across the entire site, Google reads that as
 * either keyword stuffing (negative) or a single canonical link (neutral).
 * Varied anchor text signals natural editorial linking (positive).
 *
 * Constraint: each individual SOURCE page must always emit the same anchor
 * for a given destination — anchors that flip between crawls look like
 * cloaking. Deterministic selection (hash of source slug → index into the
 * variation pool) gives us per-source variety with per-crawl stability.
 */

export type AnchorPool = readonly string[];

/**
 * Per-destination anchor variation pools. When a destination doesn't have
 * an entry here, callers fall back to a generic anchor.
 */
export const ANCHOR_VARIATIONS: Record<string, AnchorPool> = {
  // ── Broad SEO landing pages ──────────────────────────────────────────
  "/best-gay-porn-sites": [
    "best gay porn sites",
    "top gay porn sites ranked",
    "the best gay porn sites of 2026",
    "every major gay porn site ranked",
  ],
  "/best-twink-porn-sites": [
    "best twink porn sites",
    "top twink porn sites",
    "twink porn sites ranked by quality",
    "the best twink sites of 2026",
  ],
  "/best-bareback-twink-sites": [
    "best bareback twink porn sites",
    "top bareback twink studios",
    "raw twink porn sites ranked",
    "best bareback twink content",
  ],
  "/best-bareback-gay-sites": [
    "best bareback gay sites",
    "top bareback content",
    "raw gay porn sites ranked",
    "best bareback content of 2026",
  ],
  "/best-cheap-gay-porn-sites": [
    "cheapest gay porn sites",
    "best budget gay porn picks",
    "affordable gay porn sites ranked",
    "cheap gay porn under $10",
  ],
  "/best-gay-sites-under-10": [
    "gay porn sites under $10/mo",
    "cheapest annual subscriptions",
    "best value gay porn",
    "every gay site under $10 ranked",
  ],
  "/best-twink-porn-sites-with-free-trials": [
    "twink porn sites with free trials",
    "gay porn trials worth trying",
    "free trial gay porn sites ranked",
    "try-before-you-buy twink sites",
  ],
  "/gay-porn-sites-with-free-trial": [
    "gay porn sites with trials",
    "free trial twink and gay porn sites",
    "trial-offering gay porn sites",
    "every gay porn trial we've verified",
  ],
  "/free-trial-twink-sites": [
    "twink sites with trial access",
    "free trial twink porn picks",
    "trial-offering twink sites",
  ],
  "/cheapest-twink-sites": [
    "cheapest twink porn sites",
    "lowest-priced twink subscriptions",
    "budget twink porn ranked",
  ],
  "/best-amateur-gay-sites": [
    "best amateur gay porn sites",
    "top amateur gay sites",
    "amateur gay porn ranked",
  ],
  "/best-premium-gay-sites": [
    "best premium gay porn sites",
    "top-tier gay studios ranked",
    "premium gay studio sites",
  ],
  "/best-asian-gay-sites": [
    "best Asian gay porn sites",
    "top Asian gay studios",
    "Asian gay porn ranked",
  ],
  "/best-daddy-twink-sites": [
    "best daddy/twink gay porn sites",
    "top daddy-twink studios",
    "age-gap gay porn ranked",
  ],
  "/best-gay-porn-subscription": [
    "best gay porn subscriptions",
    "subscriptions worth paying for",
    "best-value gay porn memberships",
  ],
  "/best-value-gay-porn-sites": [
    "best value gay porn sites",
    "most content per dollar",
    "high-value gay porn picks",
  ],
  "/best-twink-sites": [
    "best twink sites 2026 leaderboard",
    "top twink picks for 2026",
    "2026 twink rankings",
  ],
  "/gay-porn-sites-ranked": [
    "all gay porn sites ranked",
    "sortable gay porn comparison",
    "every site we've scored",
  ],
  "/gay-porn-site-reviews": [
    "all gay porn site reviews",
    "every twink site review",
    "gay porn reviews indexed by niche",
  ],
  "/best-gay-sites-for-beginners": [
    "best gay porn sites for beginners",
    "beginner-friendly gay porn",
    "where to start with gay subscriptions",
  ],
  "/best-gay-sites-with-downloads": [
    "gay porn sites with downloads",
    "downloadable gay porn picks",
    "sites that still allow downloads",
  ],
  "/best-twink-sites": [
    "best twink sites overall",
    "all-time top twink sites",
    "every twink site ranked",
  ],

  // ── Tools ────────────────────────────────────────────────────────────
  "/ask-ai": [
    "ask TwinkAI for a recommendation",
    "get an AI pick",
    "try the AI site recommender",
    "let TwinkAI match you to a site",
  ],
  "/find-my-site": [
    "take the 30-second quiz",
    "find your perfect site",
    "site finder quiz",
  ],

  // ── Hub pages ────────────────────────────────────────────────────────
  "/top-sites": [
    "full site rankings",
    "complete top sites list",
    "every ranked site",
  ],
  "/reviews": [
    "all reviews",
    "every site we've reviewed",
    "complete review library",
  ],
  "/best-deals": [
    "current gay porn deals",
    "active discount offers",
    "best gay porn deals right now",
  ],
  "/compare": [
    "build a comparison",
    "compare sites side by side",
    "interactive site comparison",
  ],
};

/**
 * Picks an anchor variation deterministically based on the source slug.
 * The same source page always emits the same anchor for a given destination
 * — necessary to avoid the anchor flux that would look like cloaking on
 * successive crawls.
 *
 * Returns the destination URL's fallback (or `fallback` arg) when no pool
 * exists for that destination.
 */
export function getAnchor(destPath: string, sourceSlug: string, fallback?: string): string {
  const pool = ANCHOR_VARIATIONS[destPath];
  if (!pool || pool.length === 0) return fallback ?? destPath;

  // Deterministic hash → index. Simple sum of char codes is enough for
  // this — we just need stable distribution across source slugs.
  let hash = 0;
  for (let i = 0; i < sourceSlug.length; i++) {
    hash = (hash * 31 + sourceSlug.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}

/**
 * Returns all distinct anchor variations registered for a destination — useful
 * for sanity-checking and for the "anchor variety stats" report.
 */
export function getAnchorPool(destPath: string): AnchorPool {
  return ANCHOR_VARIATIONS[destPath] ?? [];
}
