import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";

const filtered = sites
  .filter(isAffiliated)
  .sort((a, b) => b.value_score - a.value_score || b.overall_score - a.overall_score)
  .slice(0, 20);

const BestValueGayPorn = () => (
  <SeoLandingPage
    path="/best-value-gay-porn-sites"
    title="Best Value Gay Porn Sites"
    description="The gay porn sites that deliver the most content for your money. Ranked by value-for-money score, with annual price-per-month and library size factored in."
    h1="Best Value Gay Porn Sites — Most Content Per Dollar (2026)"
    badge="Best Value"
    intro="Every site below scores 80+ on our value-for-money pillar. That score factors in annual price, library size, update frequency, and what's included in the base subscription. Network passes and aggregator sites tend to dominate this list because spreading the cost across more content is what creates value."
    sites={filtered}
    closing={`SpiceVidsGay tops on raw price-per-scene because the parent SpiceVids platform aggregates 300,000+ scenes. NakedSword is the runner-up with 50,000+ scenes from 300+ studios. The MyGayCash network sites (Twinks in Shorts, Athletic Twinks) win on the annual rate alone — $9.95/mo for focused, well-produced content.\n\nA strong value score doesn't mean the site is the right fit. If you don't want pan-Asian content or athletic-twink aesthetic, those high-value sites become low-value to you. Use this list alongside the niche pages to find the intersection.`}
    related={[
      { to: "/best-gay-sites-under-10", label: "Under $10/mo" },
      { to: "/cheapest-twink-sites", label: "Cheapest overall" },
    ]}
  />
);

export default BestValueGayPorn;
