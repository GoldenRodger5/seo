import SeoLandingPage from "../../components/SeoLandingPage";
import { sites, isAffiliated, getSiteBySlug } from "../../data/sites";

const DOWNLOAD_SITES = [
  "gaywire",
  "nakedsword",
  "men",
  "sean-cody",
  "twinkpop",
  "icon-male",
  "peterfever",
  "alternadudes",
  "rawhole",
  "japanboyz",
];

const filtered = DOWNLOAD_SITES
  .map((slug) => getSiteBySlug(slug))
  .filter((s): s is NonNullable<typeof s> => Boolean(s) && isAffiliated(s!))
  .sort((a, b) => b.overall_score - a.overall_score);

const BestWithDownloads = () => (
  <SeoLandingPage
    path="/best-gay-sites-with-downloads"
    title="Best Gay Porn Sites with Downloads"
    description="Gay membership sites that let you download scenes for offline viewing. Ranked by library size, quality, and value — streaming-only sites excluded."
    h1="Best Gay Sites with Downloads"
    badge="Download Access"
    intro="Most modern gay sites have moved to streaming-only. These are the ones that still let you download scenes — useful if your connection is unreliable, you travel, or you want a permanent copy of content you've already paid for."
    sites={filtered}
    closing={`Gay Wire is the only site in our database that explicitly tags download access in its product description. The others — NakedSword, Men.com, Sean Cody, Icon Male — are included based on industry-standard download support on their flagship plans, which can vary by membership tier.\n\nAlways verify the download policy before subscribing if it's a hard requirement. Some sites limit downloads per day, restrict file quality on the cheap tier, or have removed downloads entirely from new accounts.`}
    related={[
      { to: "/top-sites", label: "All ranked sites" },
      { to: "/best-premium-gay-sites", label: "Premium sites" },
    ]}
  />
);

export default BestWithDownloads;
