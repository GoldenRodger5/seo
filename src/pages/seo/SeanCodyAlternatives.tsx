import SeoLandingPage from "../../components/SeoLandingPage";
import { getSimilarSites } from "../../lib/similarSites";
import { getAlternativesBody } from "../../data/alternatives-content";

const sites = getSimilarSites("sean-cody", 5);
const aiBody = getAlternativesBody("sean-cody-alternatives");

const SeanCodyAlternatives = () => (
  <SeoLandingPage
    path="/sean-cody-alternatives"
    title="Sean Cody Alternatives"
    description="The 5 best alternatives to Sean Cody — athletic, all-American, bareback gay sites ranked by similarity and value."
    h1="Sean Cody Alternatives"
    badge="Alternatives"
    intro="Sean Cody is one of the most recognised names in gay adult content — 20+ years of athletic, all-American performers in bareback scenes. These alternatives match different parts of the formula: athletic casting, bareback focus, or the disciplined studio aesthetic."
    sites={sites}
    closing={`Athletic Twinks and Jawked deliver the gym-body aesthetic at a lower annual rate. Men.com and NakedSword provide larger libraries with broader variety. PeterFever offers the muscular casting in a different ethnic niche. Pick based on which Sean Cody trait you specifically want more of.`}
    related={[
      { to: "/reviews/sean-cody", label: "Sean Cody review" },
      { to: "/best-premium-gay-sites", label: "All premium sites" },
    ]}
    aiBody={aiBody}
  />
);

export default SeanCodyAlternatives;
