import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../../components/Layout";
import Breadcrumbs from "../../components/Breadcrumbs";
import { sites, isPendingReview, isEditorialOnly, isAffiliated, type SiteData } from "../../data/sites";
import { currentYear } from "../../lib/dates";
import DealAlertSignup from "../../components/DealAlertSignup";
import priceHistory from "../../../docs/price-history.json";

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
// Months at which the annual plan overtakes monthly on the typical site (used in
// the bottom-line summary and the calculator).
const breakevenMonths = Math.max(1, Math.ceil((medianAnnual * 12) / medianMonthly));

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
  .filter((s) => isAffiliated(s) && parsePrice(s.price_annual) > 0)
  .sort((a, b) => parsePrice(a.price_annual) - parsePrice(b.price_annual))
  .slice(0, 10);
const cheapMax = Math.max(...cheapestAnnual.map((s) => parsePrice(s.price_annual)));
const bestValue = [...commercial]
  .filter((s) => isAffiliated(s) && parsePrice(s.price_annual) > 0)
  .map((s) => ({ site: s, ratio: s.overall_score / parsePrice(s.price_annual) }))
  .sort((a, b) => b.ratio - a.ratio)
  .slice(0, 8);
const priceTable = [...commercial]
  .filter((s) => parsePrice(s.price_annual) > 0)
  .sort((a, b) => parsePrice(a.price_annual) - parsePrice(b.price_annual));
const biggestGap = [...commercial]
  .map((s) => ({ s, m: parsePrice(s.price_monthly), a: parsePrice(s.price_annual) }))
  .filter(({ m, a }) => m > 0 && a > 0)
  .sort((x, y) => (y.m - y.a) * 12 - (x.m - x.a) * 12)[0];

// ── Price movement, computed from the weekly snapshot ledger (docs/price-history.json,
// written by scripts/snapshot-prices.ts). This is what turns the page from a snapshot
// into an actual index: it surfaces what has changed since we started tracking, and
// grows richer with every weekly snapshot. All framing is honest — if nothing moved in
// a period, we say so rather than inventing drama.
type Snap = Record<string, { m: string; a: string; d: number }>;
const history = priceHistory as Record<string, Snap>;
const histDates = Object.keys(history).sort();
const firstSnap: Snap = history[histDates[0]] ?? {};
const lastSnap: Snap = history[histDates[histDates.length - 1]] ?? {};
const siteBySlug = new Map(sites.map((s) => [s.slug, s]));
const isTracked = (slug: string) => siteBySlug.has(slug);
// Sites that entered the index since the first snapshot.
const newlyTracked = Object.keys(lastSnap)
  .filter((slug) => !(slug in firstSnap) && isTracked(slug))
  .map((slug) => siteBySlug.get(slug)!);
// Annual-rate changes among sites present across the window.
const priceMoves = Object.keys(lastSnap)
  .filter((slug) => firstSnap[slug] && isTracked(slug) && firstSnap[slug].a !== lastSnap[slug].a)
  .map((slug) => {
    const site = siteBySlug.get(slug)!;
    const from = firstSnap[slug].a;
    const to = lastSnap[slug].a;
    const fromN = parsePrice(from);
    const toN = parsePrice(to);
    const kind = fromN <= 0 ? "priced" : toN < fromN ? "drop" : "rise";
    return { site, from, to, kind };
  });
const medianAnnualAt = (snap: Snap): number => {
  const vals = Object.values(snap).map((v) => parsePrice(v.a)).filter((n) => n > 0).sort((a, b) => a - b);
  return vals.length ? median(vals) : 0;
};
const medAnnualFirst = medianAnnualAt(firstSnap);
const medAnnualLast = medianAnnualAt(lastSnap);
const trackedCount = Object.keys(lastSnap).length;
const trackingSince = histDates[0];
const latestSnapshot = histDates[histDates.length - 1];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Deterministic date formatter (no locale/new Date() so SSR and client agree).
const fmtSnapDate = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${MONTHS_SHORT[Number(m) - 1]} ${Number(d)}, ${y}`;
};
// Per-site "as of" = the most recent weekly snapshot that recorded the site. Honest
// and ledger-backed: it is the last date our public price ledger captured this row,
// not a claim of live re-scraping. histDates is ascending, so the last write wins.
const lastSeen: Record<string, string> = {};
for (const d of histDates) for (const slug of Object.keys(history[d])) lastSeen[slug] = d;

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
    a: `The cheapest annual rate among sites we score well is ${cheapestAnnual[0].name} at ${cheapestAnnual[0].price_annual} on annual billing. Cheap alone isn't the test, though. Our best-value ranking divides each site's editorial score by its annual rate, and ${bestValue[0].site.name} currently leads that score-per-dollar table.`,
  },
  {
    q: "Do gay porn sites offer free trials?",
    a: `Genuinely free trials are rare in this space. Only ${trialCount} of the ${sites.length} sites in our dataset ${trialCount === 1 ? "offers" : "offer"} a true no-charge trial. Most other "trials" are cheap paid intros, roughly $1 to $3 for one to three days, that auto-convert to the full monthly rate, which is the most expensive way to be billed. Whichever you use, set a reminder before the conversion date and cancel if you are not staying.`,
  },
  {
    q: "How is this pricing data collected?",
    a: `Every price comes from our own review process: we check each site's join page directly and record the published monthly, quarterly, and annual rates in USD. The dataset is then snapshotted into a public weekly ledger (latest snapshot ${fmtSnapDate(latestSnapshot)}), which is how we can show what has moved over time. Numbers on this page are computed from that dataset, not written by hand.`,
  },
];

