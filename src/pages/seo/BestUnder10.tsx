import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";

const parsePrice = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ""));

const filtered = sites
  .filter((s) => isAffiliated(s) && parsePrice(s.price_annual) < 10)
  .sort((a, b) => b.value_score - a.value_score || b.overall_score - a.overall_score);

const BestUnder10 = () => (
  <SeoLandingPage
    path="/best-gay-sites-under-10"
    title="Best Gay Porn Sites Under $10"
    description="The best gay membership sites under $10/mo on the annual plan. Real scores, real prices, ranked by value-for-money."
    h1="Best Gay Sites Under $10/mo"
    badge="Best Value"
    intro="Every site on this page costs less than $10 a month when you take the annual plan. Ranked by value-for-money score — quality first, price second."
    sites={filtered}
    closing={`Going annual is the trick. Most of these sites charge $25-30/month if you pay monthly, but drop into the $7-10 range on a yearly subscription. The savings compound: $260+ over 12 months on a single site.\n\nWe only list sites that score 3.7+ on our methodology. A bad site at $5/month is still bad — you'll cancel by month two.`}
    related={[
      { to: "/cheapest-twink-sites", label: "Cheapest sites overall" },
      { to: "/best-deals", label: "Current deals" },
    ]}
  />
);

export default BestUnder10;
