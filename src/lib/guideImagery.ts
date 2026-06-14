/**
 * Hero-image selection for guides/articles.
 *
 * Guides and articles historically shipped with NO body image and the
 * generic favicon as og:image. This picks the most topically-relevant
 * EXISTING clean cover from the per-site creative library
 * (src/data/site-imagery.ts) — we never AI-generate and never use
 * leaderboard/promo banners (those aren't in siteImagery, so sourcing
 * exclusively from this map structurally avoids burned-in competitor
 * watermarks).
 *
 * Resolution order, given a guide's related_sites:
 *   1. first related site that has a clean cover  → link hero to its review
 *   2. first TOP-10 site that has a clean cover   → topical default
 *   3. null                                       → caller uses favicon
 *
 * Used by both the daily content engine (stamps the fields onto the
 * persisted GuideBody) and scripts/prerender-app.ts (og:image injection).
 */
import { siteImagery } from "../data/site-imagery";

export interface GuideHero {
  /** Absolute-from-root path, e.g. "/site-banners/twinks-in-shorts-hero.jpg". */
  hero_image: string;
  /** SFW alt copy (brand identity, not content). */
  hero_alt: string;
  /** The site the hero depicts — used to link the hero to /reviews/{slug}. */
  hero_site_slug: string;
}

/** Topical defaults when a guide's own related_sites have no covers. These
 *  are the first TOP-10 catalog slugs that carry clean covers today. */
const DEFAULT_HERO_FALLBACK_SLUGS = [
  "twinks-in-shorts",
  "athletic-twinks",
  "southern-strokes",
];

/** Last-resort og:image only — the generic PWA icon. */
export const FAVICON_OG_IMAGE = "/pwa-512.png";

function coverFor(slug: string): GuideHero | null {
  const img = siteImagery[slug];
  if (img && img.hero_image_url) {
    return { hero_image: img.hero_image_url, hero_alt: img.banner_alt, hero_site_slug: slug };
  }
  return null;
}

/**
 * Pick a hero for a guide from its related sites, falling back to topical
 * defaults. Returns null only if nothing in the catalog has a cover (caller
 * then uses the favicon as a last resort).
 */
export function selectGuideHero(relatedSlugs: string[] = []): GuideHero | null {
  for (const slug of relatedSlugs) {
    const hit = coverFor(slug);
    if (hit) return hit;
  }
  for (const slug of DEFAULT_HERO_FALLBACK_SLUGS) {
    const hit = coverFor(slug);
    if (hit) return hit;
  }
  return null;
}

/** Build the absolute og:image URL for a guide hero (or favicon fallback). */
export function guideOgImage(heroImage: string | undefined, baseUrl: string): string {
  return `${baseUrl}${heroImage ?? FAVICON_OG_IMAGE}`;
}
