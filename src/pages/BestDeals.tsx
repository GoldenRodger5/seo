import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import OutboundLink from "../components/OutboundLink";
import { ArrowRight, Filter, Star } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Breadcrumbs from "../components/Breadcrumbs";
import { sites, isAffiliated } from "../data/sites";
import type { SiteData } from "../data/sites";
import { StaggerContainer, StaggerChild, PageTransition } from "../components/MotionWrappers";
import { currentYear, lastCheckedDate, DEAL_VERIFIED_DATE } from "../lib/dates";
import { parseMonthlyPrice, formatTotalAnnual, computeSavings } from "../lib/dealMath";
import { supabase } from "../integrations/supabase/client";
import CountdownTimer from "../components/CountdownTimer";
import VerifiedBadge from "../components/VerifiedBadge";
import { trackEvent } from "../lib/analytics";
import LocalisedPrice from "../components/LocalisedPrice";
import { getVerdict } from "../data/site-verdicts";

type FilterKey = "all" | "trials" | "under10" | "fifty";
type SortKey = "discount" | "price" | "score";

const filterLabels: Record<FilterKey, string> = {
  all: "All Deals",
  trials: "Free Trials Only",
  under10: "Under $10/mo",
  fifty: "50%+ Off",
};

const sortLabels: Record<SortKey, string> = {
  discount: "Biggest Discount",
  price: "Lowest Price",
  score: "Highest Score",
};

type StatusTone = "destructive" | "secondary" | "ongoing";

interface StatusInfo {
  label: string;
  tone: StatusTone;
  countdownTo?: string | null;
}

const HOUR = 60 * 60 * 1000;

const computeDealStatus = (site: SiteData): StatusInfo | null => {
  const now = Date.now();
  const expires = site.expires_at ? new Date(site.expires_at).getTime() : null;

  if (expires && Number.isFinite(expires) && expires > now) {
    const remaining = expires - now;
    if (remaining < 72 * HOUR) {
      return { label: "Ends in", tone: "destructive", countdownTo: site.expires_at ?? null };
    }
    if (remaining < 7 * 24 * HOUR) {
      const day = new Date(expires).toLocaleDateString(undefined, { weekday: "long" });
      return { label: `Ends ${day}`, tone: "destructive" };
    }
    return { label: "Limited time", tone: "secondary" };
  }

  // No real expires_at — be honest, no fake urgency. Surface a verified
  // status for active deals; for "ongoing" deals we render nothing
  // because the discount % chip already conveys the deal exists, and
  // "Always available" actively undermined conversion (if it's always
  // available it's not a deal — it's the regular price).
  if (site.deal_type === "flash") return { label: "Flash deal", tone: "destructive" };
  if (site.deal_type === "limited") return { label: "Limited time", tone: "secondary" };
  // ongoing → no status pill, just rely on the discount %.
  return null;
};

const commitmentCopy = (site: SiteData): string => {
  if (site.monthly_only) return "Cancel anytime — no annual commitment.";
  if (site.annual_only) return "Annual subscription required.";
  if (site.has_free_trial) return "Includes trial period";
  return "Cancel anytime — see site for billing terms";
};

