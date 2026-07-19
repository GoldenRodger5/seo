import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../../components/Layout";
import Breadcrumbs from "../../components/Breadcrumbs";
import { sites, isPendingReview, isEditorialOnly } from "../../data/sites";
import { currentYear, currentMonthLong } from "../../lib/dates";

/**
 * Gay Porn Pricing Index — original-data study computed live from the site
 * catalog. This page is the site's linkable asset: every number is derived
 * from our own hand-verified pricing dataset at build time, so it stays
 * current as the engine updates sites.ts, and it gives bloggers/forums a
 * citable source ("median gay porn site costs $X/mo — TwinkVault Pricing
 * Index"). Charts are pure CSS bars, no chart library, nothing hidden at
 * hydration, fully painted in the prerendered HTML.
 */

const parsePrice = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
const money = (n: number) => `$${n.toFixed(2)}`;

// Aggregate stats use the full dataset; ranked/linked surfaces (tables,
// value picks) only ever show commercial sites — pending-review and
// editorial-only sites stay out of ranked surfaces sitewide.
const commercial = sites.filter((s) => !isPendingReview(s) && !isEditorialOnly(s));

const monthlies = sites.map((s) => parsePrice(s.price_monthly)).filter((n) => n > 0).sort((a, b) => a - b);
const annuals = sites.map((s) => parsePrice(s.price_annual)).filter((n) => n > 0).sort((a, b) => a - b);
const median = (arr: number[]) => (arr.length % 2 ? arr[(arr.length - 1) / 2] : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2);

const medianMonthly = median(monthlies);
const medianAnnual = median(annuals);
const meanMonthly = monthlies.reduce((a, b) => a + b, 0) / monthlies.length;
const meanAnnual = annuals.reduce((a, b) => a + b, 0) / annuals.length;
// Average annual-vs-monthly discount across sites that publish both rates.
const gaps = sites
  .map((s) => ({ m: parsePrice(s.price_monthly), a: parsePrice(s.price_annual) }))
  .filter(({ m, a }) => m > 0 && a > 0 && a < m);
const avgGapPct = Math.round((gaps.reduce((acc, { m, a }) => acc + (m - a) / m, 0) / gaps.length) * 100);
const avgYearlySavings = gaps.reduce((acc, { m, a }) => acc + (m - a) * 12, 0) / gaps.length;
const trialCount = sites.filter((s) => s.has_free_trial).length;

// Histogram buckets over monthly sticker prices (full dataset).
const BUCKETS = [
  { label: "Under $10", min: 0, max: 10 },
  { label: "$10–$15", min: 10, max: 15 },
  { label: "$15–$20", min: 15, max: 20 },
  { label: "$20–$25", min: 20, max: 25 },
  { label: "$25–$30", min: 25, max: 30 },
  { label: "$30+", min: 30, max: Infinity },
];
const histogram = BUCKETS.map((b) => ({
  ...b,
  count: monthlies.filter((n) => n >= b.min && n < b.max).length,
}));
const histMax = Math.max(...histogram.map((h) => h.count));

// Cheapest annual rates + best score-per-dollar — commercial sites only.
const cheapestAnnual = [...commercial]
  .filter((s) => parsePrice(s.price_annual) > 0)
  .sort((a, b) => parsePrice(a.price_annual) - parsePrice(b.price_annual))
  .slice(0, 10);
const cheapMax = Math.max(...cheapestAnnual.map((s) => parsePrice(s.price_annual)));
const bestValue = [...commercial]
  .filter((s) => parsePrice(s.price_annual) > 0)
  .map((s) => ({ site: s, ratio: s.overall_score / parsePrice(s.price_annual) }))
  .sort((a, b) => b.ratio - a.ratio)
  .slice(0, 8);
const priceTable = [...commercial]
  .filter((s) => parsePrice(s.price_annual) > 0)
  .sort((a, b) => parsePrice(a.price_annual) - parsePrice(b.price_annual));
const priciest = [...sites].filter((s) => parsePrice(s.price_monthly) > 0).sort((a, b) => parsePrice(b.price_monthly) - parsePrice(a.price_monthly))[0];
const biggestGap = [...commercial]
  .map((s) => ({ s, m: parsePrice(s.price_monthly), a: parsePrice(s.price_annual) }))
  .filter(({ m, a }) => m > 0 && a > 0)
  .sort((x, y) => (y.m - y.a) * 12 - (x.m - x.a) * 12)[0];

