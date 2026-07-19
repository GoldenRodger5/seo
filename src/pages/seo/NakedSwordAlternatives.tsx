import SeoLandingPage from "../../components/SeoLandingPage";
import { getSimilarSites } from "../../lib/similarSites";
import { getAlternativesBody } from "../../data/alternatives-content";

const sites = getSimilarSites("nakedsword", 5);
const aiBody = getAlternativesBody("nakedsword-alternatives");

const NakedSwordAlternatives = () => (
  <SeoLandingPage
    path="/nakedsword-alternatives"
    title="NakedSword Alternatives"
    description="The 5 best alternatives to NakedSword — large-library multi-studio gay platforms ranked by content depth, niche coverage, and value."
    h1="NakedSword Alternatives"
    badge="Alternatives"
    intro="NakedSword is the largest gay streaming platform — 50,000+ scenes from 300+ studios on one membership. These alternatives match different parts of the formula: multi-site scale, every-niche coverage, or the umbrella subscription model."
    sites={sites}
    closing={`Next Door World (45+ channels) and MaleAccess (6 partner sites) compete on the multi-site formula. Men.com bundles 9 sub-sites including Twinkpop. Reality Dudes covers 7 sub-sites in the reality niche. SpiceVidsGay aggregates content from 1,700+ studios at a lower price point — different curation, similar breadth.`}
    related={[
      { to: "/reviews/nakedsword", label: "NakedSword review" },
      { to: "/best-premium-gay-sites", label: "All premium sites" },
    ]}
    aiBody={aiBody}
    faqs={aiBody?.faq}
  />
);

export default NakedSwordAlternatives;
