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

// Threshold-based selection rather than fixed top-N. Now that every site
// has an AI review body (the +20 review-bonus is universal), the natural
// score distribution gives a sensible cutoff at 60: pairs above this
// score have meaningful SEO signals (high overall scores, niche overlap,
// price differentiation, deal monetization, or pre-existing AI body).
// Pairs below score 60 are eligible to render but stay noindex'd.
const SCORE_THRESHOLD = 60;

/**
 * 15 compare pairs that were prerendered from project inception (top-6
 * sites cross-product). Preserved as a safety net so we don't break any
 * existing inbound links or indexed URLs during the consolidation.
 */
const LEGACY_PRERENDERED_PAIRS = [
  "helix-studios-vs-next-door-twink",
  "helix-studios-vs-next-door-world",
  "helix-studios-vs-twinks-in-shorts",
  "athletic-twinks-vs-helix-studios",
  "helix-studios-vs-southern-strokes",
  "next-door-twink-vs-next-door-world",
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

let cached: Set<string> | null = null;

/** Returns the canonical featured-pairs Set (memoized). */
export function getFeaturedComparePairs(): Set<string> {
  if (cached) return cached;
  const ranked = rankComparePairs()
    .filter((p) => p.score >= SCORE_THRESHOLD)
    .map((p) => p.slug);
  cached = new Set([...ranked, ...LEGACY_PRERENDERED_PAIRS]);
  return cached;
}

/** Returns the canonical featured-pairs as a sorted array (for sitemap/prerender). */
export function getFeaturedComparePairsList(): string[] {
  return [...getFeaturedComparePairs()].sort();
}

export function isFeaturedComparePair(slug: string): boolean {
  // Compare slugs come from URL params in canonical order (A-vs-B). Normalize
  // to alphabetical so legacy or hand-typed URLs still resolve correctly.
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return false;
  const [a, b] = parts.sort();
  return getFeaturedComparePairs().has(`${a}-vs-${b}`);
}
