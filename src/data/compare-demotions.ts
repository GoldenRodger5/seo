/**
 * Staged demotion of marginal featured compare pairs (FIX 7 of the engine
 * redesign, owner-approved 2026-07-08).
 *
 * Each entry 301s to its most-relevant review (affiliated side preferred,
 * else higher overall score) and leaves the featured set, which removes it
 * from the sitemap + prerender and flips the rendered page to noindex — the
 * moment its tranche is activated.
 *
 * ROLLOUT: activate ONE tranche per week (flip `active: true`), then run
 *   npm run compare-redirects   (regenerates vercel.json's redirect block)
 * and commit both files. Never activate multiple tranches at once — the
 * staged pace is deliberate (no mass-deletion velocity spike). Watch GSC for
 * a week between tranches; spare any pair that shows real impressions by
 * moving it out of its tranche.
 *
 * Kept OUT of this list permanently: the 19 both-top-20 pairs and every pair
 * with an AI editorial body.
 *
 * GENERATED from live scoring — do not hand-edit pair/dest values; re-derive
 * if sites.ts scoring changes materially.
 */

export interface CompareDemotion {
  pair: string;
  dest: string;
}

export interface DemotionTranche {
  tranche: number;
  active: boolean;
  pairs: CompareDemotion[];
}