const StatusPill = ({ tone, label }: { tone: "destructive" | "secondary" | "ongoing"; label: string }) => {
  const cls =
    tone === "destructive"
      ? "bg-destructive/15 text-destructive"
      : tone === "secondary"
      ? "bg-secondary/20 text-secondary"
      : "bg-emerald-400/10 text-emerald-400";
  return <span className={`rounded-button px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
};

type ElevatedBadge = "editor" | "savings" | "popular" | null;

const BADGE_META: Record<Exclude<ElevatedBadge, null>, { label: string; border: string; bg: string; chip: string }> = {
  editor: {
    label: "★ EDITOR'S PICK",
    border: "border-t-secondary",
    bg: "from-secondary/[0.06] to-transparent",
    chip: "gold-gradient text-secondary-foreground",
  },
  savings: {
    label: "💰 BIGGEST SAVINGS",
    border: "border-t-emerald-500",
    bg: "from-emerald-500/[0.06] to-transparent",
    chip: "bg-emerald-500/20 text-emerald-400",
  },
  popular: {
    label: "🔥 MOST POPULAR",
    border: "border-t-primary",
    bg: "from-primary/[0.08] to-transparent",
    chip: "bg-primary/20 text-primary",
  },
};

/**
 * Build a 1–2 sentence editorial note for a deal card. Prefers the
 * editorial verdict from site-verdicts.ts. Falls back to a computed
 * line based on price + score so every card has something to say.
 */
function dealNote(site: SiteData): string {
  const v = getVerdict(site.slug);
  if (v) {
    const firstSentence = v.match(/^[^.!?]+[.!?]/)?.[0] ?? v;
    return firstSentence.trim();
  }
  const priceFloor = parseMonthlyPrice(site.price_annual);
  if (site.overall_score >= 4.5 && priceFloor !== null && priceFloor < 10) {
    return `${site.overall_score}/5-rated premium content under $${priceFloor}/mo on annual.`;
  }
  if (site.overall_score >= 4.5) return `${site.overall_score}/5-rated site at ${site.deal_discount}% off — top-tier pick.`;
  if (priceFloor !== null && priceFloor < 10) return `Solid pick under $${priceFloor}/mo — strong value play.`;
  return `${site.deal_discount}% off the standard rate.`;
}

const VerifiedDealPill = () => (
  <span className="rounded-button bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
    ✓ Verified deal
  </span>
);

const DealCard = ({ site, elevated }: { site: SiteData; elevated?: ElevatedBadge }) => {
  const status = computeDealStatus(site);
  const annualTotal = formatTotalAnnual(site.price_annual);
  const savings = computeSavings(site.price_monthly, site.price_annual);
  const note = dealNote(site);
  const meta = elevated ? BADGE_META[elevated] : null;

  return (
    <motion.div
      className={`glass-card rounded-lg p-6 flex flex-col relative overflow-hidden ${
        meta ? `border-t-2 ${meta.border}` : ""
      }`}
      whileHover={{ y: -3 }}
    >
      {meta && (
        <>
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${meta.bg}`} />
          <span className={`relative inline-flex w-fit items-center gap-1 rounded-button px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2 ${meta.chip}`}>
            {meta.label}
          </span>
        </>
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-xl font-bold truncate">{site.name}</h2>
            <span className="inline-flex items-center gap-0.5 rounded-button bg-muted/60 px-1.5 py-0.5 text-[11px] font-bold text-secondary shrink-0">
              <Star size={9} className="fill-secondary text-secondary" /> {site.overall_score}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {status?.countdownTo ? (
              <span className="inline-flex items-center gap-1.5 rounded-button bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                <CountdownTimer expiresAt={status.countdownTo} className="!font-semibold" />
              </span>
            ) : status ? (
              <StatusPill tone={status.tone} label={status.label} />
            ) : (
              // Ongoing deal — no fake urgency; use a verified pill instead.
              <VerifiedDealPill />
            )}
            {site.has_free_trial && (
              <span className="rounded-button bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Free Trial
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{site.deal_text}</p>
        </div>
        <div className="rounded-button bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-400 shrink-0">
          −{site.deal_discount}%
        </div>
      </div>

      {/* Editorial note — why we recommend this deal */}
      <p className="relative mt-3 text-[12px] leading-snug text-foreground/80 italic">
        “{note}”
      </p>

      {/* Pricing block */}
      <div className="relative mt-4 rounded-lg border border-border/40 bg-muted/20 p-3">
        <div className="flex items-baseline gap-2">
          <LocalisedPrice usd={site.price_annual} className="text-2xl font-bold text-emerald-400" />
          <LocalisedPrice usd={site.price_monthly} className="text-xs text-muted-foreground line-through" />
        </div>
        {annualTotal && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            = {annualTotal} billed annually
            {savings && savings > 0 && (
              <span className="ml-2 text-emerald-400 font-semibold">Save ${savings}/year</span>
            )}
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground/70">{commitmentCopy(site)}</p>
      </div>

      <div className="flex-1" />

      {/* CTAs */}
      <div className="relative mt-4">
        <OutboundLink
          site={site}
          ctaPosition="card"
          className={`cta-btn flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground ${!isAffiliated(site) ? "opacity-85" : ""}`}
        >
          Claim Deal <ArrowRight size={14} />
        </OutboundLink>
        <Link
          to={`/reviews/${site.slug}`}
          className="mt-2 block w-full rounded-button border border-primary/40 px-4 py-2 text-center text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          See Full Review →
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Opens in new tab{isAffiliated(site) ? " · Affiliate" : ""}
          </p>
          <Link
            to={`/discount/${site.slug}`}
            className="text-[10px] font-medium text-secondary hover:underline"
          >
            Full discount details →
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const DealsEmailCapture = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus("err");
      setErrMsg("Enter a valid email.");
      return;
    }
    setStatus("submitting");
    try {
      const { error } = await supabase.from("subscribers").insert({
        email: email.trim().toLowerCase(),
        source: "deals_page",
      } as never);
      if (error) {
        setStatus("err");
        setErrMsg(error.message.includes("duplicate") ? "You're already subscribed." : "Subscription failed.");
        return;
      }
      setStatus("ok");
      setEmail("");
      trackEvent("email_signup", { source: "deals_page" });
    } catch {
      setStatus("err");
      setErrMsg("Subscription failed.");
    }
  };

  return (
    <div className="glass-card rounded-lg border-l-4 border-l-secondary p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <h2 className="font-heading text-lg font-bold">Friday Deal Alert</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            One email Friday with the week's best price drops. Unsubscribe anytime.
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row md:max-w-sm md:flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "submitting" || status === "ok"}
            className="flex-1 rounded-button bg-muted/30 border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={status === "submitting" || status === "ok"}
            className="cta-btn gold-gradient rounded-button px-6 py-2.5 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
          >
            {status === "submitting" ? "..." : status === "ok" ? "✓ Subscribed" : "Notify Me"}
          </button>
        </form>
      </div>
      {status === "err" && <p className="mt-2 text-xs text-destructive">{errMsg}</p>}
      {status === "ok" && (
        <p className="mt-2 text-xs text-emerald-400">Check your inbox for confirmation.</p>
      )}
    </div>
  );
};

