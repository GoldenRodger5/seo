/**
 * Slug → niches mapping. Kept separate from sites.ts to avoid bloating that
 * file. If a site isn't listed, it has no assigned niches yet (defaults to []).
 */
export const siteNicheMap: Record<string, string[]> = {
  // Premium twink studios
  "helix-studios": ["twink", "college", "smooth", "amateur"],
  "next-door-twink": ["twink", "amateur", "college", "str8-curious"],
  "next-door-world": ["twink", "amateur", "interracial", "college"],
  "twinks-in-shorts": ["twink", "smooth", "amateur"],
  "athletic-twinks": ["twink", "jock", "college", "smooth"],
  "southern-strokes": ["twink", "amateur", "smooth", "bareback"],
  "daddy-on-twink": ["daddy", "twink", "bareback"],
  "touch-that-boy": ["twink", "amateur", "smooth", "bareback"],
  "breed-me-raw": ["bareback", "twink", "amateur", "group"],
  "bareback-that-hole": ["bareback", "twink", "group", "amateur"],
  "hard-brit-lads": ["amateur", "uncut", "twink", "jock"],
  "prideflame": ["twink", "amateur", "bareback"],

  // Crossover/network
  "rawhole": ["bareback", "twink", "amateur", "group"],
  "peterfever": ["asian", "muscle", "jock", "bareback"],
  "gayasiannetwork": ["asian", "twink", "amateur", "bareback"],
  "alternadudes": ["amateur", "hairy", "fetish", "bareback"],
  "dirtyboyvideo": ["amateur", "bareback", "twink", "fetish"],
  "dudesraw": ["bareback", "amateur", "muscle", "interracial"],
  "nakedsword": ["twink", "muscle", "bareback", "group"],
  "trailertrashboys": ["amateur", "str8-curious", "bareback", "twink"],

  // zBuckz Asian + niche networks
  "japanboyz": ["japanese", "asian", "twink", "bareback"],
  "sexjapantv": ["japanese", "asian", "amateur", "twink"],
  "hiroyaxxx": ["japanese", "asian", "muscle", "amateur"],
  "yoshikawasakixxx": ["japanese", "asian", "muscle", "bareback"],
  "wuboyz": ["asian", "twink", "amateur", "smooth"],
  "barebackrtxxx": ["bareback", "amateur", "twink", "group"],
  "cumpigmen": ["bareback", "group", "fetish", "amateur"],
  "realmenfuck": ["amateur", "muscle", "bareback", "str8-curious"],
  "swinginballs": ["amateur", "big-dick", "bareback", "solo"],
  "squirtstudios": ["amateur", "twink", "bareback", "solo"],
  "aussiesdoit": ["amateur", "twink", "bareback", "uncut"],

  // ChargedCash family/taboo + auth roleplay
  "twinktrade": ["twink", "str8-curious", "bareback", "smooth"],
  "dadcreep": ["daddy", "twink", "str8-curious", "bareback"],
  "brothercrush": ["twink", "str8-curious", "bareback", "smooth"],
  "familydick": ["daddy", "twink", "str8-curious", "bareback"],
  "sayuncle": ["daddy", "twink", "bareback", "str8-curious"],
  "boysatcamp": ["twink", "amateur", "str8-curious", "smooth"],
  "missionaryboys": ["twink", "str8-curious", "smooth", "bareback"],
  "militarydick": ["military", "muscle", "str8-curious", "bareback"],
  "latinleche": ["latin", "twink", "amateur", "str8-curious"],
  "yesfather": ["daddy", "twink", "str8-curious", "bareback"],
  "bullyhim": ["twink", "str8-curious", "jock", "bareback"],
  "youngperps": ["twink", "str8-curious", "amateur", "bareback"],

  // Bears
  "barebackcumpigs": ["bareback", "bear", "group", "fetish"],
  "bearchubs": ["bear", "hairy", "amateur"],
  "bearfilms": ["bear", "daddy", "hairy", "bareback"],
  "hairyandraw": ["hairy", "bear", "bareback", "amateur"],

  // XXXRewards
  "boyfun": ["twink", "smooth", "bareback", "amateur"],
  "jawked": ["jock", "college", "amateur", "smooth"],

  // AdultForce additions
  "men": ["twink", "muscle", "bareback", "group"],
  "sean-cody": ["jock", "muscle", "bareback", "amateur"],
  "icon-male": ["daddy", "muscle", "bareback"],
  "gaywire": ["amateur", "bareback", "twink"],
  "biempire": ["group", "fetish"],
  "twinkpop": ["twink", "smooth", "bareback", "amateur"],
  "reality-dudes": ["str8-curious", "amateur", "twink", "bareback"],
  "bigstr": ["str8-curious", "amateur", "bareback"],
  "black-male-me": ["interracial", "muscle", "bareback"],
  "noirmale": ["interracial", "muscle", "bareback"],
  "guy-selector": ["amateur"],
  "spicevidsgay": ["twink", "muscle", "bareback", "amateur", "group"],
  "maleaccess": ["twink", "muscle", "bareback", "amateur"],
};

export const getSiteNiches = (slug: string): string[] =>
  siteNicheMap[slug] ?? [];

export const getSitesByNiche = (
  nicheSlug: string,
  allSiteSlugs: string[]
): string[] =>
  allSiteSlugs.filter((slug) => getSiteNiches(slug).includes(nicheSlug));
