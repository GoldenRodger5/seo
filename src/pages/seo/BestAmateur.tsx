import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";

const filtered = sites
  .filter((s) => isAffiliated(s) && (siteNicheMap[s.slug] ?? []).includes("amateur"))
  .sort((a, b) => b.overall_score - a.overall_score);

const BestAmateur = () => (
  <SeoLandingPage
    path="/best-amateur-gay-sites"
    title="Best Amateur Gay Porn Sites"
    description="Real performers, authentic chemistry, no studio gloss. The best amateur gay sites ranked by content quality and value."
    h1="Best Amateur Gay Sites"
    badge="Amateur Niche"
    intro="Amateur gay sites cover everyone from genuine first-timers to semi-pros to roleplay-styled scripted content. Ranked here by overall score — every site below is affiliated and scored on the same four-pillar methodology."
    sites={filtered}
    closing={`The MyGayCash and zBuckz networks dominate the amateur aesthetic — natural bodies, unscripted scenes, and lower production overheads passed on as cheaper memberships. Twinks in Shorts and Athletic Twinks consistently rank near the top of this category.`}
    related={[
      { to: "/niche/amateur", label: "Amateur niche hub" },
      { to: "/cheapest-twink-sites", label: "Cheapest sites" },
    ]}
  />
);

export default BestAmateur;