export const DEMOTION_TRANCHES: DemotionTranche[] = [
  {
    tranche: 1,
    active: true,
    pairs: [
      { pair: "bigstr-vs-black-male-me", dest: "/reviews/black-male-me" },
      { pair: "bareback-that-hole-vs-bigstr", dest: "/reviews/bareback-that-hole" },
      { pair: "barebackcumpigs-vs-bigstr", dest: "/reviews/barebackcumpigs" },
      { pair: "barebackrtxxx-vs-bigstr", dest: "/reviews/barebackrtxxx" },
      { pair: "bearchubs-vs-bigstr", dest: "/reviews/bearchubs" },
      { pair: "bigstr-vs-gaywire", dest: "/reviews/gaywire" },
      { pair: "bigstr-vs-swinginballs", dest: "/reviews/swinginballs" },
      { pair: "bigstr-vs-breed-me-raw", dest: "/reviews/breed-me-raw" },
      { pair: "bigstr-vs-bullyhim", dest: "/reviews/bullyhim" },
      { pair: "bigstr-vs-cumpigmen", dest: "/reviews/cumpigmen" },
      { pair: "bigstr-vs-dirtyboyvideo", dest: "/reviews/dirtyboyvideo" },
      { pair: "bigstr-vs-dudesraw", dest: "/reviews/dudesraw" },
      { pair: "bigstr-vs-hairyandraw", dest: "/reviews/hairyandraw" },
      { pair: "bigstr-vs-hard-brit-lads", dest: "/reviews/hard-brit-lads" },
      { pair: "bigstr-vs-hiroyaxxx", dest: "/reviews/hiroyaxxx" },
      { pair: "bigstr-vs-jawked", dest: "/reviews/jawked" },
      { pair: "bigstr-vs-reality-dudes", dest: "/reviews/reality-dudes" },
      { pair: "bigstr-vs-squirtstudios", dest: "/reviews/squirtstudios" },
      { pair: "aussiesdoit-vs-bigstr", dest: "/reviews/aussiesdoit" },
      { pair: "bearfilms-vs-bigstr", dest: "/reviews/bearfilms" },
      { pair: "bigstr-vs-boysatcamp", dest: "/reviews/boysatcamp" },
      { pair: "bigstr-vs-dadcreep", dest: "/reviews/dadcreep" },
      { pair: "bigstr-vs-icon-male", dest: "/reviews/icon-male" },
      { pair: "bigstr-vs-militarydick", dest: "/reviews/militarydick" },
      { pair: "bigstr-vs-rawhole", dest: "/reviews/rawhole" },
      { pair: "bigstr-vs-realmenfuck", dest: "/reviews/realmenfuck" },
      { pair: "bigstr-vs-sexjapantv", dest: "/reviews/sexjapantv" },
    ],
  },
  {
    tranche: 2,
    active: true,
    pairs: [
      { pair: "bigstr-vs-touch-that-boy", dest: "/reviews/touch-that-boy" },
      { pair: "bigstr-vs-trailertrashboys", dest: "/reviews/trailertrashboys" },
      { pair: "bigstr-vs-yesfather", dest: "/reviews/yesfather" },
      { pair: "bigstr-vs-youngperps", dest: "/reviews/youngperps" },
      { pair: "alternadudes-vs-bigstr", dest: "/reviews/alternadudes" },
      { pair: "bigstr-vs-boyfun", dest: "/reviews/boyfun" },
      { pair: "bigstr-vs-brothercrush", dest: "/reviews/brothercrush" },
      { pair: "bigstr-vs-daddy-on-twink", dest: "/reviews/daddy-on-twink" },
      { pair: "bigstr-vs-japanboyz", dest: "/reviews/japanboyz" },
      { pair: "bigstr-vs-latinleche", dest: "/reviews/latinleche" },
      { pair: "bigstr-vs-missionaryboys", dest: "/reviews/missionaryboys" },
      { pair: "bigstr-vs-noirmale", dest: "/reviews/noirmale" },
      { pair: "bigstr-vs-southern-strokes", dest: "/reviews/southern-strokes" },
      { pair: "bigstr-vs-twinktrade", dest: "/reviews/twinktrade" },
      { pair: "bigstr-vs-familydick", dest: "/reviews/familydick" },
      { pair: "bigstr-vs-gayasiannetwork", dest: "/reviews/gayasiannetwork" },
      { pair: "bigstr-vs-twinkpop", dest: "/reviews/twinkpop" },
      { pair: "bigstr-vs-yoshikawasakixxx", dest: "/reviews/yoshikawasakixxx" },
      { pair: "black-male-me-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "prideflame-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "bareback-that-hole-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "barebackcumpigs-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "barebackrtxxx-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "bearchubs-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "bigstr-vs-peterfever", dest: "/reviews/peterfever" },
      { pair: "bigstr-vs-sayuncle", dest: "/reviews/sayuncle" },
      { pair: "black-male-me-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "gaywire-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "maleaccess-vs-prideflame", dest: "/reviews/maleaccess" },
    ],
  },
  {
    tranche: 3,
    active: true,
    pairs: [
      { pair: "spicevidsgay-vs-swinginballs", dest: "/reviews/spicevidsgay" },
      { pair: "bareback-that-hole-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "barebackcumpigs-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "barebackrtxxx-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "bearchubs-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "bigstr-vs-men", dest: "/reviews/men" },
      { pair: "bigstr-vs-sean-cody", dest: "/reviews/sean-cody" },
      { pair: "breed-me-raw-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "bullyhim-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "cumpigmen-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "dirtyboyvideo-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "dudesraw-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "gaywire-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "hairyandraw-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "hard-brit-lads-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "hiroyaxxx-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "jawked-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "maleaccess-vs-swinginballs", dest: "/reviews/maleaccess" },
      { pair: "reality-dudes-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "spicevidsgay-vs-squirtstudios", dest: "/reviews/spicevidsgay" },
      { pair: "spicevidsgay-vs-wuboyz", dest: "/reviews/spicevidsgay" },
      { pair: "aussiesdoit-vs-spicevidsgay", dest: "/reviews/aussiesdoit" },
      { pair: "bearfilms-vs-spicevidsgay", dest: "/reviews/bearfilms" },
      { pair: "boysatcamp-vs-spicevidsgay", dest: "/reviews/boysatcamp" },
      { pair: "breed-me-raw-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "bullyhim-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "cumpigmen-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "dadcreep-vs-spicevidsgay", dest: "/reviews/dadcreep" },
      { pair: "dirtyboyvideo-vs-maleaccess", dest: "/reviews/maleaccess" },
    ],
  },
  {
    tranche: 4,
    active: true,
    pairs: [
      { pair: "dudesraw-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "hairyandraw-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "hard-brit-lads-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "hiroyaxxx-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "icon-male-vs-spicevidsgay", dest: "/reviews/icon-male" },
      { pair: "jawked-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-squirtstudios", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-wuboyz", dest: "/reviews/maleaccess" },
      { pair: "militarydick-vs-spicevidsgay", dest: "/reviews/militarydick" },
      { pair: "rawhole-vs-spicevidsgay", dest: "/reviews/rawhole" },
      { pair: "realmenfuck-vs-spicevidsgay", dest: "/reviews/realmenfuck" },
      { pair: "sexjapantv-vs-spicevidsgay", dest: "/reviews/sexjapantv" },
      { pair: "spicevidsgay-vs-touch-that-boy", dest: "/reviews/spicevidsgay" },
      { pair: "spicevidsgay-vs-trailertrashboys", dest: "/reviews/spicevidsgay" },
      { pair: "spicevidsgay-vs-yesfather", dest: "/reviews/spicevidsgay" },
      { pair: "spicevidsgay-vs-youngperps", dest: "/reviews/spicevidsgay" },
      { pair: "alternadudes-vs-spicevidsgay", dest: "/reviews/alternadudes" },
      { pair: "aussiesdoit-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "bearfilms-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "boyfun-vs-spicevidsgay", dest: "/reviews/boyfun" },
      { pair: "boysatcamp-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "brothercrush-vs-spicevidsgay", dest: "/reviews/brothercrush" },
      { pair: "dadcreep-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "daddy-on-twink-vs-spicevidsgay", dest: "/reviews/daddy-on-twink" },
      { pair: "icon-male-vs-maleaccess", dest: "/reviews/maleaccess" },
      { pair: "japanboyz-vs-spicevidsgay", dest: "/reviews/japanboyz" },
      { pair: "latinleche-vs-spicevidsgay", dest: "/reviews/latinleche" },
    ],
  },
  {
    tranche: 5,
    active: true,
    pairs: [
      { pair: "maleaccess-vs-rawhole", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-realmenfuck", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-sexjapantv", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-touch-that-boy", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-trailertrashboys", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-yesfather", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-youngperps", dest: "/reviews/maleaccess" },
      { pair: "missionaryboys-vs-spicevidsgay", dest: "/reviews/missionaryboys" },
      { pair: "noirmale-vs-spicevidsgay", dest: "/reviews/noirmale" },
      { pair: "southern-strokes-vs-spicevidsgay", dest: "/reviews/southern-strokes" },
      { pair: "spicevidsgay-vs-twinktrade", dest: "/reviews/twinktrade" },
      { pair: "alternadudes-vs-maleaccess", dest: "/reviews/alternadudes" },
      { pair: "boyfun-vs-maleaccess", dest: "/reviews/boyfun" },
      { pair: "brothercrush-vs-maleaccess", dest: "/reviews/brothercrush" },
      { pair: "daddy-on-twink-vs-maleaccess", dest: "/reviews/daddy-on-twink" },
      { pair: "familydick-vs-spicevidsgay", dest: "/reviews/familydick" },
      { pair: "gayasiannetwork-vs-spicevidsgay", dest: "/reviews/gayasiannetwork" },
      { pair: "japanboyz-vs-maleaccess", dest: "/reviews/japanboyz" },
      { pair: "latinleche-vs-maleaccess", dest: "/reviews/latinleche" },
      { pair: "maleaccess-vs-missionaryboys", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-noirmale", dest: "/reviews/maleaccess" },
      { pair: "maleaccess-vs-twinktrade", dest: "/reviews/maleaccess" },
      { pair: "spicevidsgay-vs-twinkpop", dest: "/reviews/twinkpop" },
      { pair: "spicevidsgay-vs-yoshikawasakixxx", dest: "/reviews/yoshikawasakixxx" },
      { pair: "athletic-twinks-vs-spicevidsgay", dest: "/reviews/athletic-twinks" },
      { pair: "familydick-vs-maleaccess", dest: "/reviews/familydick" },
      { pair: "gayasiannetwork-vs-maleaccess", dest: "/reviews/gayasiannetwork" },
      { pair: "maleaccess-vs-twinkpop", dest: "/reviews/twinkpop" },
    ],
  },
  {
    tranche: 6,
    active: true,
    pairs: [
      { pair: "maleaccess-vs-yoshikawasakixxx", dest: "/reviews/yoshikawasakixxx" },
      { pair: "peterfever-vs-spicevidsgay", dest: "/reviews/peterfever" },
      { pair: "sayuncle-vs-spicevidsgay", dest: "/reviews/sayuncle" },
      { pair: "athletic-twinks-vs-maleaccess", dest: "/reviews/athletic-twinks" },
      { pair: "maleaccess-vs-peterfever", dest: "/reviews/peterfever" },
      { pair: "maleaccess-vs-sayuncle", dest: "/reviews/sayuncle" },
      { pair: "men-vs-spicevidsgay", dest: "/reviews/men" },
      { pair: "sean-cody-vs-spicevidsgay", dest: "/reviews/sean-cody" },
      { pair: "maleaccess-vs-sean-cody", dest: "/reviews/sean-cody" },
      { pair: "bigstr-vs-twinks-in-shorts", dest: "/reviews/twinks-in-shorts" },
      { pair: "bigstr-vs-next-door-world", dest: "/reviews/bigstr" },
      { pair: "bigstr-vs-nakedsword", dest: "/reviews/nakedsword" },
      { pair: "bigstr-vs-next-door-twink", dest: "/reviews/bigstr" },
      { pair: "bigstr-vs-helix-studios", dest: "/reviews/helix-studios" },
      { pair: "spicevidsgay-vs-twinks-in-shorts", dest: "/reviews/twinks-in-shorts" },
      { pair: "maleaccess-vs-twinks-in-shorts", dest: "/reviews/twinks-in-shorts" },
      { pair: "next-door-world-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "nakedsword-vs-spicevidsgay", dest: "/reviews/nakedsword" },
      { pair: "next-door-twink-vs-spicevidsgay", dest: "/reviews/spicevidsgay" },
      { pair: "biempire-vs-helix-studios", dest: "/reviews/helix-studios" },
      { pair: "maleaccess-vs-nakedsword", dest: "/reviews/nakedsword" },
      { pair: "helix-studios-vs-spicevidsgay", dest: "/reviews/helix-studios" },
      { pair: "helix-studios-vs-maleaccess", dest: "/reviews/helix-studios" },
    ],
  },
];

/** Pairs whose demotion is LIVE (active tranches only). */
export function activeDemotedPairs(): Set<string> {
  return new Set(
    DEMOTION_TRANCHES.filter((t) => t.active).flatMap((t) => t.pairs.map((p) => p.pair)),
  );
}

/** Redirect map for active tranches — consumed by scripts/sync-compare-redirects.ts. */
export function activeDemotionRedirects(): CompareDemotion[] {
  return DEMOTION_TRANCHES.filter((t) => t.active).flatMap((t) => t.pairs);
}
