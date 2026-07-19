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
  "helix-studios": { hero_image_url: null, thumbnail_url: null, banner_alt: "Helix Studios — twink gay porn site banner" },
  "next-door-twink": { hero_image_url: null, thumbnail_url: null, banner_alt: "Next Door Twink — twink gay porn site banner" },
  "next-door-world": { hero_image_url: null, thumbnail_url: null, banner_alt: "Next Door World — twink gay porn site banner" },
  "twinks-in-shorts": { hero_image_url: "/site-banners/twinks-in-shorts-hero.jpg", thumbnail_url: null, banner_alt: "Twinks in Shorts — twink gay porn site banner" },
  "athletic-twinks": { hero_image_url: "/site-banners/athletic-twinks-hero.jpg", thumbnail_url: "/site-banners/athletic-twinks-card.jpg", banner_alt: "Athletic Twinks — twink gay porn site banner" },
  "southern-strokes": { hero_image_url: "/site-banners/southern-strokes-hero.jpg", thumbnail_url: null, banner_alt: "Southern Strokes — twink gay porn site banner" },
  "daddy-on-twink": { hero_image_url: "/site-banners/daddy-on-twink-hero.jpg", thumbnail_url: null, banner_alt: "Daddy on Twink — daddy gay porn site banner" },
  "touch-that-boy": { hero_image_url: "/site-banners/touch-that-boy-hero.jpg", thumbnail_url: null, banner_alt: "Touch That Boy — twink gay porn site banner" },
  "breed-me-raw": { hero_image_url: "/site-banners/breed-me-raw-hero.jpg", thumbnail_url: "/site-banners/breed-me-raw-card.jpg", banner_alt: "Breed Me Raw — bareback gay porn site banner" },
  "bareback-that-hole": { hero_image_url: "/site-banners/bareback-that-hole-hero.jpg", thumbnail_url: "/site-banners/bareback-that-hole-card.jpg", banner_alt: "Bareback That Hole — bareback gay porn site banner" },
  "hard-brit-lads": { hero_image_url: "/site-banners/hard-brit-lads-hero.jpg", thumbnail_url: "/site-banners/hard-brit-lads-card.jpg", banner_alt: "Hard Brit Lads — amateur gay porn site banner" },
  "prideflame": { hero_image_url: null, thumbnail_url: null, banner_alt: "Prideflame — twink gay porn site banner" },

  // Crossover / network
  "rawhole": { hero_image_url: "/site-banners/rawhole-hero.jpg", thumbnail_url: null, banner_alt: "RawHole — bareback gay porn site banner" },
  "peterfever": { hero_image_url: "/site-banners/peterfever-hero.jpg", thumbnail_url: null, banner_alt: "PeterFever — asian gay porn site banner" },
  "gayasiannetwork": { hero_image_url: "/site-banners/gay-asian-network-hero.jpg", thumbnail_url: null, banner_alt: "GayAsianNetwork — asian gay porn site banner" },
  "alternadudes": { hero_image_url: "/site-banners/alternadudes-hero.jpg", thumbnail_url: null, banner_alt: "AlternaDudes — amateur gay porn site banner" },
  "dirtyboyvideo": { hero_image_url: "/site-banners/dirty-boy-video-hero.jpg", thumbnail_url: null, banner_alt: "DirtyBoyVideo — amateur gay porn site banner" },
  "dudesraw": { hero_image_url: "/site-banners/dudesraw-hero.jpg", thumbnail_url: null, banner_alt: "DudesRaw — bareback gay porn site banner" },
  "nakedsword": { hero_image_url: "/site-banners/nakedsword-hero.jpg", thumbnail_url: null, banner_alt: "NakedSword — twink gay porn site banner" },
  "trailertrashboys": { hero_image_url: "/site-banners/trailer-trash-boys-hero.jpg", thumbnail_url: "/site-banners/trailertrashboys-card.jpg", banner_alt: "TrailerTrashBoys — amateur gay porn site banner" },

  // zBuckz
  "japanboyz": { hero_image_url: "/site-banners/japanboyz-hero.jpg", thumbnail_url: null, banner_alt: "Japanboyz — japanese gay porn site banner" },
  "sexjapantv": { hero_image_url: "/site-banners/sexjapantv-hero.jpg", thumbnail_url: null, banner_alt: "SexJapanTV — japanese gay porn site banner" },
  "hiroyaxxx": { hero_image_url: "/site-banners/hiroyaxxx-hero.jpg", thumbnail_url: null, banner_alt: "HiroyaXXX — japanese gay porn site banner" },
  "yoshikawasakixxx": { hero_image_url: "/site-banners/yoshi-kawasaki-xxx-hero.jpg", thumbnail_url: "/site-banners/yoshikawasakixxx-card.jpg", banner_alt: "Yoshi Kawasaki XXX — japanese gay porn site banner" },
  "wuboyz": { hero_image_url: "/site-banners/wuboyz-hero.jpg", thumbnail_url: null, banner_alt: "WuBoyz — asian gay porn site banner" },
  "barebackrtxxx": { hero_image_url: "/site-banners/barebackrtxxx-hero.jpg", thumbnail_url: null, banner_alt: "Bareback RT XXX — bareback gay porn site banner" },
  "cumpigmen": { hero_image_url: "/site-banners/cumpigmen-hero.jpg", thumbnail_url: null, banner_alt: "Cum Pig Men — bareback gay porn site banner" },
  "realmenfuck": { hero_image_url: "/site-banners/real-men-fuck-hero.jpg", thumbnail_url: null, banner_alt: "Real Men Fuck — amateur gay porn site banner" },
  "swinginballs": { hero_image_url: "/site-banners/swingin-balls-hero.jpg", thumbnail_url: null, banner_alt: "Swingin Balls — amateur gay porn site banner" },
  "squirtstudios": { hero_image_url: "/site-banners/squirt-studios-hero.jpg", thumbnail_url: null, banner_alt: "Squirt Studios — amateur gay porn site banner" },
  "aussiesdoit": { hero_image_url: "/site-banners/aussiesdoit-hero.jpg", thumbnail_url: "/site-banners/aussiesdoit-card.jpg", banner_alt: "Aussies Do It — amateur gay porn site banner" },

  // ChargedCash
  "twinktrade": { hero_image_url: "/site-banners/twinktrade-hero.jpg", thumbnail_url: "/site-banners/twinktrade-card.jpg", banner_alt: "TwinkTrade — twink gay porn site banner" },
  "dadcreep": { hero_image_url: "/site-banners/dad-creep-hero.jpg", thumbnail_url: null, banner_alt: "Dad Creep — daddy gay porn site banner" },
  "brothercrush": { hero_image_url: "/site-banners/brother-crush-hero.jpg", thumbnail_url: "/site-banners/brothercrush-card.jpg", banner_alt: "Brother Crush — twink gay porn site banner" },
  "familydick": { hero_image_url: "/site-banners/family-dick-hero.jpg", thumbnail_url: "/site-banners/familydick-card.jpg", banner_alt: "Family Dick — daddy gay porn site banner" },
  "sayuncle": { hero_image_url: "/site-banners/say-uncle-hero.jpg", thumbnail_url: null, banner_alt: "Say Uncle — daddy gay porn site banner" },
  "boysatcamp": { hero_image_url: "/site-banners/boys-at-camp-hero.jpg", thumbnail_url: "/site-banners/boysatcamp-card.jpg", banner_alt: "Boys at Camp — twink gay porn site banner" },
  "missionaryboys": { hero_image_url: "/site-banners/missionary-boys-hero.jpg", thumbnail_url: "/site-banners/missionaryboys-card.jpg", banner_alt: "Missionary Boys — twink gay porn site banner" },
  "militarydick": { hero_image_url: "/site-banners/military-dick-hero.jpg", thumbnail_url: null, banner_alt: "Military Dick — military gay porn site banner" },
  "latinleche": { hero_image_url: "/site-banners/latin-leche-hero.jpg", thumbnail_url: "/site-banners/latinleche-card.jpg", banner_alt: "Latin Leche — latin gay porn site banner" },
  "yesfather": { hero_image_url: "/site-banners/yes-father-hero.jpg", thumbnail_url: "/site-banners/yesfather-card.jpg", banner_alt: "Yes Father — daddy gay porn site banner" },
  "bullyhim": { hero_image_url: "/site-banners/bully-him-hero.jpg", thumbnail_url: null, banner_alt: "Bully Him — twink gay porn site banner" },
  "youngperps": { hero_image_url: "/site-banners/young-perps-hero.jpg", thumbnail_url: "/site-banners/youngperps-card.jpg", banner_alt: "Young Perps — twink gay porn site banner" },

  // Bears
  "barebackcumpigs": { hero_image_url: "/site-banners/bareback-cum-pigs-hero.jpg", thumbnail_url: null, banner_alt: "Bareback Cum Pigs — bareback gay porn site banner" },
  "bearchubs": { hero_image_url: "/site-banners/bear-chubs-hero.jpg", thumbnail_url: "/site-banners/bearchubs-card.jpg", banner_alt: "Bear Chubs — bear gay porn site banner" },
  "bearfilms": { hero_image_url: "/site-banners/bear-films-hero.jpg", thumbnail_url: "/site-banners/bearfilms-card.jpg", banner_alt: "Bear Films — bear gay porn site banner" },
  "hairyandraw": { hero_image_url: "/site-banners/hairy-and-raw-hero.jpg", thumbnail_url: "/site-banners/hairyandraw-card.jpg", banner_alt: "Hairy and Raw — hairy gay porn site banner" },

  // XXXRewards
  "boyfun": { hero_image_url: "/site-banners/boyfun-hero.jpg", thumbnail_url: null, banner_alt: "BoyFun — twink gay porn site banner" },
  "jawked": { hero_image_url: "/site-banners/jawked-hero.gif", thumbnail_url: "/site-banners/jawked-card.jpg", banner_alt: "Jawked — jock gay porn site banner" },
  "attilapictures": { hero_image_url: "/site-banners/attilapictures-hero.jpg", thumbnail_url: "/site-banners/attilapictures-card.jpg", banner_alt: "Attila Pictures — gay porn site banner" },
  "axelabysse": { hero_image_url: "/site-banners/axelabysse-hero.jpg", thumbnail_url: "/site-banners/axelabysse-card.jpg", banner_alt: "Axel Abysse — gay porn site banner" },
  "blackgodz": { hero_image_url: null, thumbnail_url: "/site-banners/blackgodz-card.jpg", banner_alt: "Black Godz — gay porn site banner" },
  "damondoggxxx": { hero_image_url: "/site-banners/damondoggxxx-hero.jpg", thumbnail_url: null, banner_alt: "Damon Dogg XXX — gay porn site banner" },
  "dickbank": { hero_image_url: "/site-banners/dickbank-hero.jpg", thumbnail_url: "/site-banners/dickbank-card.jpg", banner_alt: "Dickbank — gay porn site banner" },
  "doctortapes": { hero_image_url: null, thumbnail_url: "/site-banners/doctortapes-card.jpg", banner_alt: "DoctorTapes — gay porn site banner" },
  "frocktheworld": { hero_image_url: "/site-banners/frocktheworld-hero.jpg", thumbnail_url: null, banner_alt: "FrockTheWorld — gay porn site banner" },
  "straightboysfucking": { hero_image_url: "/site-banners/straightboysfucking-hero.jpg", thumbnail_url: "/site-banners/straightboysfucking-card.jpg", banner_alt: "StraightBoysFucking — gay porn site banner" },
  "tla-gay-unlimited": { hero_image_url: "/site-banners/tla-gay-unlimited-hero.jpg", thumbnail_url: null, banner_alt: "TLA Gay Unlimited — gay porn site banner" },
  "retromales": { hero_image_url: "/site-banners/retromales-hero.jpg", thumbnail_url: null, banner_alt: "Retromales — gay porn site banner" },
  "pitsandpubes": { hero_image_url: "/site-banners/pitsandpubes-hero.jpg", thumbnail_url: null, banner_alt: "Pitsandpubes — gay porn site banner" },
};

