/**
 * Allowlist of /compare/:slug pairs that get full SEO treatment —
 * indexed in robots meta, prerendered with unique titles, included in
 * sitemap.xml, eligible for richer FAQ generation.
 *
 * Set is computed at module-eval time from the live scoring algorithm
 * (rankComparePairs) so it auto-updates whenever sites.ts, useAIReview.ts,
 * or site-niches.ts changes. Union'd with the legacy 15 pairs that were
 * prerendered prior to this consolidation so we don't accidentally drop
 * any URL that already has external links pointing at it.
 *
 * All slugs are canonical alphabetical form: `{alpha-first}-vs-{alpha-second}`.
 */

import { rankComparePairs } from "../lib/compareRanking";
import { getSiteBySlug, isAffiliated } from "../data/sites";
import { activeDemotedPairs } from "./compare-demotions";

// Threshold-based selection rather than fixed top-N. Now that every site
// has an AI review body (the +20 review-bonus is universal), the natural
// score distribution gives a sensible cutoff at 60: pairs above this
// score have meaningful SEO signals (high overall scores, niche overlap,
// price differentiation, deal monetization, or pre-existing AI body).
// Pairs below score 60 are eligible to render but stay noindex'd.
const SCORE_THRESHOLD = 60;

/**
 * 12 compare pairs that were prerendered from project inception (top-6
 * sites cross-product, minus 3 pairs where both sites are unaffiliated).
 * Preserved as a safety net so we don't break any existing inbound links
 * or indexed URLs during the consolidation.
 *
 * Removed 2026-05-15:
 *   - helix-studios-vs-next-door-twink     (both unaffiliated)
 *   - helix-studios-vs-next-door-world     (both unaffiliated)
 *   - next-door-twink-vs-next-door-world   (both unaffiliated)
 * Re-add the ndt-vs-ndw pair when both gain affiliate URLs.
 */
const LEGACY_PRERENDERED_PAIRS = [
  "helix-studios-vs-twinks-in-shorts",
  "athletic-twinks-vs-helix-studios",
  "helix-studios-vs-southern-strokes",
  "next-door-twink-vs-twinks-in-shorts",
  "athletic-twinks-vs-next-door-twink",
  "next-door-twink-vs-southern-strokes",
  "next-door-world-vs-twinks-in-shorts",
  "athletic-twinks-vs-next-door-world",
  "next-door-world-vs-southern-strokes",
  "athletic-twinks-vs-twinks-in-shorts",
  "southern-strokes-vs-twinks-in-shorts",
  "athletic-twinks-vs-southern-strokes",
] as const;

/**
 * A featured pair needs at least one affiliated side to be monetizable, and
 * NEITHER side may be editorial-only or pending-review. Featured compares are
 * indexable commercial surfaces — the owner's standing constraint keeps
 * non-commercial sites out of those. This is also the anti-reflood guard:
 * when the engine published 4 editorial-only money reviews (Jul 9–12), the
 * score-derived featured set silently regrew 161 → 344 pairs (183 templated
 * compares against the new sites) — the exact flood the staged demotion is
 * draining. Every future editorial-only publish would do the same without
 * this exclusion.
 */
function hasAffiliateConversionPath(pairSlug: string): boolean {
  const m = pairSlug.match(/^(.+)-vs-(.+)$/);
  if (!m) return false;
  const a = getSiteBySlug(m[1]);
  const b = getSiteBySlug(m[2]);
  if (!a || !b) return false;
  const nonCommercial = (s: typeof a) =>
    s.editorial_status === "editorial-only" || s.editorial_status === "pending-review";
  if (nonCommercial(a) || nonCommercial(b)) return false;
  return isAffiliated(a) || isAffiliated(b);
}

/**
 * Pairs PINNED into the featured set because GSC shows real impressions
 * (≥10 in the trailing 3 months, Performance export 2026-07-17) — the
 * demotion plan's standing rule is to spare earners. Score-drift had pushed
 * most of these out of the threshold set (some were even orphan-redirected)
 * while they were among the few pages Google actually served. Canonical
 * order; still subject to the commercial guard below. Re-audit against GSC
 * quarterly — drop any that stop earning.
 */
