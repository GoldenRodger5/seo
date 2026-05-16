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
import { PageTransition } from "../components/MotionWrappers";
import { currentYear, currentMonthLong } from "../lib/dates";
import { parseMonthlyPrice } from "../lib/dealMath";
import { supabase } from "../integrations/supabase/client";
import HeroDealCard, { type HeroBadge } from "../components/HeroDealCard";
import { getVerificationDisplay } from "../lib/dealVerification";
import { trackEvent } from "../lib/analytics";
import LocalisedPrice from "../components/LocalisedPrice";

// ─────────────────────────────────────────────────────────────────────────────
// Filter + sort state machinery (unchanged — pills still apply to the list)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Compact category tag derived from the site's metadata. */
function categoryTag(site: SiteData): string {
  const c = site.categories;
  if (c.includes("amateur-twinks")) return "Amateur";
  if (c.includes("premium-studios") && c.includes("best-value")) return "Network";
  if (c.includes("premium-studios")) return "Premium";
  if (c.includes("best-value")) return "Network";
  const first = c[0] ?? "";
  return first.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()) || "Site";
}

// ─────────────────────────────────────────────────────────────────────────────
// DealsEmailCapture (kept as-is from prior sprint)
// ─────────────────────────────────────────────────────────────────────────────

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
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "submitting" || status === "ok"}
            className="flex-1 rounded-button bg-muted/30 border border-border px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-primary/50"
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

// ─────────────────────────────────────────────────────────────────────────────
// Compact list-row for the "All active deals" tier
// ─────────────────────────────────────────────────────────────────────────────

