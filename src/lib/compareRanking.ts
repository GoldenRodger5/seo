/**
 * Ranks /compare/:slug pairs by SEO + monetization value.
 *
 * The site has 1,891 possible compare-page combinations. Indexing all of
 * them as separate pages risks Google near-duplicate classification and
 * dilutes the strong pages (review pages) in our crawl budget. This module
 * scores every valid pair and surfaces a smaller list of high-value pairs
 * that should be fully indexed; the rest are reachable via internal links
 * but noindex'd.
 *
 * Eligibility: both sites must have an overall score (always true) AND
 * both must have an AI review body in useAIReview.ts (otherwise the
 * compare page renders thinly and shouldn't be a primary indexed page).
 *
 * Scoring (higher = more index-worthy):
 *   base   = siteA.overall_score + siteB.overall_score    (e.g. 4.6 + 4.4 = 9.0)
 *   +30    pair already has AI comparison body in comparison-content.ts
 *   +20    both sites have AI review content
 *   +15    shared at least one primary niche or category
 *   +10    monthly price differs by >$10 (price-tier comparison intent)
 *   +10    either site has an active deal_discount
 *   +5     either site is is_featured on the homepage
 *
 * Result is sorted descending. Pair direction is canonicalized to
 * alphabetical slug order so A-vs-B and B-vs-A collapse to one entry.
 */

import { sites as allSites, type SiteData } from "../data/sites";
import { reviewBodies } from "../hooks/useAIReview";
import { siteNicheMap } from "../data/site-niches";
import { COMPARISON_CONTENT } from "../data/comparison-content";

export interface RankedPair {
  /** Canonical slug: `${alphaFirst}-vs-${alphaSecond}`. */
  slug: string;
  siteA: string;
  siteB: string;
  score: number;
}

const parsePrice = (s: string): number => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;

const haveSharedNicheOrCategory = (a: SiteData, b: SiteData): boolean => {
  const aNiches = new Set([...(siteNicheMap[a.slug] ?? []), ...a.categories]);
  for (const n of [...(siteNicheMap[b.slug] ?? []), ...b.categories]) {
    if (aNiches.has(n)) return true;
  }
  return false;
};

export function rankComparePairs(sites: SiteData[] = allSites): RankedPair[] {
  const reviewed = new Set(Object.keys(reviewBodies));
  // Only pairs where BOTH sites have AI review content are eligible.
  const eligible = sites.filter((s) => reviewed.has(s.slug));

  const pairs: RankedPair[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const [a, b] = [eligible[i], eligible[j]].sort((x, y) => x.slug.localeCompare(y.slug));
      const slug = `${a.slug}-vs-${b.slug}`;
      if (seen.has(slug)) continue;
      seen.add(slug);

      let score = a.overall_score + b.overall_score; // both have a score by construction
      // Pre-existing AI comparison body is the strongest signal — these pairs
      // already have unique content shipped, so they should always make the
      // featured allowlist regardless of base score. Check both possible
      // orderings because the bot historically wrote keys in queue order
      // rather than alphabetical canonical.
      const reverseSlug = `${b.slug}-vs-${a.slug}`;
      if (COMPARISON_CONTENT[slug] || COMPARISON_CONTENT[reverseSlug]) score += 30;
      // Both have AI review — guaranteed true by eligibility filter, but kept
      // explicit so the scoring formula matches its documentation.
      score += 20;
      if (haveSharedNicheOrCategory(a, b)) score += 15;
      if (Math.abs(parsePrice(a.price_monthly) - parsePrice(b.price_monthly)) > 10) score += 10;
      if (a.deal_discount > 0 || b.deal_discount > 0) score += 10;
      if (a.is_featured || b.is_featured) score += 5;

      pairs.push({ slug, siteA: a.slug, siteB: b.slug, score });
    }
  }

  return pairs.sort((x, y) => y.score - x.score);
}
