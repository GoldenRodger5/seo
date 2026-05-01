/**
 * Per-site imagery sourced from each affiliate program's official creative
 * library. Use only assets whose use rights are explicitly granted by the
 * affiliate dashboard — never scrape from member areas. Alt tags must stay
 * SFW (Google penalises graphic adult alt copy).
 *
 * `null` is the default for sites without sourced creative; SiteCard and
 * ReviewPage gracefully fall back to the brand-color watermark when imagery
 * is absent, so adding entries here is purely additive.
 *
 * Sourcing notes per network:
 *   • zBuckz       → Dashboard → Marketing Tools → Banners
 *   • MyGayCash    → Dashboard → Promotional Materials
 *   • ChargedCash  → Dashboard → Banners
 *   • NakedSword   → Dashboard → Creative Center
 *   • CrakRevenue  → Smartlink Creative Library (already approved)
 *   • XXXRewards   → Dashboard → Banner Library
 *   • Buddy Profits/Gamma → Marketing → Tools (post-KYC)
 *   • AdultForce   → Dashboard → Creative (post-approval)
 */

export interface SiteImagery {
  /** Wide hero banner (16:9 ideal). Used on review-page banner + featured cards. */
  hero_image_url: string | null;
  /** Square or 4:3 thumbnail used on standard SiteCard. */
  thumbnail_url: string | null;
  /** SFW alt text — descriptive of brand identity, not content. */
  banner_alt: string;
}