const DealListRow = ({ site }: { site: SiteData }) => {
  const verification = getVerificationDisplay(site.deal_last_verified);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 transition-transform hover:-translate-y-px">
      {/* Discount badge */}
      <span className="rounded-button bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-400 tabular-nums shrink-0">
        −{site.deal_discount}%
      </span>

      {/* Name + score + tag */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/reviews/${site.slug}`}
          className="font-medium hover:text-secondary transition-colors truncate block"
        >
          {site.name}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <LocalisedPrice usd={site.price_annual} className="tabular-nums" />
          <span className="text-muted-foreground/40">·</span>
          <span className="text-secondary font-semibold tabular-nums">{site.overall_score}/5</span>
          <span className="hidden sm:inline text-muted-foreground/40">·</span>
          <span className="hidden sm:inline">{categoryTag(site)}</span>
        </div>
      </div>

      {/* Verification (right-aligned, muted) — only when within 30 days */}
      {verification.show && (
        <span className={`hidden md:inline text-[11px] ${verification.caveat ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
          {verification.text}
        </span>
      )}

      <OutboundLink
        site={site}
        ctaPosition="card"
        sourceTypeOverride="best_deals_list_row"
        className="cta-btn gold-gradient inline-flex items-center rounded-button px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground shrink-0"
      >
        Visit Site
      </OutboundLink>
    </li>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

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

  // Affiliated-only base pool: /best-deals is a conversion surface.
  // Unaffiliated sites with deals are excluded entirely (they reappear
  // automatically the moment affiliate_url is set in sites.ts).
  const affiliatedDeals = useMemo(
    () => sites.filter((s) => s.deal_discount > 0 && isAffiliated(s)),
    [],
  );

  // Three visual-anchor picks. Stable across filter/sort changes so the
  // hero tier is always the same three sites; the list tier below is
  // what visitors actually filter and sort.
  const heroPicks = useMemo<{ site: SiteData; badge: HeroBadge }[]>(() => {
    if (affiliatedDeals.length === 0) return [];
    const byScore = [...affiliatedDeals].sort((a, b) => b.overall_score - a.overall_score);
    const byDiscount = [...affiliatedDeals].sort((a, b) => b.deal_discount - a.deal_discount);
    const editor = byScore[0]?.slug;
    const savings = byDiscount.find((s) => s.slug !== editor)?.slug;
    // "Most popular" — fallback to 2nd-highest score not already taken.
    // TODO: replace with clicks-table-driven popularity once Phase 4 data accumulates.
    const popular = byScore.find((s) => s.slug !== editor && s.slug !== savings)?.slug;
    const picks: { site: SiteData; badge: HeroBadge }[] = [];
    const findSite = (slug: string | undefined) => slug ? affiliatedDeals.find((s) => s.slug === slug) : undefined;
    const editorSite = findSite(editor);
    const savingsSite = findSite(savings);
    const popularSite = findSite(popular);
    if (editorSite) picks.push({ site: editorSite, badge: "editor" });
    if (savingsSite) picks.push({ site: savingsSite, badge: "savings" });
    if (popularSite) picks.push({ site: popularSite, badge: "popular" });
    return picks;
  }, [affiliatedDeals]);

  // List tier: filtered + sorted, EXCLUDING the 3 hero picks (no duplicates).
  const listDeals = useMemo(() => {
    const heroSlugs = new Set(heroPicks.map((p) => p.site.slug));
    let result = affiliatedDeals.filter((s) => !heroSlugs.has(s.slug));
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
  }, [affiliatedDeals, heroPicks, filterKey, sortKey]);

  const totalDeals = heroPicks.length + listDeals.length;
  const title = `Active gay porn deals, ${currentMonthLong} ${currentYear}`;
  const description = `Checked ${currentMonthLong} ${currentYear}. ${totalDeals} active deals on tested sites. Discounts apply automatically through the visit link — no manual codes needed.`;

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{`${title} | TwinkVault`}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href="https://twinkvault.com/best-deals" />
          <meta property="og:title" content={`${title} | TwinkVault`} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content="https://twinkvault.com/best-deals" />
        </Helmet>

        <section className="pt-10 pb-6">
          <div className="container max-w-5xl">
            <Breadcrumbs
              className="mb-6"
              items={[{ label: "Home", to: "/" }, { label: "Best Deals" }]}
            />
            <motion.h1
              className="font-heading font-bold heading-gradient inline-block"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {title}
            </motion.h1>
            <motion.p
              className="mt-3 max-w-2xl text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {description}
            </motion.p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Sorted by editorial pick first, then by discount size.
            </p>
          </div>
        </section>

        {/* Featured deals — hero tier */}
        {heroPicks.length > 0 && (
          <section className="border-t border-border/40 pt-10 pb-6">
            <div className="container max-w-5xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary mb-5">
                Featured deals
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {heroPicks.map(({ site, badge }) => (
                  <HeroDealCard
                    key={site.slug}
                    site={site}
                    badge={badge}
                    categoryTag={categoryTag(site)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filter + sort bar */}
        <section className="border-y border-border bg-card/40 sticky top-16 z-20">
          <div className="container max-w-5xl py-3">
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

        {/* All active deals — compact list tier */}
        <section className="pt-8 pb-16">
          <div className="container max-w-5xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary mb-4">
              All active deals
            </p>
            {listDeals.length === 0 ? (
              <p className="text-muted-foreground py-8">
                No deals match this filter.{" "}
                <button onClick={() => setFilter("all")} className="text-primary hover:underline">
                  Clear filter
                </button>
              </p>
            ) : (
              <ul className="divide-y divide-border/60 border-y border-border/60">
                {listDeals.map((site) => (
                  <DealListRow key={site.slug} site={site} />
                ))}
              </ul>
            )}

            <p className="mt-10 text-xs text-muted-foreground">
              Don't see a deal? Some sites don't run regular promotions — the full review pages always list current pricing.{" "}
              <Link to="/reviews" className="text-secondary hover:underline underline-offset-4">
                Browse all reviews →
              </Link>
            </p>

            <div className="mt-12">
              <DealsEmailCapture />
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default BestDeals;