const PINNED_EARNING_PAIRS = [
  "bareback-that-hole-vs-brothercrush", // 167 imp
  "barebackcumpigs-vs-boysatcamp",      // 148 imp (GSC saw boysatcamp-first order)
  "barebackcumpigs-vs-militarydick",    // 122 imp
  "barebackrtxxx-vs-wuboyz",            // 120 imp
  "boysatcamp-vs-yesfather",            // 78 imp
  "prideflame-vs-southern-strokes",     // 15 imp
  "bigstr-vs-wuboyz",                   // 15 imp (spared from tranche 1)
  "barebackrtxxx-vs-cumpigmen",         // 11 imp
  "hard-brit-lads-vs-prideflame",       // 10 imp
  "bigstr-vs-prideflame",               // 10 imp (spared from tranche 1)
  "familydick-vs-trailertrashboys",     // 10 imp
  // Long-tail earners (3-9 imp, Performance export 2026-07-18) — every pair
  // Google chose to serve pre-blackout gets its page back:
  "nakedsword-vs-sean-cody",
  "maleaccess-vs-militarydick",
  "hiroyaxxx-vs-realmenfuck",
  "bareback-that-hole-vs-next-door-twink",
  "guy-selector-vs-helix-studios",
  "japanboyz-vs-peterfever",
  "next-door-twink-vs-swinginballs",
  "maleaccess-vs-southern-strokes",
  "cumpigmen-vs-nakedsword",
  "boysatcamp-vs-familydick",
  "helix-studios-vs-touch-that-boy",
  "barebackcumpigs-vs-twinktrade",
  "hard-brit-lads-vs-hiroyaxxx",
  "next-door-world-vs-reality-dudes",
  "maleaccess-vs-reality-dudes",
  "bearchubs-vs-familydick",
  "next-door-world-vs-twinks-in-shorts",
  "barebackrtxxx-vs-breed-me-raw",
  "breed-me-raw-vs-japanboyz",
  "dudesraw-vs-trailertrashboys",
];

let cached: Set<string> | null = null;

/** Returns the canonical featured-pairs Set (memoized). */
export function getFeaturedComparePairs(): Set<string> {
  if (cached) return cached;
  const ranked = rankComparePairs()
    .filter((p) => p.score >= SCORE_THRESHOLD)
    .map((p) => p.slug);
  // Defense-in-depth: also drop any dynamic pair where both sides are
  // unaffiliated, so future scoring shifts can't sneak a zero-revenue
  // pair back into the featured set.
  const featured = new Set(
    [...ranked, ...LEGACY_PRERENDERED_PAIRS, ...PINNED_EARNING_PAIRS].filter(hasAffiliateConversionPath),
  );
  // Staged demotions (FIX 7): pairs in an ACTIVE demotion tranche leave the
  // featured set, which removes them from the sitemap + prerender and flips
  // the rendered page to noindex, while vercel.json 301s (kept in sync via
  // `npm run compare-redirects`) send their traffic to the mapped review.
  for (const demoted of activeDemotedPairs()) featured.delete(demoted);
  cached = featured;
  return cached;
}

/** Returns the canonical featured-pairs as a sorted array (for sitemap/prerender). */
export function getFeaturedComparePairsList(): string[] {
  return [...getFeaturedComparePairs()].sort();
}

export function isFeaturedComparePair(slug: string): boolean {
  // Compare slugs come from URL params in canonical order (A-vs-B). Normalize
  // to alphabetical so legacy or hand-typed URLs still resolve correctly.
  return getFeaturedComparePairs().has(canonicalComparePairSlug(slug));
}

/**
 * Canonical form of a compare-pair slug: the two site slugs in alphabetical
 * order joined by "-vs-". Prerender, sitemap, and featured-pair membership all
 * use this form, so canonicalizing here keeps every surface in agreement and
 * prevents the same comparison from existing at two indexable URLs (e.g. the
 * queue writes "twinks-in-shorts-vs-southern-strokes" while the prerendered/
 * sitemapped URL is "southern-strokes-vs-twinks-in-shorts"). Returns the slug
 * unchanged if it isn't a well-formed "A-vs-B" pair.
 */
export function canonicalComparePairSlug(slug: string): string {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return slug;
  return [...parts].sort().join("-vs-");
}

/**
 * Featured compare-pair slugs (canonical order) that include `siteSlug`. Lets
 * a site's review page link the head-to-head pages it participates in — these
 * pages are indexable but were orphaned (reachable only via the sitemap), so
 * surfacing them here adds inbound internal links + de-orphans them.
 */
export function featuredComparePairsForSite(siteSlug: string): string[] {
  return getFeaturedComparePairsList().filter((p) => {
    const parts = p.split("-vs-");
    return parts.length === 2 && (parts[0] === siteSlug || parts[1] === siteSlug);
  });
}
