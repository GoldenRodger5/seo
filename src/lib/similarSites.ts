import { sites, isAffiliated, type SiteData } from "@/data/sites";
import { siteNicheMap } from "@/data/site-niches";

/**
 * Network family heuristic. Sites in the same studio family / network share
 * brand DNA, so we deprioritize recommending one to a user already on another.
 */
const networkOf = (slug: string): string => {
  if (slug.startsWith("next-door")) return "next-door";
  if (slug === "helix-studios" || slug === "athletic-twinks") return "helix-family";
  if (["familydick", "dadcreep", "brothercrush", "sayuncle", "boysatcamp", "missionaryboys", "militarydick", "latinleche", "yesfather", "bullyhim", "youngperps", "twinktrade"].includes(slug)) return "chargedcash";
  if (["barebackcumpigs", "bearchubs", "bearfilms", "hairyandraw", "twinks-in-shorts", "athletic-twinks", "southern-strokes", "daddy-on-twink", "touch-that-boy", "breed-me-raw", "bareback-that-hole", "hard-brit-lads"].includes(slug)) return "mygaycash";
  if (["japanboyz", "sexjapantv", "hiroyaxxx", "yoshikawasakixxx", "wuboyz", "barebackrtxxx", "cumpigmen", "realmenfuck", "swinginballs", "squirtstudios", "aussiesdoit", "rawhole", "peterfever", "gayasiannetwork", "alternadudes", "dirtyboyvideo", "dudesraw"].includes(slug)) return "zbuckz";
  if (["nakedsword", "trailertrashboys"].includes(slug)) return "nakedsword";
  if (["boyfun", "jawked"].includes(slug)) return "xxxrewards";
  return slug;
};

/**
 * Score = 60% niche overlap + 20% score similarity + 10% same affiliate program +
 *         10% different brand penalty (subtracted if same network).
 */
export const getSimilarSites = (slug: string, count: number = 3): SiteData[] => {
  const target = sites.find((s) => s.slug === slug);
  if (!target) return [];

  const targetNiches = new Set(siteNicheMap[slug] ?? []);
  const targetNetwork = networkOf(slug);

  // Only ever recommend sites we can actually drive traffic to.
  const eligible = sites.filter((s) => s.slug !== slug && isAffiliated(s));

  const ranked = eligible
    .map((s) => {
      const ns = siteNicheMap[s.slug] ?? [];
      const overlap = ns.filter((n) => targetNiches.has(n)).length;
      const overlapScore = targetNiches.size > 0 ? overlap / targetNiches.size : 0;

      const scoreDiff = Math.abs(target.overall_score - s.overall_score);
      const scoreSimilarity = Math.max(0, 1 - scoreDiff / 5);

      const sameNetwork = networkOf(s.slug) === targetNetwork;
      const networkPenalty = sameNetwork ? 0.5 : 0;

      const composite =
        overlapScore * 0.7 +
        scoreSimilarity * 0.2 +
        (1 - networkPenalty) * 0.1;

      return { site: s, composite, overlap };
    })
    .sort((a, b) => b.composite - a.composite);

  // Primary picks: any niche overlap.
  const primary = ranked.filter((c) => c.overlap > 0).slice(0, count);
  if (primary.length >= count) {
    return primary.map((c) => c.site);
  }

  // Fallback: top up with the highest-rated affiliated sites we haven't
  // already included so the block always renders `count` cards.
  const usedIds = new Set(primary.map((c) => c.site.id));
  const fillers = [...eligible]
    .filter((s) => !usedIds.has(s.id))
    .sort((a, b) => b.overall_score - a.overall_score);

  return [...primary.map((c) => c.site), ...fillers].slice(0, count);
};