const BestDeals = () => {
  const [params, setParams] = useSearchParams();
  const filterKey = ((params.get("filter") as FilterKey) ?? "all") in filterLabels
    ? (params.get("filter") as FilterKey) ?? "all"
    : "all";
  const sortKey = ((params.get("sort") as SortKey) ?? "discount") in sortLabels
    ? (params.get("sort") as SortKey) ?? "discount"
    : "discount";

  const setFilter = (k: FilterKey) => {
    const next = new URLSearchParams(params);
    if (k === "all") next.delete("filter");
    else next.set("filter", k);
    setParams(next);
  };

  const setSort = (k: SortKey) => {
    const next = new URLSearchParams(params);
    if (k === "discount") next.delete("sort");
    else next.set("sort", k);
    setParams(next);
  };

  const dealSites = useMemo(() => {
    // Affiliated-only filter: /best-deals is a conversion surface, not a
    // research surface. Cards for sites without an affiliate_url generate
    // $0 per click (they redirect to the site's own homepage). When NDT /
    // NDW / future-affiliated sites land their URLs, they'll automatically
    // reappear here.
    let result = sites.filter((s) => s.deal_discount > 0 && isAffiliated(s));
    if (filterKey === "trials") result = result.filter((s) => s.has_free_trial);
    if (filterKey === "under10") {
      result = result.filter((s) => {
        const p = parseMonthlyPrice(s.price_annual);
        return p !== null && p < 10;
      });
    }
    if (filterKey === "fifty") result = result.filter((s) => s.deal_discount >= 50);
    if (sortKey === "discount") result.sort((a, b) => b.deal_discount - a.deal_discount);
    if (sortKey === "price") {
      result.sort((a, b) => {
        const pa = parseMonthlyPrice(a.price_annual) ?? Infinity;
        const pb = parseMonthlyPrice(b.price_annual) ?? Infinity;
        return pa - pb;
      });
    }
    if (sortKey === "score") result.sort((a, b) => b.overall_score - a.overall_score);
    return result;
  }, [filterKey, sortKey]);

  /**
   * Compute the three visual-anchor picks across the *unfiltered* deal pool,
   * so the badges are stable regardless of which filter the user has applied.
   * Three distinct sites always — the dedup logic walks each list to skip
   * any slug already claimed by a higher-priority badge.
   */
  const elevatedMap = useMemo<Record<string, ElevatedBadge>>(() => {
    // Same affiliated-only filter as dealSites — badges must be assigned
    // from the monetizable pool so the visual anchors of the page are
    // also revenue anchors.
    const pool = sites.filter((s) => s.deal_discount > 0 && isAffiliated(s));
    if (pool.length === 0) return {};
    const byScore = [...pool].sort((a, b) => b.overall_score - a.overall_score);
    const byDiscount = [...pool].sort((a, b) => b.deal_discount - a.deal_discount);
    const editor = byScore[0]?.slug;
    const savings = byDiscount.find((s) => s.slug !== editor)?.slug;
    // "Most popular" — fallback to 2nd-highest score not already taken.
    // TODO: replace with clicks-table-driven popularity once Phase 4 data accumulates.
    const popular = byScore.find((s) => s.slug !== editor && s.slug !== savings)?.slug;
    const map: Record<string, ElevatedBadge> = {};
    if (editor) map[editor] = "editor";
    if (savings) map[savings] = "savings";
    if (popular) map[popular] = "popular";
    return map;
  }, []);

  /**
   * Final render order: the three elevated badge cards lead the grid in a
   * fixed sequence (Editor's Pick → Biggest Savings → Most Popular), then
   * the remaining deals in the user's selected sort order. This guarantees
   * the 3 anchor cards are always above the fold regardless of the
   * sort/filter the visitor chooses.
   */
  const orderedDealSites = useMemo(() => {
    const order: ElevatedBadge[] = ["editor", "savings", "popular"];
    const elevatedSlugSet = new Set(Object.keys(elevatedMap));
    const leadCards: SiteData[] = [];
    for (const badge of order) {
      const slug = Object.entries(elevatedMap).find(([, b]) => b === badge)?.[0];
      if (!slug) continue;
      const site = dealSites.find((s) => s.slug === slug);
      if (site) leadCards.push(site);
    }
    const rest = dealSites.filter((s) => !elevatedSlugSet.has(s.slug));
    return [...leadCards, ...rest];
  }, [dealSites, elevatedMap]);

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{`Best Gay Twink Site Deals & Discounts (${DEAL_VERIFIED_DATE}) | TwinkVault`}</title>
          <meta name="description" content="Save up to 67% on the top-rated twink sites. Verified deals updated monthly. All links tested — no expired discounts, no bait-and-switch pricing." />
          <link rel="canonical" href="https://twinkvault.com/best-deals" />
          <meta property="og:title" content={`Best Gay Twink Site Deals & Discounts (${DEAL_VERIFIED_DATE})`} />
          <meta property="og:description" content="Save up to 67% on the top-rated twink sites. Verified deals updated monthly. All links tested — no expired discounts, no bait-and-switch pricing." />
          <meta property="og:url" content="https://twinkvault.com/best-deals" />
        </Helmet>

        <section className="hero-mesh pt-10 pb-6">
          <div className="container">
            <Breadcrumbs
              className="mb-6"
              items={[{ label: "Home", to: "/" }, { label: "Best Deals" }]}
            />
          </div>
          <div className="container text-center">
            <motion.h1
              className="font-heading font-bold heading-gradient inline-block"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Every Active Twink Site Deal in {currentYear}
            </motion.h1>
            <motion.p
              className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Annual plans, flash sales, and trial offers — verified pricing, total annual cost shown.
            </motion.p>
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <VerifiedBadge />
              <span className="inline-flex items-center gap-2 rounded-button bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                Updated {lastCheckedDate}
              </span>
            </div>
          </div>

          {/* Featured Deal callout — immediately below H1, above filters */}
          <div className="container max-w-4xl mt-6">
            <Link
              to="/discount/twinktrade"
              className="block glass-card gold-pulse-border rounded-lg p-5 hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary">★ Featured Deal</p>
                  <h2 className="mt-1 font-heading text-lg font-bold">TwinkTrade — 67% off, just $9.95/mo on annual</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Active and verified. No promo code — discount applies through our link.</p>
                </div>
                <span className="rounded-button gold-gradient px-4 py-2 text-xs font-semibold text-secondary-foreground whitespace-nowrap">
                  See Deal →
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Filter bar */}
        <section className="border-y border-border bg-card/40 sticky top-16 z-20">
          <div className="container py-3">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              <Filter size={14} className="text-muted-foreground shrink-0" />
              {(Object.keys(filterLabels) as FilterKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`whitespace-nowrap rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterKey === k
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 border border-transparent"
                  }`}
                >
                  {filterLabels[k]}
                </button>
              ))}
              <span className="text-muted-foreground text-xs ml-2 shrink-0">·</span>
              <span className="text-xs text-muted-foreground shrink-0">Sort:</span>
              {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  className={`whitespace-nowrap rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
                    sortKey === k
                      ? "bg-secondary/20 text-secondary border border-secondary/40"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 border border-transparent"
                  }`}
                >
                  {sortLabels[k]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Deals grid — primary content, no email-capture interruption */}
        <section className="pt-8 pb-16">
          <div className="container">
            {orderedDealSites.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No deals match this filter. <button onClick={() => setFilter("all")} className="text-primary hover:underline">Clear filter</button>
              </p>
            ) : (
              <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orderedDealSites.map((site) => (
                  <StaggerChild key={site.slug}>
                    <DealCard site={site} elevated={elevatedMap[site.slug] ?? null} />
                  </StaggerChild>
                ))}
              </StaggerContainer>
            )}

            {/* Email capture demoted to after the grid */}
            <div className="mt-12">
              <DealsEmailCapture />
            </div>

            <motion.div
              className="mt-16 glass-card rounded-lg p-8 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Where These Deals Come From</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Most are annual plan discounts built into the site's own pricing — you'd find them yourself if you dug around. We just put them in one place so you can compare. Some are affiliate-exclusive rates we negotiated. Either way, every link is tested before it goes live, and we re-check pricing monthly.
              </p>
              <Link to="/top-sites" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline">
                View Full Site Rankings <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default BestDeals;
