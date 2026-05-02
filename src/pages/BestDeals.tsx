import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import OutboundLink from "../components/OutboundLink";
import { ArrowRight, Filter } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import Breadcrumbs from "../components/Breadcrumbs";
import { sites, isAffiliated } from "../data/sites";
import type { SiteData } from "../data/sites";
import { StaggerContainer, StaggerChild, MotionButton, PageTransition } from "../components/MotionWrappers";
import { currentYear, lastCheckedDate } from "../lib/dates";
import { parseMonthlyPrice, formatTotalAnnual, computeSavings } from "../lib/dealMath";
import { supabase } from "../integrations/supabase/client";
import CountdownTimer from "../components/CountdownTimer";
import VerifiedBadge from "../components/VerifiedBadge";
import { trackEvent } from "../lib/analytics";
import LocalisedPrice from "../components/LocalisedPrice";

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

const computeDealStatus = (site: SiteData): StatusInfo => {
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

  // No real expires_at — be honest, no fake urgency.
  if (site.deal_type === "flash") return { label: "Flash deal", tone: "destructive" };
  if (site.deal_type === "limited") return { label: "Limited time", tone: "secondary" };
  return { label: "Always available", tone: "ongoing" };
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

const DealCard = ({ site }: { site: SiteData }) => {
  const status = computeDealStatus(site);
  const annualTotal = formatTotalAnnual(site.price_annual);
  const savings = computeSavings(site.price_monthly, site.price_annual);

  return (
    <motion.div
      className="glass-card rounded-lg p-6 flex flex-col"
      whileHover={{ y: -3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl font-bold truncate">{site.name}</h2>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {status.countdownTo ? (
              <span className="inline-flex items-center gap-1.5 rounded-button bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                <CountdownTimer expiresAt={status.countdownTo} className="!font-semibold" />
              </span>
            ) : (
              <StatusPill tone={status.tone} label={status.label} />
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

      {/* Pricing block */}
      <div className="mt-4 rounded-lg border border-border/40 bg-muted/20 p-3">
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
      <div className="mt-4">
        <OutboundLink
          site={site}
          className={`cta-btn flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground ${!isAffiliated(site) ? "opacity-85" : ""}`}
        >
          Claim Deal <ArrowRight size={14} />
        </OutboundLink>
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
    let result = sites.filter((s) => s.deal_discount > 0);
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

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{`Best Gay Twink Site Deals & Discounts ${currentYear} — Up to 70% Off | TwinkVault`}</title>
          <meta name="description" content={`Every active discount on premium gay twink sites in one place. Real prices, total cost shown upfront, free trials marked. Updated weekly.`} />
          <link rel="canonical" href="https://twinkvault.com/best-deals" />
          <meta property="og:title" content={`Best Gay Twink Site Deals ${currentYear} — Up to 70% Off`} />
          <meta property="og:description" content="Every active discount in one place. Real prices, total cost shown upfront, free trials marked." />
          <meta property="og:url" content="https://twinkvault.com/best-deals" />
        </Helmet>

        <section className="hero-mesh py-14">
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
              className="mx-auto mt-4 max-w-2xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Annual plans, flash sales, and trial offers — verified pricing, total annual cost shown, dead links removed within 24 hours.
            </motion.p>
            <div className="mt-3 flex justify-center">
              <VerifiedBadge />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 rounded-button bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                Last updated: {lastCheckedDate}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">Verified weekly</span>
            </div>
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

        {/* Email capture */}
        <section className="py-6">
          <div className="container">
            <DealsEmailCapture />
          </div>
        </section>

        {/* Deals grid */}
        <section className="pb-16">
          <div className="container">
            {dealSites.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No deals match this filter. <button onClick={() => setFilter("all")} className="text-primary hover:underline">Clear filter</button>
              </p>
            ) : (
              <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dealSites.map((site) => (
                  <StaggerChild key={site.slug}>
                    <DealCard site={site} />
                  </StaggerChild>
                ))}
              </StaggerContainer>
            )}

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