const EMPTY_IMAGERY: SiteImagery = {
  hero_image_url: null,
  thumbnail_url: null,
  banner_alt: "",
};

export const getSiteImagery = (slug: string): SiteImagery =>
  siteImagery[slug] ?? EMPTY_IMAGERY;

/**
 * Card-safe image resolver. Card slots (3:2 / 16:10) must NEVER fall back to
 * strip-shaped heroes — a 1200x250 leaderboard center-cropped into a card
 * renders as a random zoomed body part (caught on /top-sites, 2026-07-19
 * visual validation). Sites whose only hero is a strip render the branded
 * placeholder instead.
 */
const STRIP_HERO_SLUGS = new Set([
  "twinks-in-shorts", "athletic-twinks", "daddy-on-twink", "touch-that-boy",
  "dadcreep", "sayuncle", "barebackcumpigs", "bullyhim", "militarydick",
  "squirtstudios", "bearfilms", "breed-me-raw", "bareback-that-hole",
  "hard-brit-lads", "boysatcamp", "twinktrade", "bearchubs", "hairyandraw",
  "trailertrashboys",
]);

export function getCardImage(slug: string): string | null {
  const im = getSiteImagery(slug);
  if (im.thumbnail_url) return im.thumbnail_url;
  if (im.hero_image_url && !STRIP_HERO_SLUGS.has(slug)) return im.hero_image_url;
  return null;
}
