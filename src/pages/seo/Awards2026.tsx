import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../../components/Layout";
import Breadcrumbs from "../../components/Breadcrumbs";
import OutboundLink from "../../components/OutboundLink";
import { sites, isAffiliated, isPendingReview, isEditorialOnly, SiteData } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";
import { getVerdict } from "../../data/site-verdicts";

/**
 * TwinkVault Awards — the backlink flywheel.
 *
 * Every winner is computed from the live scoring data (no editorial
 * fudging: the criteria are stated on-page and reproducible), and every
 * winner gets an embeddable badge whose embed code links back here.
 * Review-site awards earn links because studios put badges on their
 * join pages and press pages — that's how the classic review sites
 * built their link profiles.
 */

const parsePrice = (s: string) => parseFloat((s || "").replace(/[^0-9.]/g, "")) || 0;
// Award-eligible = fully reviewed AND a working partner path. Promotional
// surfaces only feature sites we can send buyers to; the editorial
// rankings (/top-sites, /reviews) remain unfiltered.
const commercial = sites.filter((s) => !isPendingReview(s) && !isEditorialOnly(s) && isAffiliated(s));
const inNiche = (slug: string, niche: string) => (siteNicheMap[slug] ?? []).includes(niche);
const topBy = (pool: SiteData[], key: (s: SiteData) => number) =>
  [...pool].sort((a, b) => key(b) - key(a))[0];