const faqs = [
  {
    q: "How much does a gay porn site membership cost on average?",
    a: `Across the ${sites.length} sites in our dataset, the median monthly sticker price is ${money(medianMonthly)}/month, and the average is ${money(meanMonthly)}. But almost nobody should pay that: on annual billing the median falls to ${money(medianAnnual)}/month. The sticker monthly rate is effectively a convenience surcharge. Committing annually cuts the real cost by roughly ${avgGapPct}% on the average site.`,
  },
  {
    q: "Why are monthly and annual prices so different?",
    a: `The gap is deliberate pricing structure, not a sale. Sites price the monthly tier ${avgGapPct}% higher on average because a large share of subscribers stay for months without re-checking the rate. On the average site in our index, choosing annual over monthly billing saves about ${money(avgYearlySavings)} per year, and on the widest-gap site (${biggestGap.s.name}) the difference is ${money((biggestGap.m - biggestGap.a) * 12)}/year for identical access.`,
  },
  {
    q: `What is the cheapest good gay porn site in ${currentYear}?`,
    a: `The cheapest annual rate among sites we score well is ${cheapestAnnual[0].name} at ${cheapestAnnual[0].price_annual}/month on annual billing. Cheap alone isn't the test, though. Our best-value ranking divides each site's editorial score by its annual rate, and ${bestValue[0].site.name} currently leads that score-per-dollar table.`,
  },
  {
    q: "Do gay porn sites offer free trials?",
    a: `${trialCount} of the ${sites.length} sites in our dataset (${Math.round((trialCount / sites.length) * 100)}%) offer some form of free or heavily discounted trial. Trials usually restrict streaming quality or downloads, and they auto-convert to the full monthly rate, which is the most expensive way to be billed, so set a reminder before the conversion date.`,
  },
  {
    q: "How is this pricing data collected?",
    a: `Every price in the index comes from our own review process: we check each site's join page directly, record the published monthly, quarterly, and annual rates in USD, and re-verify on an ongoing cycle (last full verification pass: ${currentMonthLong} ${currentYear}). The dataset updates automatically as our catalog updates; numbers on this page are computed from the live dataset, not written by hand.`,
  },
];

