import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";

const filtered = sites
  .filter((s) => isAffiliated(s) && s.categories.includes("premium-studios"))
  .sort((a, b) => b.overall_score - a.overall_score);

const BestPremium = () => (
  <SeoLandingPage
    path="/best-premium-gay-sites"
    title="Best Premium Gay Porn Sites"
    description="The premium-tier studio sites — high production values, exclusive performers, and the catalogs that built the modern gay industry. Ranked honestly."
    h1="Best Premium Gay Studio Sites"
    badge="Premium Studios"
    intro="The studio tier — sites with cinematic production, exclusive performer rosters, and recognised brand names. These cost more than amateur sites for a reason: scripted scenes, professional lighting, and curated casting."
    sites={filtered}
    closing={`NakedSword acts as the umbrella, aggregating 50,000+ scenes from 300+ studios. Men.com and Sean Cody represent the major standalone studios. Icon Male and Twinkpop are tighter niche-specific premium plays. NoirMale is the upscale Black gay studio under the Falcon name.`}
    related={[
      { to: "/category/premium-studios", label: "Premium category" },
      { to: "/top-sites", label: "Overall rankings" },
    ]}
  />
);

export default BestPremium;
