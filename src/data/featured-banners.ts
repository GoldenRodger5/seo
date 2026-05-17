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

export type BannerAspectClass = "half-banner" | "leaderboard" | "skyscraper";

export interface FeaturedBanner {
  /** Banner file under /public/site-banners/ */
  src: string;
  /** Slug used to look up the SiteData (affiliate_url, name, niches) */
  siteSlug: string;
  /** Hero copy fallback */
  brandName: string;
  width: number;
  height: number;
  /** width / height */
  aspect: number;
  aspectClass: BannerAspectClass;
  /** 1–5, higher = better candidate for prime placement */
  qualityScore: number;
  /** Niche slugs this banner most naturally pairs with (for context-aware selection) */
  niches: string[];
}

export const featuredBanners: FeaturedBanner[] = [
  // === High-quality 1920-wide half-banners (3.84:1) — best composition ===
  { src: "/site-banners/bareback-that-hole-hero.jpg", siteSlug: "bareback-that-hole", brandName: "Bareback That Hole", width: 1920, height: 500, aspect: 3.84, aspectClass: "half-banner", qualityScore: 5, niches: ["bareback", "amateur-twinks"] },
  { src: "/site-banners/bear-films-hero.jpg", siteSlug: "bearfilms", brandName: "Bear Films", width: 1920, height: 500, aspect: 3.84, aspectClass: "half-banner", qualityScore: 5, niches: ["bears", "hairy"] },
  { src: "/site-banners/breed-me-raw-hero.jpg", siteSlug: "breed-me-raw", brandName: "Breed Me Raw", width: 1920, height: 500, aspect: 3.84, aspectClass: "half-banner", qualityScore: 5, niches: ["bareback"] },
  { src: "/site-banners/hairy-and-raw-hero.jpg", siteSlug: "hairyandraw", brandName: "Hairy and Raw", width: 1920, height: 500, aspect: 3.84, aspectClass: "half-banner", qualityScore: 5, niches: ["bears", "hairy", "bareback"] },
  { src: "/site-banners/hard-brit-lads-hero.jpg", siteSlug: "hard-brit-lads", brandName: "Hard Brit Lads", width: 1920, height: 500, aspect: 3.84, aspectClass: "half-banner", qualityScore: 5, niches: ["british", "amateur-twinks"] },
  { src: "/site-banners/southern-strokes-hero.jpg", siteSlug: "southern-strokes", brandName: "Southern Strokes", width: 1920, height: 500, aspect: 3.84, aspectClass: "half-banner", qualityScore: 5, niches: ["amateur-twinks", "twinks"] },

  // === Wider half-banners (2000-wide) ===
  { src: "/site-banners/trailer-trash-boys-hero.jpg", siteSlug: "trailertrashboys", brandName: "Trailer Trash Boys", width: 2000, height: 500, aspect: 4.0, aspectClass: "half-banner", qualityScore: 4, niches: ["amateur-twinks"] },
  { src: "/site-banners/nakedsword-hero.jpg", siteSlug: "nakedsword", brandName: "NakedSword", width: 2000, height: 800, aspect: 2.5, aspectClass: "half-banner", qualityScore: 4, niches: ["premium-studios"] },

  // === Standard 900–1200 half-banners (3.6:1) ===
  { src: "/site-banners/boys-at-camp-hero.jpg", siteSlug: "boysatcamp", brandName: "Boys at Camp", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["twinks", "amateur-twinks"] },
  { src: "/site-banners/brother-crush-hero.jpg", siteSlug: "brothercrush", brandName: "Brother Crush", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["taboo", "twinks"] },
  { src: "/site-banners/dad-creep-hero.jpg", siteSlug: "dadcreep", brandName: "Dad Creep", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["taboo", "daddy"] },
  { src: "/site-banners/family-dick-hero.jpg", siteSlug: "familydick", brandName: "Family Dick", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["taboo", "daddy"] },
  { src: "/site-banners/latin-leche-hero.jpg", siteSlug: "latinleche", brandName: "Latin Leche", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["latin"] },
  { src: "/site-banners/missionary-boys-hero.jpg", siteSlug: "missionaryboys", brandName: "Missionary Boys", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["taboo", "twinks"] },
  { src: "/site-banners/say-uncle-hero.jpg", siteSlug: "sayuncle", brandName: "Say Uncle", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["taboo", "daddy"] },
  { src: "/site-banners/yes-father-hero.jpg", siteSlug: "yesfather", brandName: "Yes Father", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["taboo", "daddy"] },
  { src: "/site-banners/young-perps-hero.jpg", siteSlug: "youngperps", brandName: "Young Perps", width: 900, height: 250, aspect: 3.6, aspectClass: "half-banner", qualityScore: 4, niches: ["taboo", "twinks"] },

  // === 970×250 half-banners (3.88:1) ===
  { src: "/site-banners/alternadudes-hero.jpg", siteSlug: "alternadudes", brandName: "AlternaDudes", width: 970, height: 250, aspect: 3.88, aspectClass: "half-banner", qualityScore: 3, niches: ["alternative", "amateur-twinks"] },
  { src: "/site-banners/swingin-balls-hero.jpg", siteSlug: "swinginballs", brandName: "Swingin Balls", width: 970, height: 250, aspect: 3.88, aspectClass: "half-banner", qualityScore: 3, niches: ["amateur-twinks"] },

  // === Mid-aspect half-banners (4.75–4.9) ===
  { src: "/site-banners/daddy-on-twink-hero.jpg", siteSlug: "daddy-on-twink", brandName: "Daddy on Twink", width: 950, height: 200, aspect: 4.75, aspectClass: "half-banner", qualityScore: 4, niches: ["daddy", "twinks"] },
  { src: "/site-banners/twinks-in-shorts-hero.jpg", siteSlug: "twinks-in-shorts", brandName: "Twinks in Shorts", width: 1200, height: 250, aspect: 4.8, aspectClass: "half-banner", qualityScore: 4, niches: ["twinks"] },
  { src: "/site-banners/japanboyz-hero.jpg", siteSlug: "japanboyz", brandName: "Japanboyz", width: 1323, height: 270, aspect: 4.9, aspectClass: "half-banner", qualityScore: 4, niches: ["asian"] },
  { src: "/site-banners/peterfever-hero.jpg", siteSlug: "peterfever", brandName: "PeterFever", width: 1323, height: 270, aspect: 4.9, aspectClass: "half-banner", qualityScore: 4, niches: ["asian"] },

  // === Leaderboard banners (5.76–6.67) ===
  { src: "/site-banners/boyfun-hero.jpg", siteSlug: "boyfun", brandName: "BoyFun", width: 980, height: 170, aspect: 5.76, aspectClass: "leaderboard", qualityScore: 3, niches: ["twinks", "european"] },
  { src: "/site-banners/bareback-cum-pigs-hero.jpg", siteSlug: "barebackcumpigs", brandName: "Bareback Cum Pigs", width: 984, height: 170, aspect: 5.79, aspectClass: "leaderboard", qualityScore: 3, niches: ["bareback"] },
  { src: "/site-banners/athletic-twinks-hero.jpg", siteSlug: "athletic-twinks", brandName: "Athletic Twinks", width: 900, height: 150, aspect: 6.0, aspectClass: "leaderboard", qualityScore: 3, niches: ["twinks", "jocks"] },
  { src: "/site-banners/bear-chubs-hero.jpg", siteSlug: "bearchubs", brandName: "Bear Chubs", width: 900, height: 150, aspect: 6.0, aspectClass: "leaderboard", qualityScore: 3, niches: ["bears", "chubs"] },
  { src: "/site-banners/touch-that-boy-hero.jpg", siteSlug: "touch-that-boy", brandName: "Touch That Boy", width: 900, height: 150, aspect: 6.0, aspectClass: "leaderboard", qualityScore: 3, niches: ["twinks", "amateur-twinks"] },
  { src: "/site-banners/rawhole-hero.jpg", siteSlug: "rawhole", brandName: "RawHole", width: 1600, height: 240, aspect: 6.67, aspectClass: "leaderboard", qualityScore: 4, niches: ["bareback"] },
  { src: "/site-banners/real-men-fuck-hero.jpg", siteSlug: "realmenfuck", brandName: "Real Men Fuck", width: 1000, height: 150, aspect: 6.67, aspectClass: "leaderboard", qualityScore: 3, niches: ["bareback", "amateur-twinks"] },
  { src: "/site-banners/squirt-studios-hero.jpg", siteSlug: "squirtstudios", brandName: "Squirt Studios", width: 2000, height: 300, aspect: 6.67, aspectClass: "leaderboard", qualityScore: 4, niches: ["amateur-twinks"] },

  // === Skyscraper (>8:1) — auto-hidden on mobile in component ===
  { src: "/site-banners/bully-him-hero.jpg", siteSlug: "bullyhim", brandName: "Bully Him", width: 970, height: 90, aspect: 10.78, aspectClass: "skyscraper", qualityScore: 2, niches: ["taboo"] },
  { src: "/site-banners/dirty-boy-video-hero.jpg", siteSlug: "dirtyboyvideo", brandName: "DirtyBoyVideo", width: 970, height: 90, aspect: 10.78, aspectClass: "skyscraper", qualityScore: 2, niches: ["amateur-twinks"] },
  { src: "/site-banners/twinktrade-hero.jpg", siteSlug: "twinktrade", brandName: "TwinkTrade", width: 970, height: 90, aspect: 10.78, aspectClass: "skyscraper", qualityScore: 2, niches: ["twinks", "taboo"] },
  { src: "/site-banners/yoshi-kawasaki-xxx-hero.jpg", siteSlug: "yoshikawasakixxx", brandName: "Yoshi Kawasaki XXX", width: 970, height: 90, aspect: 10.78, aspectClass: "skyscraper", qualityScore: 2, niches: ["asian"] },
  { src: "/site-banners/gay-asian-network-hero.jpg", siteSlug: "gayasiannetwork", brandName: "GayAsianNetwork", width: 1130, height: 69, aspect: 16.38, aspectClass: "skyscraper", qualityScore: 1, niches: ["asian"] },
  { src: "/site-banners/sexjapantv-hero.jpg", siteSlug: "sexjapantv", brandName: "SexJapanTV", width: 1130, height: 69, aspect: 16.38, aspectClass: "skyscraper", qualityScore: 1, niches: ["asian"] },
];

/** Banners eligible for placement (excludes skyscrapers from desktop pool too — too thin). */
export const placeableBanners = featuredBanners.filter((b) => b.aspectClass !== "skyscraper");

/**
 * Pick a banner for a given placement. Selection is deterministic by date
 * (so same visitor sees the same banner per day) and seeded per placement
 * so different surfaces don't repeat the same banner on the same day.
 */
export function pickBanner(opts: {
  placement: "homepage" | "reviews-index" | "best-deals" | "niche-category" | "compare";
  nicheSlug?: string;
  compareSlugs?: [string, string];
}): FeaturedBanner | null {
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
  const placementSeed = ["homepage", "reviews-index", "best-deals", "niche-category", "compare"].indexOf(opts.placement);
  const idx = (day + placementSeed * 7) % top.length;
  return top[idx];
}

/** Resolve the affiliate URL for a banner via sites.ts (single source of truth). */
export function getBannerAffiliateUrl(banner: FeaturedBanner): string | null {
  const site = getSiteBySlug(banner.siteSlug);
  return site?.affiliate_url ?? null;
}
