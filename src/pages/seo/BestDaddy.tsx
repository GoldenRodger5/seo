import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";

const filtered = sites
  .filter((s) => isAffiliated(s) && (siteNicheMap[s.slug] ?? []).includes("daddy"))
  .sort((a, b) => b.overall_score - a.overall_score);

const BestDaddy = () => (
  <SeoLandingPage
    path="/best-daddy-twink-sites"
    title="Best Daddy/Twink Porn Sites"
    description="The best daddy/twink gay porn sites ranked. Authentic age-gap chemistry, family-fantasy taboo studios, and dedicated daddy-twink porn sites scored honestly across every major network."
    h1="Best Daddy/Twink Porn Sites"
    badge="Daddy Niche"
    intro="The daddy/twink niche has its own studio ecosystem within gay porn — taboo family-fantasy on the ChargedCash network, dedicated age-gap studios like Daddy on Twink and Icon Male, and crossover content from the bigger gay porn sites. Ranked here by overall score across every site we've tested."
    sites={filtered}
    closing={`SayUncle is the network hub — one membership unlocks Family Dick, Brother Crush, Yes Father, Dad Creep, and the rest of the ChargedCash taboo family. If you're after the polished family-fantasy aesthetic, that's the entry point. For more naturalistic age-gap content without the roleplay framing, Daddy on Twink and Icon Male are the cleanest twink porn picks in the daddy niche.`}
    related={[
      { to: "/niche/daddy", label: "Daddy niche hub" },
      { to: "/reviews/sayuncle", label: "SayUncle review" },
    ]}
  />
);

export default BestDaddy;