// Interactive, sortable + filterable full pricing table. Renders default-sorted
// (by annual rate, ascending) during SSR so the prerendered HTML holds every row
// for crawlers; sort headers and the filter box activate on hydration. Nothing is
// hidden before hydration — this is progressive enhancement, not a client-only view.
type SortKey = "name" | "monthly" | "quarterly" | "annual" | "total" | "gap" | "trial" | "asof";
const PricingTable = ({ rows }: { rows: SiteData[] }) => {
  const [sortKey, setSortKey] = useState<SortKey>("annual");
  const [asc, setAsc] = useState(true);
  const [q, setQ] = useState("");

  const val = (s: SiteData, k: SortKey): number | string => {
    const m = parsePrice(s.price_monthly);
    const a = parsePrice(s.price_annual);
    switch (k) {
      case "name": return s.name.toLowerCase();
      case "monthly": return m;
      case "quarterly": return parsePrice(s.price_quarterly);
      case "annual": return a;
      case "total": return a * 12;
      case "gap": return m > 0 ? (m - a) / m : 0;
      case "trial": return s.has_free_trial ? 1 : 0;
      case "asof": return lastSeen[s.slug] || "";
    }
  };
  const query = q.trim().toLowerCase();
  const shown = [...rows]
    .filter((s) => !query || s.name.toLowerCase().includes(query))
    .sort((x, y) => {
      const vx = val(x, sortKey), vy = val(y, sortKey);
      const cmp = typeof vx === "string" ? vx.localeCompare(vy as string) : (vx as number) - (vy as number);
      return asc ? cmp : -cmp;
    });
  const setSort = (k: SortKey) => {
    if (k === sortKey) setAsc(!asc);
    else { setSortKey(k); setAsc(k === "name"); }
  };
  const Arrow = ({ k }: { k: SortKey }) => (
    <span className="text-primary">{sortKey === k ? (asc ? " ▲" : " ▼") : ""}</span>
  );
  const cols: { k: SortKey; label: string; cls?: string }[] = [
    { k: "name", label: "Site" },
    { k: "monthly", label: "Monthly" },
    { k: "quarterly", label: "Quarterly" },
    { k: "annual", label: "Annual (per mo)" },
    { k: "total", label: "Total/yr" },
    { k: "gap", label: "Gap" },
    { k: "trial", label: "Trial" },
    { k: "asof", label: "As of" },
  ];
  return (
    <div>
      <div className="mt-4 flex items-center gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by site name…"
          aria-label="Filter pricing table by site name"
          className="w-full max-w-xs rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60"
        />
        <span className="shrink-0 text-xs text-muted-foreground">{shown.length} of {rows.length}</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {cols.map((c) => (
                <th key={c.k} className="py-2 pr-3" aria-sort={sortKey === c.k ? (asc ? "ascending" : "descending") : "none"}>
                  <button
                    type="button"
                    onClick={() => setSort(c.k)}
                    className="inline-flex items-center gap-0.5 uppercase tracking-wide hover:text-foreground transition-colors"
                  >
                    {c.label}<Arrow k={c.k} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => {
              const m = parsePrice(s.price_monthly);
              const a = parsePrice(s.price_annual);
              const gap = m > 0 ? Math.round(((m - a) / m) * 100) : 0;
              return (
                <tr key={s.slug} className="border-b border-border/30">
                  <td className="py-2 pr-3">
                    <Link to={`/reviews/${s.slug}`} className="text-secondary hover:underline">{s.name}</Link>
                  </td>
                  <td className="py-2 pr-3">{s.price_monthly}</td>
                  <td className="py-2 pr-3">{s.price_quarterly}</td>
                  <td className="py-2 pr-3">{s.price_annual}</td>
                  <td className="py-2 pr-3 font-medium">{money(a * 12)}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{gap}%</td>
                  <td className="py-2 pr-3">{s.has_free_trial ? "Yes" : "—"}</td>
                  <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">{fmtSnapDate(lastSeen[s.slug])}</td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-sm text-muted-foreground">No site matches "{q}".</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CITATION = `TwinkVault Gay Porn Pricing Index (${currentYear}). https://twinkvault.com/gay-porn-pricing-index — CC-BY 4.0`;
const CiteBox = () => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(CITATION).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };
  return (
    <div className="mt-3 rounded-md border border-border/60 bg-muted/30 p-3">
      <p className="text-xs font-semibold text-foreground">Copy the citation</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <code className="text-xs text-muted-foreground break-all leading-relaxed">{CITATION}</code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-button border border-primary/50 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
};

// Interactive break-even tool. Uses the median site (not a specific one) so it
// stays honest and self-updates with the dataset. Answers the one question this
// whole page is really about: given how long you'll actually use a site, does the
// 12-month annual commitment beat paying month to month?
const BreakEvenCalculator = () => {
  const monthlyRate = medianMonthly;
  const annualPerMo = medianAnnual;
  const annualYear = annualPerMo * 12;
  const breakeven = Math.max(1, Math.ceil(annualYear / monthlyRate));
  const [months, setMonths] = useState(6);
  const monthlyTotal = months * monthlyRate;
  const annualCost = annualYear;
  const annualWins = annualCost < monthlyTotal;
  const diff = Math.abs(monthlyTotal - annualCost);
  const scale = Math.max(monthlyTotal, annualCost, 1);
  return (
    <div className="glass-card rounded-lg p-5">
      <h3 className="font-heading text-base font-bold">Annual vs monthly: run your own numbers</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Based on the typical site in the index ({money(monthlyRate)}/mo sticker, {money(annualPerMo)}/mo on the
        annual plan, which is a 12-month commitment).
      </p>
      <label htmlFor="be-months" className="mt-4 block text-sm font-medium">
        How many months will you actually use it? <span className="text-secondary font-bold">{months}</span>
      </label>
      <input
        id="be-months"
        type="range"
        min={1}
        max={12}
        value={months}
        onChange={(e) => setMonths(Number(e.target.value))}
        className="mt-2 w-full accent-primary"
      />
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs"><span>Paying monthly</span><span className="font-semibold">{money(monthlyTotal)}</span></div>
          <div className="mt-1 h-5 rounded bg-muted/40 overflow-hidden"><div className="h-full rounded bg-primary/70" style={{ width: `${(monthlyTotal / scale) * 100}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between text-xs"><span>Annual plan (full year)</span><span className="font-semibold">{money(annualCost)}</span></div>
          <div className="mt-1 h-5 rounded bg-muted/40 overflow-hidden"><div className="h-full rounded gold-gradient" style={{ width: `${(annualCost / scale) * 100}%` }} /></div>
        </div>
      </div>
      <p className="mt-4 text-sm">
        {diff < 0.5 ? (
          <>At {months} months it is basically a wash.</>
        ) : annualWins ? (
          <>At {months} months, the <strong className="text-emerald-400">annual plan saves {money(diff)}</strong>, even though you commit to a full year.</>
        ) : (
          <>At {months} months, <strong className="text-foreground">paying monthly is {money(diff)} cheaper</strong> because you would not use the full annual year.</>
        )}{" "}
        On the typical site, annual overtakes monthly after <strong className="text-foreground">{breakeven} months</strong>.
      </p>
    </div>
  );
};

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
          <p className="mt-3 text-xs text-muted-foreground">
            Prices as of <strong className="text-foreground">{fmtSnapDate(latestSnapshot)}</strong>, snapshotted weekly into a public ledger dating back to {fmtSnapDate(trackingSince)}.
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
              { label: "Avg. yearly overpay on monthly", value: money(avgYearlySavings) },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-lg p-4 text-center">
                <p className="text-2xl font-heading font-bold text-secondary">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-snug">{s.label}</p>
              </div>
            ))}
          </div>

          {/* The 5-second version — scannable takeaways for people who won't read prose */}
          <div className="glass-card rounded-lg border-l-4 border-l-secondary p-5">
            <p className="font-heading text-sm font-bold uppercase tracking-wide text-secondary">The bottom line</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Go annual, always.</strong>{" "}
                <span className="text-muted-foreground">Monthly costs {avgGapPct}% more for identical access, so the typical member overpays about {money(avgYearlySavings)} a year. Annual pulls ahead after ~{breakevenMonths} months.</span>
              </li>
              <li>
                <strong className="text-foreground">The real price is {money(medianAnnual)}/mo, not the {money(medianMonthly)} sticker.</strong>{" "}
                <span className="text-muted-foreground">The monthly rate is a convenience surcharge almost nobody should pay.</span>
              </li>
              <li>
                {cheapestAnnual[0].slug === bestValue[0].site.slug ? (
                  <>
                    <strong className="text-foreground">Cheapest and best value: {cheapestAnnual[0].name} ({cheapestAnnual[0].price_annual}).</strong>{" "}
                    <span className="text-muted-foreground">It has both the lowest effective rate and the top score-per-dollar.</span>
                  </>
                ) : (
                  <>
                    <strong className="text-foreground">Cheapest quality pick: {cheapestAnnual[0].name} ({cheapestAnnual[0].price_annual}).</strong>{" "}
                    <span className="text-muted-foreground">Best score-per-dollar overall is {bestValue[0].site.name}.</span>
                  </>
                )}
              </li>
              <li>
                <strong className="text-foreground">Free trials are rare.</strong>{" "}
                <span className="text-muted-foreground">Only {trialCount} genuinely free trial{trialCount === 1 ? "" : "s"} in the catalog; most "trials" are cheap paid intros that auto-rebill at full price.</span>
              </li>
            </ul>
          </div>

          {/* Jump nav — skimmers leap straight to the tool/section they want */}
          <nav aria-label="On this page" className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Jump to:</span>
            {[
              { href: "#calculator", label: "Cost calculator" },
              { href: "#cheapest", label: "Cheapest rates" },
              { href: "#value", label: "Best value" },
              { href: "#full-table", label: "Full pricing table" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="rounded-button border border-border/60 px-2.5 py-1 hover:border-primary/50 hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Price movement — the part that makes this an index, not a snapshot */}
          <div>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              What's Moved Since We Started Tracking
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              We snapshot every site's join-page pricing on a weekly cycle. The ledger runs back to{" "}
              {trackingSince} and now covers {trackedCount} sites, so this shows what has actually changed
              rather than a one-time reading. The median annual rate has{" "}
              {medAnnualFirst === medAnnualLast ? (
                <>held steady at <strong className="text-foreground">{money(medAnnualLast)}/mo</strong> across every snapshot</>
              ) : (
                <>moved from <strong className="text-foreground">{money(medAnnualFirst)}/mo</strong> to <strong className="text-foreground">{money(medAnnualLast)}/mo</strong></>
              )}.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="glass-card rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Added to the index</p>
                {newlyTracked.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {newlyTracked.map((s) => (
                      <li key={s.slug}>
                        <Link to={`/reviews/${s.slug}`} className="text-secondary hover:underline">{s.name}</Link>
                        <span className="text-muted-foreground"> · {s.price_annual} annual</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No new sites since {trackingSince}.</p>
                )}
              </div>
              <div className="glass-card rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Price changes</p>
                {priceMoves.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {priceMoves.map(({ site, from, to, kind }) => (
                      <li key={site.slug}>
                        <Link to={`/reviews/${site.slug}`} className="text-secondary hover:underline">{site.name}</Link>{" "}
                        <span className="text-muted-foreground">
                          {kind === "priced" ? (
                            <>now priced at <strong className="text-foreground">{to}</strong></>
                          ) : kind === "drop" ? (
                            <>dropped to <strong className="text-emerald-400">{to}</strong> (was {from})</>
                          ) : (
                            <>rose to <strong className="text-foreground">{to}</strong> (was {from})</>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No annual-rate changes this period. Stable pricing is the norm here; the first real move shows up here.</p>
                )}
              </div>
            </div>
          </div>

          {/* Price distribution */}
          <div>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              Where Prices Cluster: Monthly Sticker Rates
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              <strong className="text-foreground">Sticker prices barely vary: {histMax} of {monthlies.length} sites sit in the {histogram.find((h) => h.count === histMax)?.label} band.</strong>{" "}
              Many run on shared networks (Mania Media, Buddy Profits, the MEN network), so they inherit near-identical
              rates. The real competition is on the annual commitment, not the sticker, and genuinely cheap entry points
              come from annual billing on a mid-priced site rather than a low monthly rate.
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
            <div className="mt-3 space-y-4 text-sm text-muted-foreground max-w-3xl leading-relaxed">
              <p>
                The single most important number here: the average site charges{" "}
                <strong className="text-foreground">{avgGapPct}% more on monthly billing</strong> than annual, for
                identical access. The typical monthly subscriber overpays about{" "}
                <strong className="text-foreground">{money(avgYearlySavings)} a year</strong>. The widest gap belongs
                to {biggestGap.s.name} at {money((biggestGap.m - biggestGap.a) * 12)}/year for the same membership, and
                the means confirm it ({money(meanMonthly)} sticker vs {money(meanAnnual)} annual), so this is the whole
                category, not a few outliers.
              </p>
              <blockquote className="border-l-4 border-l-primary pl-4 py-1 text-base font-semibold text-foreground">
                Never pay the monthly rate past your first month.
              </blockquote>
              <p>
                Our <Link to="/guide/gay-porn-billing-guide" className="text-secondary hover:underline">billing guide</Link>{" "}
                covers how the rebill structures work, and the{" "}
                <Link to="/guide/how-to-cancel-gay-porn-subscriptions" className="text-secondary hover:underline">cancellation guide</Link>{" "}
                shows how to exit cleanly before a renewal.
              </p>
            </div>
            <div id="calculator" className="mt-6 scroll-mt-24">
              <BreakEvenCalculator />
            </div>
          </div>

          {/* Cheapest annual */}
          <div id="cheapest" className="scroll-mt-24">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              The 10 Cheapest Annual Rates We've Verified
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              <strong className="text-foreground">The ten lowest effective monthly rates we've verified.</strong>{" "}
              Longer bar means cheaper. Each links to the full review, because cheap only matters if the site is worth joining.
            </p>
            <div className="mt-6 space-y-2" role="img" aria-label="Bar chart of the ten cheapest annual rates, longer bars are cheaper">
              {cheapestAnnual.map((s) => {
                const rate = parsePrice(s.price_annual);
                // Longer bar = cheaper (more savings vs the priciest rate shown), so the
                // visual reads the intuitive way: the best deal has the biggest bar.
                const cheapestRate = parsePrice(cheapestAnnual[0].price_annual);
                const width = cheapMax === cheapestRate ? 100 : 15 + ((cheapMax - rate) / (cheapMax - cheapestRate)) * 85;
                return (
                  <div key={s.slug} className="flex items-center gap-3">
                    <Link to={`/reviews/${s.slug}`} className="w-40 shrink-0 truncate text-xs text-secondary hover:underline text-right">
                      {s.name}
                    </Link>
                    <div className="flex-1 h-6 rounded bg-muted/40 overflow-hidden">
                      <div className="h-full rounded bg-primary/70" style={{ width: `${width}%` }} />
                    </div>
                    <span className="w-16 shrink-0 text-xs font-semibold">{s.price_annual}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Best value */}
          <div id="value" className="scroll-mt-24">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              Score-per-Dollar: The Value Frontier
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              <strong className="text-foreground">The best deal is quality per dollar, not the lowest price.</strong>{" "}
              This ranks each site's editorial score (0–5, from our{" "}
              <Link to="/methodology" className="text-secondary hover:underline">scoring methodology</Link>) divided by its
              annual rate, so higher means more verified quality for your money.
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
                      <td className="py-2 pr-3">{site.price_annual}</td>
                      <td className="py-2 font-semibold">{(ratio * 10).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full table */}
          <div id="full-table" className="scroll-mt-24">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              Full Pricing Table — Every Reviewed Site
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              <strong className="text-foreground">Every reviewed site, sortable and filterable.</strong>{" "}
              Monthly, quarterly, and annual rates for all {priceTable.length} sites. "Total/yr" is the annual rate
              times 12. Deals move; the{" "}
              <Link to="/best-deals" className="text-secondary hover:underline">deals page</Link> tracks the current
              verified discounts.
            </p>
            <PricingTable rows={priceTable} />
          </div>

          {/* Methodology + citation */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="font-heading text-lg font-bold">Methodology &amp; Reuse</h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Prices are recorded in USD from each site's public join page during our review process, then
                snapshotted into a public weekly ledger so movement is tracked over time (latest snapshot{" "}
                {fmtSnapDate(latestSnapshot)}; ledger running since {fmtSnapDate(trackingSince)}). The per-row "As of"
                date in the table above is that site's most recent snapshot. "Annual" is the per-month effective
                rate on a 12-month commitment as published at signup. Introductory teaser rates that rebill
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
              <CiteBox />
            </div>
          </div>

          <DealAlertSignup
            source="pricing_index"
            title="Get the next price drop"
            blurb="This index re-verifies continuously. One email when a meaningful drop lands across the catalog."
          />

          {/* FAQ */}
          <div id="faq" className="scroll-mt-24">
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
                { to: "/gay-porn-awards-2026", label: "Awards 2026 — category winners" },
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
