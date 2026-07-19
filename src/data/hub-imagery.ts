/**
 * Hub-page hero art — one best image per category/niche, allocated from the
 * hub's own top-ranked member sites with a GLOBAL no-duplicates guarantee
 * (an image used by one hub is never reused by another). Regenerate via the
 * allocation script in the 2026-07-19 image-wiring session when imagery
 * changes materially.
 */
export interface HubImage { image: string; alt: string; from: string }

export const CATEGORY_IMAGERY: Record<string, HubImage> = {
  "amateur-twinks": {
    "image": "/site-banners/aussiesdoit-hero.jpg",
    "alt": "Aussies Do It — amateur gay porn site banner",
    "from": "Aussies Do It"
  },
  "premium-studios": {
    "image": "/site-banners/yoshi-kawasaki-xxx-hero.jpg",
    "alt": "Yoshi Kawasaki XXX — japanese gay porn site banner",
    "from": "Yoshi Kawasaki XXX"
  },
  "best-value": {
    "image": "/site-banners/nakedsword-hero.jpg",
    "alt": "NakedSword — twink gay porn site banner",
    "from": "NakedSword"
  },
  "hd-quality": {
    "image": "/site-banners/boyfun-hero.jpg",
    "alt": "BoyFun — twink gay porn site banner",
    "from": "BoyFun"
  },
  "mobile-friendly": {
    "image": "/site-banners/dudesraw-hero.jpg",
    "alt": "DudesRaw — bareback gay porn site banner",
    "from": "DudesRaw"
  }
};

export const NICHE_IMAGERY: Record<string, HubImage> = {
  "twink": {
    "image": "/site-banners/wuboyz-hero.jpg",
    "alt": "WuBoyz — asian gay porn site banner",
    "from": "WuBoyz"
  },
  "bareback": {
    "image": "/site-banners/southern-strokes-hero.jpg",
    "alt": "Southern Strokes — twink gay porn site banner",
    "from": "Southern Strokes"
  },
  "daddy": {
    "image": "/site-banners/family-dick-hero.jpg",
    "alt": "Family Dick — daddy gay porn site banner",
    "from": "Family Dick"
  },
  "asian": {
    "image": "/site-banners/gay-asian-network-hero.jpg",
    "alt": "GayAsianNetwork — asian gay porn site banner",
    "from": "GayAsianNetwork"
  },
  "latin": {
    "image": "/site-banners/latin-leche-hero.jpg",
    "alt": "Latin Leche — latin gay porn site banner",
    "from": "Latin Leche"
  },
  "amateur": {
    "image": "/site-banners/jawked-hero.gif",
    "alt": "Jawked — jock gay porn site banner",
    "from": "Jawked"
  },
  "muscle": {
    "image": "/site-banners/hiroyaxxx-hero.jpg",
    "alt": "HiroyaXXX — japanese gay porn site banner",
    "from": "HiroyaXXX"
  }
};
