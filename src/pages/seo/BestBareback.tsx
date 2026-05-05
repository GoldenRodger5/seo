import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";

const filtered = sites
  .filter((s) => isAffiliated(s) && (siteNicheMap[s.slug] ?? []).includes("bareback"))
  .sort((a, b) => b.overall_score - a.overall_score);

const BestBareback = () => (
  <SeoLandingPage
    path="/best-bareback-gay-sites"
    title="Best Bareback Gay Sites"
    description="Every bareback gay site we've tested, ranked by content quality, library depth, and pricing. Twink, daddy, bear, and crossover bareback content all scored honestly."
    h1="Best Bareback Gay Sites"
    badge="Bareback Niche"
    intro="Bareback is the dominant aesthetic across modern gay membership sites. We've ranked every site we've tested that focuses on or includes substantial bareback content — sorted by overall score."
    sites={filtered}
    closing={`The bareback niche has fragmented across networks: zBuckz, MyGayCash, ChargedCash, and the major studios all carry strong catalogs. The right pick depends on which sub-aesthetic you're after — twink-focused (Breed Me Raw, Bareback That Hole), bear/hairy (Hairy and Raw), athletic (Sean Cody), or studio-cinematic (Men.com, NakedSword).`}
    related={[
      { to: "/niche/bareback", label: "Bareback niche hub" },
      { to: "/top-sites", label: "Full rankings" },
    ]}
  />
);

export default BestBareback;
