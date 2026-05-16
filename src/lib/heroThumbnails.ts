import { sites, type SiteData } from "../data/sites";
import { getSiteImagery } from "../data/site-imagery";

/**
 * The 6 sites that fill the homepage hero thumbnail grid. Rules:
 *   1. Must have a real hero_image_url in site-imagery.ts (no
 *      gradient/letter fallbacks in the hero — the grid is purely
 *      visual signal and a fallback tile defeats its purpose).
 *   2. Sorted by overall_score descending. Ties are broken by the
 *      original sites.ts order (which encodes editorial rank).
 *
 * If fewer than `count` sites qualify, returns however many were
 * available. Practically: the catalog has enough banners that we
 * always get 6+.
 */
export function getHeroThumbnailSites(count = 6): SiteData[] {
  return sites
    .filter((s) => Boolean(getSiteImagery(s.slug).hero_image_url))
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, count);
}
