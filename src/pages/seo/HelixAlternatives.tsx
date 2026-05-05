import SeoLandingPage from "../../components/SeoLandingPage";
import { getSimilarSites } from "../../lib/similarSites";

const sites = getSimilarSites("helix-studios", 5);

const HelixAlternatives = () => (
  <SeoLandingPage
    path="/helix-studios-alternatives"
    title="Helix Studios Alternatives"
    description="The 5 best alternatives to Helix Studios — premium twink-focused sites with comparable production quality. Ranked by overlap with what makes Helix worth paying for."
    h1="Helix Studios Alternatives"
    badge="Alternatives"
    intro="Helix Studios is the benchmark in premium twink content — 4,000+ exclusive scenes, cinematic production, and a 20+ year catalog. These alternatives match different parts of that profile: production polish, twink aesthetic, or library depth."
    sites={sites}
    closing={`If Helix's price is the issue, Twinkpop and Boyfun deliver studio-quality twink scenes at a lower annual rate. If you want pure library size, NakedSword aggregates 50,000+ scenes across studios. If the all-American casting is the appeal, Sean Cody is the closest aesthetic match.`}
    related={[
      { to: "/reviews/helix-studios", label: "Helix Studios review" },
      { to: "/best-premium-gay-sites", label: "All premium sites" },
    ]}
  />
);

export default HelixAlternatives;
