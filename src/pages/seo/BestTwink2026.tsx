import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";

const filtered = sites
  .filter((s) => isAffiliated(s) && (siteNicheMap[s.slug] ?? []).includes("twink"))
  .sort((a, b) => b.overall_score - a.overall_score || b.update_frequency - a.update_frequency)
  .slice(0, 15);

const BestTwink2026 = () => (
  <SeoLandingPage
    path="/best-gay-twink-sites-2026"
    title="Best Gay Twink Sites 2026"
    description="The top 15 gay twink sites for 2026, ranked by content quality, value, and update frequency. Updated monthly with verified scores."
    h1="Best Gay Twink Sites 2026"
    badge="Updated 2026"
    intro="The 15 highest-scoring twink-focused gay sites we've tested, ranked by overall score with update frequency as the tiebreaker. Every site here has been paid for, accessed, and scored on the same four-pillar methodology."
    sites={filtered}
    closing={`The 2026 leaderboard hasn't shifted dramatically from 2025 — NakedSword still leads on library depth, Twinks in Shorts and Athletic Twinks lead on per-dollar value, and the Falcon/MEN networks dominate the premium tier. New entries this year include Men.com, Twinkpop, and MaleAccess — all worth checking against your existing subscription.`}
    related={[
      { to: "/best-twink-sites", label: "Evergreen rankings" },
      { to: "/top-sites", label: "Full top sites list" },
    ]}
  />
);

export default BestTwink2026;
