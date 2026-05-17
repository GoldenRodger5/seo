/**
 * Featured banner pool — eligible affiliate banners surfaced via
 * <FeaturedDealBanner>. Hand-curated from the 38 EXTREME_ASPECT banners
 * the image processor flagged (see docs/banner-triage.md).
 *
 * Eligibility rule: brand must NOT be on Buddy Profits/Gamma (Next Door
 * sites) or HelixCash (Helix Studios) — none of those have a banner in
 * this pool, so every entry below is ELIGIBLE.
 */
import { getSiteBySlug } from "./sites";
import { siteNicheMap } from "./site-niches";

export type BannerAspectClass = "half-banner" | "leaderboard" | "skyscraper";

interface BannerSeed {
  src: string;
  siteSlug: string;
  brandName: string;
  width: number;
  height: number;
  qualityScore: number;
}

export interface FeaturedBanner extends BannerSeed {
  /** width / height */
  aspect: number;
  aspectClass: BannerAspectClass;
  /** Niche slugs this banner pairs with — derived from siteNicheMap so they
   *  always match the canonical taxonomy in /niche/{slug} pages. */
  niches: string[];
}

const BANNER_SEEDS: BannerSeed[] = [
  // 1920-wide half-banners
  { src: "/site-banners/bareback-that-hole-hero.jpg", siteSlug: "bareback-that-hole", brandName: "Bareback That Hole", width: 1920, height: 500, qualityScore: 5 },
  { src: "/site-banners/bear-films-hero.jpg", siteSlug: "bearfilms", brandName: "Bear Films", width: 1920, height: 500, qualityScore: 5 },
  { src: "/site-banners/breed-me-raw-hero.jpg", siteSlug: "breed-me-raw", brandName: "Breed Me Raw", width: 1920, height: 500, qualityScore: 5 },
  { src: "/site-banners/hairy-and-raw-hero.jpg", siteSlug: "hairyandraw", brandName: "Hairy and Raw", width: 1920, height: 500, qualityScore: 5 },
  { src: "/site-banners/hard-brit-lads-hero.jpg", siteSlug: "hard-brit-lads", brandName: "Hard Brit Lads", width: 1920, height: 500, qualityScore: 5 },
  { src: "/site-banners/southern-strokes-hero.jpg", siteSlug: "southern-strokes", brandName: "Southern Strokes", width: 1920, height: 500, qualityScore: 5 },
  // 2000-wide
  { src: "/site-banners/trailer-trash-boys-hero.jpg", siteSlug: "trailertrashboys", brandName: "Trailer Trash Boys", width: 2000, height: 500, qualityScore: 4 },
  { src: "/site-banners/nakedsword-hero.jpg", siteSlug: "nakedsword", brandName: "NakedSword", width: 2000, height: 800, qualityScore: 4 },
  // 900×250 half-banners
  { src: "/site-banners/boys-at-camp-hero.jpg", siteSlug: "boysatcamp", brandName: "Boys at Camp", width: 900, height: 250, qualityScore: 4 },
  { src: "/site-banners/brother-crush-hero.jpg", siteSlug: "brothercrush", brandName: "Brother Crush", width: 900, height: 250, qualityScore: 4 },
  { src: "/site-banners/dad-creep-hero.jpg", siteSlug: "dadcreep", brandName: "Dad Creep", width: 900, height: 250, qualityScore: 4 },
  { src: "/site-banners/family-dick-hero.jpg", siteSlug: "familydick", brandName: "Family Dick", width: 900, height: 250, qualityScore: 4 },
  { src: "/site-banners/latin-leche-hero.jpg", siteSlug: "latinleche", brandName: "Latin Leche", width: 900, height: 250, qualityScore: 4 },
  { src: "/site-banners/missionary-boys-hero.jpg", siteSlug: "missionaryboys", brandName: "Missionary Boys", width: 900, height: 250, qualityScore: 4 },
  { src: "/site-banners/say-uncle-hero.jpg", siteSlug: "sayuncle", brandName: "Say Uncle", width: 900, height: 250, qualityScore: 4 },
  { src: "/site-banners/yes-father-hero.jpg", siteSlug: "yesfather", brandName: "Yes Father", width: 900, height: 250, qualityScore: 4 },
  { src: "/site-banners/young-perps-hero.jpg", siteSlug: "youngperps", brandName: "Young Perps", width: 900, height: 250, qualityScore: 4 },
  // 970×250
  { src: "/site-banners/alternadudes-hero.jpg", siteSlug: "alternadudes", brandName: "AlternaDudes", width: 970, height: 250, qualityScore: 3 },
  { src: "/site-banners/swingin-balls-hero.jpg", siteSlug: "swinginballs", brandName: "Swingin Balls", width: 970, height: 250, qualityScore: 3 },
  // Mid-aspect
  { src: "/site-banners/daddy-on-twink-hero.jpg", siteSlug: "daddy-on-twink", brandName: "Daddy on Twink", width: 950, height: 200, qualityScore: 4 },
  { src: "/site-banners/twinks-in-shorts-hero.jpg", siteSlug: "twinks-in-shorts", brandName: "Twinks in Shorts", width: 1200, height: 250, qualityScore: 4 },
  { src: "/site-banners/japanboyz-hero.jpg", siteSlug: "japanboyz", brandName: "Japanboyz", width: 1323, height: 270, qualityScore: 4 },
  { src: "/site-banners/peterfever-hero.jpg", siteSlug: "peterfever", brandName: "PeterFever", width: 1323, height: 270, qualityScore: 4 },
  // Leaderboards
  { src: "/site-banners/boyfun-hero.jpg", siteSlug: "boyfun", brandName: "BoyFun", width: 980, height: 170, qualityScore: 3 },
  { src: "/site-banners/bareback-cum-pigs-hero.jpg", siteSlug: "barebackcumpigs", brandName: "Bareback Cum Pigs", width: 984, height: 170, qualityScore: 3 },
  { src: "/site-banners/athletic-twinks-hero.jpg", siteSlug: "athletic-twinks", brandName: "Athletic Twinks", width: 900, height: 150, qualityScore: 3 },
  { src: "/site-banners/bear-chubs-hero.jpg", siteSlug: "bearchubs", brandName: "Bear Chubs", width: 900, height: 150, qualityScore: 3 },
  { src: "/site-banners/touch-that-boy-hero.jpg", siteSlug: "touch-that-boy", brandName: "Touch That Boy", width: 900, height: 150, qualityScore: 3 },
  { src: "/site-banners/rawhole-hero.jpg", siteSlug: "rawhole", brandName: "RawHole", width: 1600, height: 240, qualityScore: 4 },
  { src: "/site-banners/real-men-fuck-hero.jpg", siteSlug: "realmenfuck", brandName: "Real Men Fuck", width: 1000, height: 150, qualityScore: 3 },
  { src: "/site-banners/squirt-studios-hero.jpg", siteSlug: "squirtstudios", brandName: "Squirt Studios", width: 2000, height: 300, qualityScore: 4 },
  // Skyscrapers (excluded from placeable pool but kept for site-page pinning)
  { src: "/site-banners/bully-him-hero.jpg", siteSlug: "bullyhim", brandName: "Bully Him", width: 970, height: 90, qualityScore: 2 },
  { src: "/site-banners/dirty-boy-video-hero.jpg", siteSlug: "dirtyboyvideo", brandName: "DirtyBoyVideo", width: 970, height: 90, qualityScore: 2 },
  { src: "/site-banners/twinktrade-hero.jpg", siteSlug: "twinktrade", brandName: "TwinkTrade", width: 970, height: 90, qualityScore: 2 },
  { src: "/site-banners/yoshi-kawasaki-xxx-hero.jpg", siteSlug: "yoshikawasakixxx", brandName: "Yoshi Kawasaki XXX", width: 970, height: 90, qualityScore: 2 },
  { src: "/site-banners/gay-asian-network-hero.jpg", siteSlug: "gayasiannetwork", brandName: "GayAsianNetwork", width: 1130, height: 69, qualityScore: 1 },
  { src: "/site-banners/sexjapantv-hero.jpg", siteSlug: "sexjapantv", brandName: "SexJapanTV", width: 1130, height: 69, qualityScore: 1 },
];