const libCount = (s: SiteData) => {
  const m = (s.library_size ?? "").match(/([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
};

interface Award {
  category: string;
  criteria: string;
  winner: SiteData;
  runnersUp: SiteData[];
}

const buildAwards = (): Award[] => {
  const byScore = [...commercial].sort((a, b) => b.overall_score - a.overall_score);
  const awards: Award[] = [];
  // One win per site: category order sets priority, and each subsequent
  // category excludes prior winners. More distinct winners = every badge
  // lands on a different site's press page.
  const won = new Set<string>();
  const push = (category: string, criteria: string, pool: SiteData[], key: (s: SiteData) => number) => {
    const sorted = [...pool].filter((s) => !won.has(s.slug)).sort((a, b) => key(b) - key(a));
    if (sorted.length === 0) return;
    won.add(sorted[0].slug);
    awards.push({ category, criteria, winner: sorted[0], runnersUp: sorted.slice(1, 3) });
  };

  push("Site of the Year", "Highest overall editorial score across every reviewed site.", byScore, (s) => s.overall_score);
  push("Best Value", "Editorial score divided by effective annual rate — the most verified quality per dollar.", commercial.filter((s) => parsePrice(s.price_annual) > 0), (s) => s.overall_score / parsePrice(s.price_annual));
  push("Best Twink Studio", "Highest overall score among twink-niche sites.", commercial.filter((s) => inNiche(s.slug, "twink")), (s) => s.overall_score);
  push("Best Amateur Site", "Highest overall score among amateur-niche sites.", commercial.filter((s) => inNiche(s.slug, "amateur")), (s) => s.overall_score);
  push("Best Asian Site", "Highest overall score among Asian-niche sites.", commercial.filter((s) => inNiche(s.slug, "asian")), (s) => s.overall_score);
  push("Best Bareback Site", "Highest overall score among bareback-niche sites.", commercial.filter((s) => inNiche(s.slug, "bareback")), (s) => s.overall_score);
  push("Best Mega-Library", "Highest score among sites with an 8,000+ item library.", commercial.filter((s) => libCount(s) >= 8000), (s) => s.overall_score);
  push("Best Deal", "Biggest verified discount on a site scoring 4.0 or higher.", commercial.filter((s) => s.overall_score >= 4 && s.deal_discount > 0), (s) => s.deal_discount);
  return awards;
};

const AWARDS = buildAwards();
const YEAR = 2026;

const badgeSnippet = (category: string) =>
  `<a href="https://twinkvault.com/gay-porn-awards-2026" style="display:inline-block;padding:8px 14px;border:1px solid #d4af37;border-radius:8px;color:#d4af37;background:#161616;font:600 13px/1.4 system-ui,sans-serif;text-decoration:none">🏆 TwinkVault ${category} ${YEAR}</a>`;

const Awards2026 = () => {
  const url = "https://twinkvault.com/gay-porn-awards-2026";
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `TwinkVault Gay Porn Awards ${YEAR}`,
    description: `Category winners across ${AWARDS.length} awards, computed from hand-verified editorial scoring of ${sites.length} gay membership sites.`,
    numberOfItems: AWARDS.length,
    itemListElement: AWARDS.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${a.category}: ${a.winner.name}`,
      url: `https://twinkvault.com/reviews/${a.winner.slug}`,
    })),
  };

  return (
    <Layout>
      <Helmet>
        <title>{`Gay Porn Awards ${YEAR}: TwinkVault Category Winners`}</title>
        <meta
          name="description"
          content={`The TwinkVault Gay Porn Awards ${YEAR}: ${AWARDS.length} category winners chosen by transparent, reproducible criteria from ${sites.length} hand-scored membership sites.`}
        />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={`TwinkVault Gay Porn Awards ${YEAR}`} />
        <meta property="og:description" content={`${AWARDS.length} category winners, chosen by data: ${AWARDS.slice(0, 3).map((a) => `${a.category} — ${a.winner.name}`).join("; ")}.`} />
      </Helmet>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      <section className="hero-mesh py-12">
        <div className="container max-w-4xl">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: `Awards ${YEAR}` }]} />
          <h1 className="hero-heading font-heading font-bold heading-gradient inline-block mt-4">
            Gay Porn Awards {YEAR}
          </h1>
          <p className="mt-4 text-base text-foreground/90 max-w-3xl">
            No jury, no sponsorships, no pay-to-win. Every award below is computed from our published
            scoring of {sites.length} membership sites, with the exact criterion stated under each
            category, and no site can win twice. Disagree with a winner? The{" "}
            <Link to="/methodology" className="text-secondary hover:underline">methodology</Link> and
            the <Link to="/gay-porn-pricing-index" className="text-secondary hover:underline">pricing dataset</Link> are
            public — check our math.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-4xl space-y-8">
          {AWARDS.map((a, i) => (
            <div key={a.category} className="glass-card rounded-lg p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-xl font-bold">
                  <span className="text-secondary mr-2">🏆</span>
                  {a.category}
                </h2>
                <span className="text-xs text-muted-foreground">#{i + 1} of {AWARDS.length}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground italic">Criterion: {a.criteria}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="font-heading text-2xl font-bold heading-gradient inline-block">{a.winner.name}</p>
                <span className="text-sm font-semibold text-secondary">{a.winner.overall_score}/5</span>
                {a.winner.deal_discount > 0 && (
                  <Link to={`/discount/${a.winner.slug}`} className="text-xs font-semibold text-emerald-400 hover:underline">
                    {a.winner.deal_discount}% off deal →
                  </Link>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
                {getVerdict(a.winner.slug) ?? a.winner.best_for ?? a.winner.short_description}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {isAffiliated(a.winner) && (
                  <OutboundLink
                    site={a.winner}
                    ctaPosition="hero"
                    sourceTypeOverride="awards_page"
                    className="cta-btn gold-gradient inline-flex items-center justify-center rounded-button px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
                  >
                    Visit {a.winner.name}
                  </OutboundLink>
                )}
                <Link
                  to={`/reviews/${a.winner.slug}`}
                  className="inline-flex items-center justify-center rounded-button border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  Read the full review →
                </Link>
              </div>

              {a.runnersUp.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Runners-up:{" "}
                  {a.runnersUp.map((r, j) => (
                    <span key={r.slug}>
                      <Link to={`/reviews/${r.slug}`} className="text-secondary hover:underline">{r.name}</Link>
                      {" "}({r.overall_score}/5){j < a.runnersUp.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}

          {/* Badge embed — the backlink flywheel */}
          <div className="glass-card rounded-lg p-6 border-l-4 border-l-secondary">
            <h2 className="font-heading text-lg font-bold">Won an award? Show it off.</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
              If your site is listed above, you're welcome to display the badge on your join page,
              press page, or blog. Copy the snippet, swap in your category name, and it renders the
              badge with a link to this page — that's the whole license: badge + link.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted/40 p-4 text-xs leading-relaxed"><code>{badgeSnippet("Site of the Year")}</code></pre>
            <p className="mt-3 text-xs text-muted-foreground">
              Preview:{" "}
              <span dangerouslySetInnerHTML={{ __html: badgeSnippet("Site of the Year") }} />
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Press inquiries or a category correction: <Link to="/contact" className="text-secondary hover:underline">contact us</Link>.
            </p>
          </div>

          <div className="border-t border-border/50 pt-6">
            <h2 className="font-heading text-base font-bold">Keep Reading</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              {[
                { to: "/top-sites", label: "Full site rankings" },
                { to: "/gay-porn-pricing-index", label: "Gay Porn Pricing Index (the data)" },
                { to: "/methodology", label: "How we score sites" },
                { to: "/best-deals", label: "Current verified deals" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-secondary hover:underline">{l.label} →</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Awards2026;
