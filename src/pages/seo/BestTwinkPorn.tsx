import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";

const filtered = sites
  .filter((s) => isAffiliated(s) && (siteNicheMap[s.slug] ?? []).includes("twink"))
  .sort((a, b) => b.content_quality - a.content_quality || b.overall_score - a.overall_score)
  .slice(0, 15);

const BestTwinkPorn = () => (
  <SeoLandingPage
    path="/best-twink-porn-sites"
    title="Best Twink Porn Sites"
    description="The best twink porn sites of 2026, ranked specifically on content quality. Real performers, real production values, scored by someone who actually subscribes."
    h1="Best Twink Porn Sites (2026) — Ranked by Someone Who Actually Subscribes"
    badge="Twink Specialists"
    intro="We've subscribed to and tested every twink-focused site in this list. This page ranks them by content quality first (production polish, performer chemistry, scene depth) rather than by value or breadth — different angle from our value-focused rankings."
    sites={filtered}
    closing={`Content quality and value usually correlate but not always. NakedSword wins on overall score but its breadth means twink content is one slice of a much larger library — if you only watch twink content, a focused studio like Twinks in Shorts or Twinkpop gets you better per-scene quality at the same price.\n\nThe ChargedCash family-fantasy sites (Family Dick, Brother Crush, Missionary Boys) consistently rank high on production quality for twink-focused content even though they're niche-specific.`}
    related={[
      { to: "/best-twink-sites", label: "Twink sites by value" },
      { to: "/best-gay-twink-sites-2026", label: "2026 leaderboard" },
    ]}
  />
);

export default BestTwinkPorn;
