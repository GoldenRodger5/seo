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
import { getCardImage, getSiteImagery } from "../data/site-imagery";

export interface GuideHero {
  /** Absolute-from-root path, e.g. "/site-banners/twinks-in-shorts-hero.jpg". */
  hero_image: string;
  hero_wide?: boolean;
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
  // Use the card crop (clean, ~3:2), never the raw hero: wide banners and
  // 900×150 promo strips looked blurry/zoomed when cover-cropped into a
  // guide card. getCardImage returns null for sites with no card-safe art.
  const card = getCardImage(slug);
  if (card) {
    return { hero_image: card, hero_wide: false, hero_alt: getSiteImagery(slug).banner_alt, hero_site_slug: slug };
  }
  return null;
}

/** Deterministic 32-bit hash of a string (FNV-ish). Used to seed hero choice
 *  so it's stable per slug across SSR + client but varied across articles. */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Pick a hero for an article from its related sites, falling back to topical
 * defaults. Returns null only if nothing in the catalog has a cover (caller
 * then uses the favicon as a last resort).
 *
 * When `seed` is provided (the article slug), the hero is chosen
 * deterministically from ALL covered related sites — so different articles get
 * different heroes instead of every one collapsing onto the first covered
 * slug. Without a seed it returns the first covered cover (back-compat).
 */
export function selectGuideHero(relatedSlugs: string[] = [], seed?: string): GuideHero | null {
  const coveredRelated = relatedSlugs.map(coverFor).filter((h): h is GuideHero => h !== null);
  const pool = coveredRelated.length
    ? coveredRelated
    : DEFAULT_HERO_FALLBACK_SLUGS.map(coverFor).filter((h): h is GuideHero => h !== null);
  if (pool.length === 0) return null;
  if (!seed) return pool[0];
  return pool[hashSeed(seed) % pool.length];
}

/** Build the absolute og:image URL for a guide hero (or favicon fallback). */
export function guideOgImage(heroImage: string | undefined, baseUrl: string): string {
  return `${baseUrl}${heroImage ?? FAVICON_OG_IMAGE}`;
}

/**
 * A curated, diverse pool of premium sites with clean card crops. Guide covers
 * are decorative, so we prefer a varied premium look over the (heavily
 * overlapping, amateur-promo) related_sites — which collapsed onto 2-3
 * duplicated images across the whole /guides grid.
 */
const GUIDE_COVER_POOL = [
  "helix-studios", "sean-cody", "men", "icon-male", "noirmale", "hot-house",
  "raging-stallion", "next-door-studios", "twinkpop", "peterfever",
  "hard-brit-lads", "maleaccess",
];

/**
 * Assign a DISTINCT cover to every guide (no duplicates across the section).
 * Deterministic: each guide's slug seeds a rotation start into the pool, and a
 * greedy pass skips already-used images. Pool = curated premium covers first,
 * then the guide's own related_sites as backfill. Used by both the /guides
 * index and each /guide/{slug} page so the card and the page hero match.
 */
export function assignGuideHeroes(
  guides: { slug: string; related_sites?: string[] }[]
): Record<string, GuideHero | null> {
  const curated = GUIDE_COVER_POOL.map(coverFor).filter((h): h is GuideHero => h !== null);
  const used = new Set<string>();
  const out: Record<string, GuideHero | null> = {};
  for (const g of guides) {
    const related = (g.related_sites ?? []).map(coverFor).filter((h): h is GuideHero => h !== null);
    const pool = [...curated, ...related];
    let pick: GuideHero | null = null;
    if (pool.length > 0) {
      const start = hashSeed(g.slug) % pool.length;
      for (let i = 0; i < pool.length; i++) {
        const cand = pool[(start + i) % pool.length];
        if (!used.has(cand.hero_image)) { pick = cand; break; }
      }
      if (!pick) pick = pool[start]; // more guides than distinct covers → accept a repeat
    }
    if (pick) used.add(pick.hero_image);
    out[g.slug] = pick;
  }
  return out;
}
