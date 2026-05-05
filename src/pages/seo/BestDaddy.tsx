import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";

const filtered = sites
  .filter((s) => isAffiliated(s) && (siteNicheMap[s.slug] ?? []).includes("daddy"))
  .sort((a, b) => b.overall_score - a.overall_score);

const BestDaddy = () => (
  <SeoLandingPage
    path="/best-daddy-twink-sites"
    title="Best Daddy/Twink Gay Sites"
    description="The best daddy and older/younger gay sites ranked. Authentic age-gap chemistry, family-fantasy taboo, and dedicated daddy/twink studios scored honestly."
    h1="Best Daddy/Twink Gay Sites"
    badge="Daddy Niche"
    intro="The daddy/twink niche has its own studio ecosystem — taboo family-fantasy on the ChargedCash network, dedicated age-gap studios like Daddy on Twink and Icon Male, and crossover content from the bigger networks. Ranked here by overall score."
    sites={filtered}
    closing={`SayUncle is the network hub — one membership unlocks Family Dick, Brother Crush, Yes Father, Dad Creep, and the rest of the ChargedCash taboo family. If you're after the polished family-fantasy aesthetic, that's the entry point. For more naturalistic age-gap content without the roleplay framing, Daddy on Twink and Icon Male are the cleanest picks.`}
    related={[
      { to: "/niche/daddy", label: "Daddy niche hub" },
      { to: "/reviews/sayuncle", label: "SayUncle review" },
    ]}
  />
);

export default BestDaddy;