function classify(aspect: number): BannerAspectClass {
  if (aspect > 8) return "skyscraper";
  if (aspect >= 5) return "leaderboard";
  return "half-banner";
}

export const featuredBanners: FeaturedBanner[] = BANNER_SEEDS.map((seed) => {
  const aspect = +(seed.width / seed.height).toFixed(2);
  return {
    ...seed,
    aspect,
    aspectClass: classify(aspect),
    niches: siteNicheMap[seed.siteSlug] ?? [],
  };
});

/** Banners eligible for placement (excludes skyscrapers from desktop pool too — too thin). */
export const placeableBanners = featuredBanners.filter((b) => b.aspectClass !== "skyscraper");

/**
 * Pick a banner for a given placement. Selection is deterministic by date
 * (so same visitor sees the same banner per day) and seeded per placement
 * so different surfaces don't repeat the same banner on the same day.
 */
export function pickBanner(opts: {
  placement: "homepage" | "reviews-index" | "best-deals" | "niche-category" | "compare" | "review-page";
  nicheSlug?: string;
  compareSlugs?: [string, string];
  siteSlug?: string;
}): FeaturedBanner | null {
  // Review page: pin to the site's own banner if one exists.
  if (opts.placement === "review-page" && opts.siteSlug) {
    const ownBanner = getBannerForSite(opts.siteSlug);
    if (ownBanner) return ownBanner;
    return null; // no banner for this site → render nothing on the review page
  }

  let pool = placeableBanners;

  // Niche-aware selection
  if (opts.placement === "niche-category" && opts.nicheSlug) {
    const matched = pool.filter((b) => b.niches.includes(opts.nicheSlug!));
    if (matched.length > 0) pool = matched;
  }

  // Compare-aware selection — prefer banners for one of the two compared brands
  if (opts.placement === "compare" && opts.compareSlugs) {
    const [a, b] = opts.compareSlugs;
    const matched = pool.filter((bn) => bn.siteSlug === a || bn.siteSlug === b);
    if (matched.length > 0) pool = matched;
  }

  if (pool.length === 0) return null;

  // Rank by quality, take top 5 for rotation
  const ranked = [...pool].sort((x, y) => y.qualityScore - x.qualityScore);
  const top = ranked.slice(0, Math.min(5, ranked.length));

  // Deterministic daily seed × placement
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const placementSeed = ["homepage", "reviews-index", "best-deals", "niche-category", "compare", "review-page"].indexOf(opts.placement);
  const idx = (day + placementSeed * 7) % top.length;
  return top[idx];
}

/** Resolve the affiliate URL for a banner via sites.ts (single source of truth). */
export function getBannerAffiliateUrl(banner: FeaturedBanner): string | null {
  const site = getSiteBySlug(banner.siteSlug);
  return site?.affiliate_url ?? null;
}

/** Find the featured banner for a specific site slug, if one exists. */
export function getBannerForSite(siteSlug: string): FeaturedBanner | null {
  return featuredBanners.find((b) => b.siteSlug === siteSlug) ?? null;
}
