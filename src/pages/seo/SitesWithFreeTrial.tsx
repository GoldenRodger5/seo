import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated, SiteData } from "../../data/sites";

const TRIAL_KEYWORDS = ["trial", "Trial", "TRIAL"];
const KNOWN_TRIAL_SLUGS = new Set([
  "maleaccess",
  "nakedsword",
  "men",
  "sean-cody",
  "icon-male",
  "twinkpop",
  "reality-dudes",
  "biempire",
  "black-male-me",
  "gaywire",
]);

const mentionsTrial = (s: SiteData) => {
  const haystack = [...s.pros, ...s.cons, s.short_description, s.description].join(" ");
  return TRIAL_KEYWORDS.some((k) => haystack.includes(k));
};

const filtered = sites
  .filter((s) => isAffiliated(s) && (s.has_free_trial || mentionsTrial(s) || KNOWN_TRIAL_SLUGS.has(s.slug)))
  .sort((a, b) => Number(b.has_free_trial) - Number(a.has_free_trial) || b.overall_score - a.overall_score);

const SitesWithFreeTrial = () => (
  <SeoLandingPage
    path="/gay-porn-sites-with-free-trial"
    title="Gay Porn Sites with Free Trial"
    description="Every gay porn site offering a free or low-cost intro trial. Try before you commit — verified trial offers across twink, bareback, premium, and Asian niches."
    h1="Gay Porn Sites with Free Trials"
    badge="Try Before You Buy"
    intro="True free trials are rare in this category — most sites offer $1-2.95 intro periods rather than fully free access. We've collected every affiliated site that offers some form of trial. MaleAccess is the only one with a confirmed 7-day fully-free trial."
    sites={filtered}
    closing={`Trial gotchas to watch for: most sites bill the full monthly rate the moment the trial ends unless you cancel beforehand. Set a calendar reminder. Some sites also restrict trial access to a subset of the catalog, so what you see during the trial may not represent the full membership experience.\n\nMaleAccess at 7 days is the longest free trial we've found. The MEN Network sites (Men.com, Twinkpop, Sean Cody) typically offer $1-2/day intro periods that auto-renew at $29.99 — useful for a one-night browse but not a real evaluation.`}
    related={[
      { to: "/free-trial-twink-sites", label: "Twink-only trial sites" },
      { to: "/best-gay-sites-for-beginners", label: "For beginners" },
    ]}
  />
);

export default SitesWithFreeTrial;
