import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";

const filtered = sites
  .filter((s) => isAffiliated(s) && (siteNicheMap[s.slug] ?? []).includes("asian"))
  .sort((a, b) => b.overall_score - a.overall_score);

const BestAsian = () => (
  <SeoLandingPage
    path="/best-asian-gay-sites"
    title="Best Asian Gay Porn Sites"
    description="The best Asian gay sites ranked by quality, performer authenticity, and library depth. Japanese, Chinese, and pan-Asian networks scored on the same methodology as everything else."
    h1="Best Asian Gay Sites"
    badge="Asian Niche"
    intro="Asian gay content has a small number of dedicated specialists rather than a big mainstream presence. The right site depends heavily on which Asian sub-niche matters to you — Japanese studio content, pan-Asian variety, or single-performer catalogs."
    sites={filtered}
    closing={`PeterFever leads on production polish; Japanboyz on authentic Japanese studio content; GayAsianNetwork on pan-Asian variety. The single-performer sites (HiroyaXXX, Yoshi Kawasaki XXX) make sense if you're already a fan of those individual performers — otherwise start with PeterFever or the network options for breadth.`}
    related={[
      { to: "/niche/asian", label: "Asian niche hub" },
      { to: "/niche/japanese", label: "Japanese gay sites" },
    ]}
  />
);

export default BestAsian;