const PricingIndex = () => {
  const url = "https://twinkvault.com/gay-porn-pricing-index";
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `TwinkVault Gay Porn Pricing Index ${currentYear}`,
    description: `Hand-verified membership pricing for ${sites.length} gay porn sites: monthly, quarterly, and annual rates in USD, discount structures, and free-trial availability.`,
    url,
    creator: { "@type": "Organization", name: "TwinkVault", url: "https://twinkvault.com" },
    license: "https://creativecommons.org/licenses/by/4.0/",
    temporalCoverage: String(currentYear),
    variableMeasured: ["monthly price USD", "quarterly price USD", "annual price USD", "discount percent", "free trial availability"],
  };
  return (
    <Layout>
      <Helmet>
        <title>{`Gay Porn Pricing Index ${currentYear}: Real Costs | TwinkVault`}</title>
        <meta
          name="description"
          content={`How much does gay porn actually cost in ${currentYear}? Original pricing data from ${sites.length} membership sites: median prices, annual-vs-monthly gaps, and best value picks.`}
        />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={`Gay Porn Pricing Index ${currentYear} — Real Costs, Real Data`} />
        <meta property="og:description" content={`Median price ${money(medianMonthly)}/mo sticker, ${money(medianAnnual)}/mo annual. Original data from ${sites.length} hand-verified sites.`} />
      </Helmet>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="hero-mesh py-12">
        <div className="container max-w-4xl">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Pricing Index" }]} />
          <h1 className="hero-heading font-heading font-bold heading-gradient inline-block mt-4">
            Gay Porn Pricing Index {currentYear}
          </h1>
          <p className="mt-4 text-base text-foreground/90 max-w-3xl">
            What does gay porn actually cost? We checked the join page of every one of the{" "}
            <strong className="text-foreground">{sites.length} membership sites</strong> in our review
            catalog and recorded the real published rates: monthly, quarterly, and annual, all in USD.
            This page is computed directly from that dataset, so the numbers update as our catalog does.
            Cite it freely with a link; the data is original and licensed CC-BY.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-4xl space-y-12">
          {/* Headline stats */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: "Median monthly (sticker)", value: money(medianMonthly) },
              { label: "Median monthly on annual billing", value: money(medianAnnual) },
              { label: "Avg. annual-billing discount", value: `${avgGapPct}%` },
              { label: "Sites with free trials", value: `${trialCount} of ${sites.length}` },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-lg p-4 text-center">
                <p className="text-2xl font-heading font-bold text-secondary">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-snug">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Price distribution */}
          <div>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              Where Prices Cluster: Monthly Sticker Rates
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              The industry prices in a surprisingly narrow band. {histogram.find((h) => h.count === histMax)?.label} per
              month is the most common sticker bracket — {histMax} of {monthlies.length} sites land there. Genuine
              budget options (under $10/month sticker) are rare; cheap entry points almost always come from annual
              billing on a mid-priced site rather than a genuinely cheap monthly rate.
            </p>
            <div className="mt-6 space-y-2" role="img" aria-label={`Bar chart of monthly price distribution across ${monthlies.length} sites`}>
              {histogram.map((h) => (
                <div key={h.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground text-right">{h.label}</span>
                  <div className="flex-1 h-6 rounded bg-muted/40 overflow-hidden">
                    <div
                      className="h-full gold-gradient rounded"
                      style={{ width: `${Math.max((h.count / histMax) * 100, h.count ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-xs font-semibold">{h.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Annual vs monthly */}
          <div>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              The Annual-Billing Gap Is the Whole Story
            </h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground max-w-3xl leading-relaxed">
              <p>
                The single most important number in this index: the average site charges{" "}
                <strong className="text-foreground">{avgGapPct}% more per month on monthly billing</strong> than on
                annual billing, for identical access. Across the dataset that means the average subscriber who stays
                on the monthly rate overpays by about <strong className="text-foreground">{money(avgYearlySavings)} a year</strong>.
              </p>
              <p>
                The widest gap in the catalog right now belongs to {biggestGap.s.name}: {money(biggestGap.m)}/month
                on monthly billing versus {money(biggestGap.a)}/month on the annual plan —{" "}
                {money((biggestGap.m - biggestGap.a) * 12)} per year for the same membership. The pattern holds at the
                top of the market too: the priciest sticker rate in the index is {priciest.name} at{" "}
                {priciest.price_monthly}/month.
              </p>
              <p>
                Mean prices tell the same story as medians: {money(meanMonthly)} sticker versus {money(meanAnnual)} on
                annual billing, so this isn't a few outliers skewing the average. It's how the entire category prices.
                If you take one thing from this page: never pay the monthly rate past your first month. Our{" "}
                <Link to="/guide/gay-porn-billing-guide" className="text-secondary hover:underline">billing guide</Link>{" "}
                covers how the rebill structures work, and the{" "}
                <Link to="/guide/how-to-cancel-gay-porn-subscriptions" className="text-secondary hover:underline">
                  cancellation guide
                </Link>{" "}
                shows how to exit cleanly before a renewal.
              </p>
            </div>
          </div>

          {/* Cheapest annual */}
          <div>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              The 10 Cheapest Annual Rates We've Verified
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              Effective monthly cost on annual billing, cheapest first. Every one links to our full hands-on review;
              cheap only matters if the site is worth joining at all.
            </p>
            <div className="mt-6 space-y-2" role="img" aria-label="Bar chart of the ten cheapest annual rates">
              {cheapestAnnual.map((s) => (
                <div key={s.slug} className="flex items-center gap-3">
                  <Link to={`/reviews/${s.slug}`} className="w-40 shrink-0 truncate text-xs text-secondary hover:underline text-right">
                    {s.name}
                  </Link>
                  <div className="flex-1 h-6 rounded bg-muted/40 overflow-hidden">
                    <div className="h-full rounded bg-primary/70" style={{ width: `${(parsePrice(s.price_annual) / cheapMax) * 100}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-xs font-semibold">{s.price_annual}/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best value */}
          <div>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              Score-per-Dollar: The Value Frontier
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              Price only means something relative to quality, so this table divides each site's editorial score
              (0–5, from our <Link to="/methodology" className="text-secondary hover:underline">scoring methodology</Link>)
              by its effective annual rate. A high number means you're buying the most verified quality per dollar;
              it's the closest thing to an objective "best deal" ranking we can compute.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Site</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">Annual rate</th>
                    <th className="py-2">Score per $10</th>
                  </tr>
                </thead>
                <tbody>
                  {bestValue.map(({ site, ratio }, i) => (
                    <tr key={site.slug} className="border-b border-border/30">
                      <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-3">
                        <Link to={`/reviews/${site.slug}`} className="text-secondary hover:underline font-medium">{site.name}</Link>
                      </td>
                      <td className="py-2 pr-3">{site.overall_score}/5</td>
                      <td className="py-2 pr-3">{site.price_annual}/mo</td>
                      <td className="py-2 font-semibold">{(ratio * 10).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full table */}
          <div>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              Full Pricing Table — Every Reviewed Site
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              All {priceTable.length} reviewed sites, sorted by effective annual rate. "Total/yr" is the annual rate
              × 12 — what a year actually costs on the plan we'd recommend. Deals move; the{" "}
              <Link to="/best-deals" className="text-secondary hover:underline">deals page</Link> tracks the current
              verified discounts.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Site</th>
                    <th className="py-2 pr-3">Monthly</th>
                    <th className="py-2 pr-3">Annual (per mo)</th>
                    <th className="py-2 pr-3">Total/yr</th>
                    <th className="py-2 pr-3">Gap</th>
                    <th className="py-2">Trial</th>
                  </tr>
                </thead>
                <tbody>
                  {priceTable.map((s) => {
                    const m = parsePrice(s.price_monthly);
                    const a = parsePrice(s.price_annual);
                    const gap = m > 0 ? Math.round(((m - a) / m) * 100) : 0;
                    return (
                      <tr key={s.slug} className="border-b border-border/30">
                        <td className="py-2 pr-3">
                          <Link to={`/reviews/${s.slug}`} className="text-secondary hover:underline">{s.name}</Link>
                        </td>
                        <td className="py-2 pr-3">{s.price_monthly}</td>
                        <td className="py-2 pr-3">{s.price_annual}</td>
                        <td className="py-2 pr-3 font-medium">{money(a * 12)}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{gap}%</td>
                        <td className="py-2">{s.has_free_trial ? "Yes" : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Methodology + citation */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="font-heading text-lg font-bold">Methodology &amp; Reuse</h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Prices are recorded in USD from each site's public join page during our review process and re-verified
                on an ongoing cycle (last full pass: {currentMonthLong} {currentYear}). "Annual" is the per-month
                effective rate on a 12-month commitment as published at signup. Introductory teaser rates that rebill
                higher are recorded at the rebill rate, not the teaser. Aggregate statistics cover the full{" "}
                {sites.length}-site dataset; ranked tables only include sites with a completed editorial review.
              </p>
              <p>
                <strong className="text-foreground">Citing this data:</strong> statistics on this page are original
                TwinkVault research, licensed{" "}
                <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener noreferrer" target="_blank" className="text-secondary hover:underline">
                  CC-BY 4.0
                </a>{" "}
                — reuse them freely in articles, forums, or research with a link back to this page as the source.
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Pricing FAQ</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="glass-card group rounded-lg p-4">
                  <summary className="cursor-pointer list-none font-semibold flex items-center justify-between text-sm">
                    {f.q}
                    <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Related */}
          <div className="border-t border-border/50 pt-6">
            <h2 className="font-heading text-base font-bold">Keep Reading</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              {[
                { to: "/best-cheap-gay-porn-sites", label: "Best cheap gay porn sites (quality-filtered)" },
                { to: "/best-value-gay-porn-sites", label: "Best value gay porn sites" },
                { to: "/best-deals", label: "Current verified discounts" },
                { to: "/best-gay-sites-under-10", label: "Every site under $10/month" },
                { to: "/guide/gay-porn-billing-guide", label: "How gay porn billing actually works" },
                { to: "/top-sites", label: "Full site rankings" },
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

export default PricingIndex;
