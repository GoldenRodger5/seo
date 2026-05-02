/**
 * Priority list for /discount/:slug pages.
 *
 * The route at /discount/:slug renders for ANY slug in sites.ts (handled by
 * DiscountPage.tsx) — this file just encodes which pages we actively SEO,
 * monitor for ranking, and surface in internal linking. Order matters:
 * higher index → higher priority for sitemap weighting and homepage
 * "Top Discounts" widgets.
 *
 * Priority drivers (in order):
 *   1. Existing GSC search-volume signal ("twinktrade discount" — 43 imp/mo)
 *   2. Active affiliate URL (we can monetise the click)
 *   3. Brandable / search-volume potential when the affiliate unlocks
 *
 * Update this list as affiliate approvals come in (Buddy Profits → unlocks
 * helix-studios, next-door-twink, next-door-world).
 */

export interface DiscountPagePriority {
  slug: string;
  /** GSC priority hint — informs sitemap <priority> tag and internal-link weighting */
  priority: number;
  /** Reason this slug is on the priority list (for human reference, not used by code) */
  reason: string;
}

export const discountPagePriorities: DiscountPagePriority[] = [
  // Tier 1 — proven GSC signal
  { slug: "twinktrade", priority: 1.0, reason: "GSC: 43 imp/mo at pos 11 — capture this query" },
  { slug: "next-door-twink", priority: 0.95, reason: "GSC: 8 imp/mo at pos 25.5 — captures when Buddy Profits unlocks" },

  // Tier 2 — branded queries we can rank for now (active affiliate URLs)
  { slug: "athletic-twinks", priority: 0.85, reason: "MyGayCash, 50% off discount, branded search potential" },
  { slug: "twinks-in-shorts", priority: 0.85, reason: "MyGayCash, 50% off discount" },
  { slug: "southern-strokes", priority: 0.85, reason: "MyGayCash, 55% off discount" },
  { slug: "daddy-on-twink", priority: 0.85, reason: "MyGayCash, 45% off discount" },
  { slug: "breed-me-raw", priority: 0.8, reason: "MyGayCash, 40% off discount" },
  { slug: "bareback-that-hole", priority: 0.8, reason: "MyGayCash, 40% off discount" },
  { slug: "hard-brit-lads", priority: 0.8, reason: "MyGayCash, branded search potential" },

  // Tier 3 — ChargedCash family/taboo discounts (high CTR niche)
  { slug: "familydick", priority: 0.8, reason: "ChargedCash, branded query potential" },
  { slug: "dadcreep", priority: 0.75, reason: "ChargedCash, branded query potential" },
  { slug: "sayuncle", priority: 0.75, reason: "ChargedCash, popular family taboo brand" },
  { slug: "brothercrush", priority: 0.7, reason: "ChargedCash" },
  { slug: "missionaryboys", priority: 0.7, reason: "ChargedCash" },

  // Tier 4 — brandable when affiliate unlocks
  { slug: "helix-studios", priority: 0.7, reason: "Rank #1 site — pending Buddy Profits affiliate" },
];

export const isPriorityDiscountPage = (slug: string): boolean =>
  discountPagePriorities.some((p) => p.slug === slug);

export const getDiscountPriority = (slug: string): number => {
  const entry = discountPagePriorities.find((p) => p.slug === slug);
  return entry?.priority ?? 0.6;
};