// Initial map: every existing site slug starts with nulls. Populate by
// downloading sanctioned creative from the linked dashboard, dropping it
// in /public/site-banners/, and pasting the path here.
export const siteImagery: Record<string, SiteImagery> = {
  // Premium twink studios
  "helix-studios": { hero_image_url: null, thumbnail_url: null, banner_alt: "Helix Studios promotional banner" },
  "next-door-twink": { hero_image_url: null, thumbnail_url: null, banner_alt: "Next Door Twink promotional banner" },
  "next-door-world": { hero_image_url: null, thumbnail_url: null, banner_alt: "Next Door World promotional banner" },
  "twinks-in-shorts": { hero_image_url: null, thumbnail_url: null, banner_alt: "Twinks in Shorts promotional banner" },
  "athletic-twinks": { hero_image_url: null, thumbnail_url: null, banner_alt: "Athletic Twinks promotional banner" },
  "southern-strokes": { hero_image_url: null, thumbnail_url: null, banner_alt: "Southern Strokes promotional banner" },
  "daddy-on-twink": { hero_image_url: null, thumbnail_url: null, banner_alt: "Daddy on Twink promotional banner" },
  "touch-that-boy": { hero_image_url: null, thumbnail_url: null, banner_alt: "Touch That Boy promotional banner" },
  "breed-me-raw": { hero_image_url: null, thumbnail_url: null, banner_alt: "Breed Me Raw promotional banner" },
  "bareback-that-hole": { hero_image_url: null, thumbnail_url: null, banner_alt: "Bareback That Hole promotional banner" },
  "hard-brit-lads": { hero_image_url: null, thumbnail_url: null, banner_alt: "Hard Brit Lads promotional banner" },
  "prideflame": { hero_image_url: null, thumbnail_url: null, banner_alt: "Prideflame promotional banner" },

  // Crossover / network
  "rawhole": { hero_image_url: null, thumbnail_url: null, banner_alt: "RawHole promotional banner" },
  "peterfever": { hero_image_url: null, thumbnail_url: null, banner_alt: "PeterFever promotional banner" },
  "gayasiannetwork": { hero_image_url: null, thumbnail_url: null, banner_alt: "GayAsianNetwork promotional banner" },
  "alternadudes": { hero_image_url: null, thumbnail_url: null, banner_alt: "AlternaDudes promotional banner" },
  "dirtyboyvideo": { hero_image_url: null, thumbnail_url: null, banner_alt: "DirtyBoyVideo promotional banner" },
  "dudesraw": { hero_image_url: null, thumbnail_url: null, banner_alt: "DudesRaw promotional banner" },
  "nakedsword": { hero_image_url: null, thumbnail_url: null, banner_alt: "NakedSword promotional banner" },
  "trailertrashboys": { hero_image_url: null, thumbnail_url: null, banner_alt: "TrailerTrashBoys promotional banner" },

  // zBuckz
  "japanboyz": { hero_image_url: null, thumbnail_url: null, banner_alt: "Japanboyz promotional banner" },
  "sexjapantv": { hero_image_url: null, thumbnail_url: null, banner_alt: "SexJapanTV promotional banner" },
  "hiroyaxxx": { hero_image_url: null, thumbnail_url: null, banner_alt: "HiroyaXXX promotional banner" },
  "yoshikawasakixxx": { hero_image_url: null, thumbnail_url: null, banner_alt: "Yoshi Kawasaki XXX promotional banner" },
  "wuboyz": { hero_image_url: null, thumbnail_url: null, banner_alt: "WuBoyz promotional banner" },
  "barebackrtxxx": { hero_image_url: null, thumbnail_url: null, banner_alt: "Bareback RT XXX promotional banner" },
  "cumpigmen": { hero_image_url: null, thumbnail_url: null, banner_alt: "Cum Pig Men promotional banner" },
  "realmenfuck": { hero_image_url: null, thumbnail_url: null, banner_alt: "Real Men Fuck promotional banner" },
  "swinginballs": { hero_image_url: null, thumbnail_url: null, banner_alt: "Swingin Balls promotional banner" },
  "squirtstudios": { hero_image_url: null, thumbnail_url: null, banner_alt: "Squirt Studios promotional banner" },
  "aussiesdoit": { hero_image_url: null, thumbnail_url: null, banner_alt: "Aussies Do It promotional banner" },

  // ChargedCash
  "twinktrade": { hero_image_url: null, thumbnail_url: null, banner_alt: "Twink Trade promotional banner" },
  "dadcreep": { hero_image_url: null, thumbnail_url: null, banner_alt: "Dad Creep promotional banner" },
  "brothercrush": { hero_image_url: null, thumbnail_url: null, banner_alt: "Brother Crush promotional banner" },
  "familydick": { hero_image_url: null, thumbnail_url: null, banner_alt: "Family Dick promotional banner" },
  "sayuncle": { hero_image_url: null, thumbnail_url: null, banner_alt: "Say Uncle promotional banner" },
  "boysatcamp": { hero_image_url: null, thumbnail_url: null, banner_alt: "Boys at Camp promotional banner" },
  "missionaryboys": { hero_image_url: null, thumbnail_url: null, banner_alt: "Missionary Boys promotional banner" },
  "militarydick": { hero_image_url: null, thumbnail_url: null, banner_alt: "Military Dick promotional banner" },
  "latinleche": { hero_image_url: null, thumbnail_url: null, banner_alt: "Latin Leche promotional banner" },
  "yesfather": { hero_image_url: null, thumbnail_url: null, banner_alt: "Yes Father promotional banner" },
  "bullyhim": { hero_image_url: null, thumbnail_url: null, banner_alt: "Bully Him promotional banner" },
  "youngperps": { hero_image_url: null, thumbnail_url: null, banner_alt: "Young Perps promotional banner" },

  // Bears
  "barebackcumpigs": { hero_image_url: null, thumbnail_url: null, banner_alt: "Bareback Cum Pigs promotional banner" },
  "bearchubs": { hero_image_url: null, thumbnail_url: null, banner_alt: "Bear Chubs promotional banner" },
  "bearfilms": { hero_image_url: null, thumbnail_url: null, banner_alt: "Bear Films promotional banner" },
  "hairyandraw": { hero_image_url: null, thumbnail_url: null, banner_alt: "Hairy and Raw promotional banner" },

  // XXXRewards
  "boyfun": { hero_image_url: null, thumbnail_url: null, banner_alt: "BoyFun promotional banner" },
  "jawked": { hero_image_url: null, thumbnail_url: null, banner_alt: "Jawked promotional banner" },
};

const EMPTY_IMAGERY: SiteImagery = {
  hero_image_url: null,
  thumbnail_url: null,
  banner_alt: "",
};

export const getSiteImagery = (slug: string): SiteImagery =>
  siteImagery[slug] ?? EMPTY_IMAGERY;
