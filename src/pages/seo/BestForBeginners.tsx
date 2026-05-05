import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";

const parsePrice = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ""));

const filtered = sites
  .filter(
    (s) =>
      isAffiliated(s) &&
      (s.has_free_trial || parsePrice(s.price_annual) < 11) &&
      s.mobile_score >= 75 &&
      s.value_score >= 78
  )
  .sort(
    (a, b) =>
      b.value_score + b.mobile_score - (a.value_score + a.mobile_score) ||
      b.overall_score - a.overall_score
  )
  .slice(0, 10);

const BestForBeginners = () => (
  <SeoLandingPage
    path="/best-gay-sites-for-beginners"
    title="Best Gay Porn Sites for Beginners"
    description="New to gay membership sites? These are the most approachable: low entry price, strong mobile experience, and free trials where available."
    h1="Best Gay Sites for Beginners"
    badge="Beginner Friendly"
    intro="If this is your first paid gay site, the right pick is one with low commitment, a clean mobile experience, and a focused library that won't overwhelm you. Ranked here by combined value and mobile scores — the two pillars that matter most when you're starting out."
    sites={filtered}
    closing={`Skip the mega-libraries on day one. NakedSword's 50,000-scene catalog sounds great until you realise you'll spend the first month paralysed by choice. A focused site with a clear aesthetic — Twinks in Shorts, Athletic Twinks, Boyfun — gets you content faster.\n\nMaleAccess is the only site here with a genuine 7-day free trial. The rest are low-priced annual plans, which means you should pay attention to the cancellation flow before subscribing.`}
    related={[
      { to: "/free-trial-twink-sites", label: "Sites with free trials" },
      { to: "/find-my-site", label: "Take the quiz" },
    ]}
  />
);

export default BestForBeginners;
