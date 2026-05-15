import { Link } from "react-router-dom";
import OutboundLink from "@/components/OutboundLink";
import { Star, ArrowRight, Sparkles, Flame, Film, DollarSign, Play, Gift, Smartphone, Search, ShieldCheck, RefreshCw } from "lucide-react";
import { CRAK_URL, trackCrakClick, MANFINDER_URL, trackManfinderClick } from "@/lib/crak";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import StarRating from "../components/StarRating";
import SocialProofStrip from "../components/SocialProofStrip";
import InlineEmailCapture from "../components/InlineEmailCapture";
import BentoGrid from "../components/BentoGrid";
import BrandStory from "../components/BrandStory";
import SitePlaceholderImage from "../components/SitePlaceholderImage";
import VisitSiteButton from "../components/VisitSiteButton";
import Layout from "../components/Layout";
import { sites, getVisitUrl, isAffiliated, getTopRatedPromotable, getTopRatedAffiliated, getRecentlyUpdatedPromotable, getTopDealPick } from "../data/sites";
import { rankComparePairs } from "../lib/compareRanking";
import { StaggerContainer, StaggerChild, MotionCard, MotionButton, PageTransition } from "../components/MotionWrappers";
import { ReactNode } from "react";
import { currentYear, currentMonthShort } from "../lib/dates";
import { sitesCountLabel, REVIEWED_SITES } from "../lib/siteStats";
import QuickPicks from "../components/QuickPicks";
import NicheBrowser from "../components/NicheBrowser";
import { siteNicheMap } from "../data/site-niches";
import { getNiche } from "../data/niches";
import { detectLocale } from "../lib/locale";

const tickerItems = (() => {
  const promotable = getTopRatedPromotable(4);
  const top = promotable[0];
  const second = promotable[1];
  const dealLeader = [...sites]
    .filter((s) => isAffiliated(s) && s.deal_discount > 0)
    .sort((a, b) => b.deal_discount - a.deal_discount)[0];
  return [
    top ? `Top pick: ${top.name}` : null,
    dealLeader ? `Deal: ${dealLeader.deal_discount}% off ${dealLeader.name}` : null,
    second ? `Just reviewed: ${second.name}` : null,
    "Updated monthly",
  ].filter((x): x is string => Boolean(x));
})();

// Computed once at module-eval — deterministic from sites.ts data.
const TOP_DEAL_PICK = getTopDealPick();

const HeroSection = () => {
  const words = "We Watched So You Don't Have To".split(" ");
  const [tickerIndex, setTickerIndex] = useState(0);
  const locale = detectLocale();
  const pick = TOP_DEAL_PICK;
  const pickHasDeal = pick && pick.deal_discount > 0;
  const pickUrl = pick ? getVisitUrl(pick) : "/top-sites";

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((i) => (i + 1) % tickerItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-mesh relative overflow-hidden" style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}>
      {/* Background floating cards */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div className="absolute left-[10%] top-[15%] h-48 w-36 rotate-[-8deg] rounded-lg bg-card/15 blur-[2px] border border-border/10" animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute right-[15%] top-[25%] h-52 w-40 rotate-[5deg] rounded-lg bg-card/15 blur-[2px] border border-border/10" animate={{ y: [0, 15, 0] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute left-[55%] bottom-[15%] h-44 w-36 rotate-[-3deg] rounded-lg bg-card/15 blur-[2px] border border-border/10" animate={{ y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity }} />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/[0.12] blur-[150px]" />

      <div className="pointer-events-none absolute inset-0">
        <div className="orb absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="orb-delay absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/[0.08] blur-[120px]" />
      </div>

      <div className="container relative text-center py-12 md:py-16">
        {/* Animated ticker */}
        <div className="mb-6 flex justify-center">
          <div className="overflow-hidden rounded-button bg-muted/60 px-4 py-1.5 h-7">
            <AnimatePresence mode="wait">
              <motion.span
                key={tickerIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="block text-xs font-medium text-muted-foreground"
              >
                {tickerItems[tickerIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <motion.h1
          className="hero-heading font-heading font-bold leading-tight heading-gradient inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Best Gay Twink Porn Sites {new Date().getFullYear()}
        </motion.h1>
        <motion.p
          className="mx-auto mt-4 text-2xl md:text-3xl font-heading font-bold leading-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          aria-label="We Watched So You Don't Have To"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
              className={`inline-block mr-[0.3em] ${
                word === "Watched" || word === "Don't" ? "gold-gradient-text" : ""
              }`}
            >
              {word}
            </motion.span>
          ))}
        </motion.p>
        <motion.p
          className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground md:text-base"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {sitesCountLabel} sites independently tested. Real scores, verified pricing, monthly updates.
        </motion.p>
        {locale.heroTagline && (
          <motion.p
            className="mx-auto mt-2 text-xs text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            lang={locale.code.split("-")[0]}
          >
            {locale.heroTagline}
          </motion.p>
        )}

        {/* TODAY'S TOP PICK — direct affiliate CTA above the fold */}
        {pick && (
          <motion.div
            className="mx-auto mt-8 max-w-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="glass-card rounded-lg p-5 border border-primary/30 text-left sm:text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
                ✦ Today's top pick
              </p>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-center sm:gap-3">
                <h2 className="font-heading text-xl md:text-2xl font-bold leading-tight">
                  {pick.name}
                </h2>
                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-button gold-gradient px-2 py-0.5 text-[11px] font-bold text-secondary-foreground sm:mt-0">
                  <Star size={11} className="fill-current" /> {pick.overall_score}/5
                </span>
              </div>
              {pickHasDeal ? (
                <p className="mt-2 text-sm text-emerald-400 font-semibold">
                  {pick.deal_discount}% off — just {pick.price_annual.replace(/^\$/, "$")}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  From {pick.price_from}
                </p>
              )}
              <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
                {isAffiliated(pick) ? (
                  <MotionButton>
                    <OutboundLink
                      site={pick}
                      ctaPosition="today-pick"
                      className="cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground sm:w-auto"
                    >
                      {pickHasDeal ? "Get the Deal" : "Visit Site"} <ArrowRight size={14} />
                    </OutboundLink>
                  </MotionButton>
                ) : (
                  <MotionButton>
                    <a
                      href={pickUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground sm:w-auto"
                    >
                      Visit Site <ArrowRight size={14} />
                    </a>
                  </MotionButton>
                )}
                <Link
                  to={`/reviews/${pick.slug}`}
                  className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors sm:px-4"
                >
                  Read our full review →
                </Link>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
                {isAffiliated(pick) ? "Partner link · " : ""}Updated {currentMonthShort} {currentYear}
              </p>
            </div>
          </motion.div>
        )}

        {/* Secondary CTAs */}
        <motion.div
          className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link
            to="/top-sites"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            See all {sitesCountLabel} sites →
          </Link>
          <span className="hidden sm:inline text-muted-foreground/30">·</span>
          <Link
            to="/find-my-site"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Take the 30-second quiz →
          </Link>
        </motion.div>

        {/* Trust bar */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="fill-secondary text-secondary" />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{sitesCountLabel} sites tested · Scores updated monthly</span>
        </motion.div>
      </div>
    </section>
  );
};

const badgeColor = (badge: string | null) => {
  if (!badge) return "";
  if (badge.includes("Value") || badge.includes("Deal")) return "gold-gradient text-secondary-foreground";
  if (badge.includes("Choice") || badge.includes("Top")) return "gold-gradient text-secondary-foreground";
  if (badge.includes("Popular")) return "bg-primary/20 text-primary";
  if (badge.includes("Trial")) return "bg-emerald-500/20 text-emerald-400";
  return "bg-primary/15 text-primary";
};

const MORE_LISTS = [
  { to: "/best-gay-porn-sites", label: "Best Gay Porn Sites", desc: "Top 15 across every niche, ranked by overall score." },
  { to: "/best-cheap-gay-porn-sites", label: "Best Cheap Picks", desc: "Real quality at budget prices — under $10/mo annual, score ≥ 3.7." },
  { to: "/best-bareback-twink-sites", label: "Best Bareback Twink", desc: "The bareback twink niche specifically — 30 ranked sites." },
  { to: "/best-twink-porn-sites-with-free-trials", label: "Free Trial Picks", desc: "Sites with genuine or low-cost intro trials." },
  { to: "/best-gay-porn-subscription", label: "Best Subscription", desc: "Ranked by value-for-money. Annual vs monthly broken out." },
  { to: "/gay-porn-sites-ranked", label: "Sites Ranked", desc: "All 62 sites in one sortable table — score on every pillar." },
];

// Memoized at module-eval — the ranking is deterministic from sites.ts data.
const POPULAR_COMPARISONS = rankComparePairs().slice(0, 6).map((r) => {
  const a = sites.find((s) => s.slug === r.siteA);
  const b = sites.find((s) => s.slug === r.siteB);
  return {
    slug: r.slug,
    aName: a?.name ?? r.siteA,
    bName: b?.name ?? r.siteB,
    winner: (a?.overall_score ?? 0) >= (b?.overall_score ?? 0) ? (a?.name ?? r.siteA) : (b?.name ?? r.siteB),
  };
});

const PopularComparisonsSection = () => (
  <section className="py-16 bg-card/30">
    <div className="container">
      <h2 className="font-heading text-2xl md:text-3xl font-bold heading-gradient inline-block mb-2">Popular Comparisons</h2>
      <p className="text-sm text-muted-foreground mb-6">The most-asked head-to-head questions in gay porn — side-by-side scoring and verdict for each.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POPULAR_COMPARISONS.map((c) => (
          <Link key={c.slug} to={`/compare/${c.slug}`} className="glass-card rounded-lg p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-heading font-semibold truncate">{c.aName}</span>
              <span className="text-xs text-primary font-bold shrink-0">vs</span>
              <span className="font-heading font-semibold truncate text-right">{c.bName}</span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Top pick: <span className="text-secondary font-semibold">{c.winner}</span></p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary">
              See full comparison <ArrowRight size={11} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const MoreListsSection = () => (
  <section className="py-16">
    <div className="container">
      <h2 className="font-heading text-2xl md:text-3xl font-bold heading-gradient inline-block mb-6">More Lists</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MORE_LISTS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="glass-card rounded-lg p-5 hover:border-primary/50 transition-colors"
          >
            <p className="font-heading font-semibold">{l.label}</p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{l.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary">
              View list <ArrowRight size={11} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const TopPicksSection = () => {
  const featured = getTopRatedAffiliated(5);
  return (
    <section className="py-16">
      <div className="container">
        <motion.h2
          className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          The Ones Worth Your Money
        </motion.h2>
        <StaggerContainer className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {featured.map((site) => (
            <StaggerChild key={site.id}>
              <MotionCard className="glass-card flex flex-col rounded-lg p-5 h-full">
                <SitePlaceholderImage site={site} className="mb-3" />
                {site.badge && (
                  <span className={`mb-2 inline-block self-start rounded-button px-2.5 py-1 text-xs font-semibold ${badgeColor(site.badge)}`}>
                    {site.badge}
                  </span>
                )}
                <h3 className="font-heading text-lg font-semibold">{site.name}</h3>
                <StarRating score={site.overall_score} size={14} />
                <p className="mt-2 flex-1 text-xs text-muted-foreground line-clamp-2">{site.short_description}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Reviewed</span>
                <VisitSiteButton site={site} label="Visit Site" className="mt-3" ctaPosition="card" />
                {(() => {
                  const primary = siteNicheMap[site.slug]?.[0];
                  const niche = primary ? getNiche(primary) : null;
                  if (!niche) return null;
                  return (
                    <Link
                      to={`/niche/${niche.slug}`}
                      className="mt-2 block text-center text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      View all {niche.displayName.toLowerCase()} sites →
                    </Link>
                  );
                })()}
              </MotionCard>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

const QuizBanner = () => (
  <motion.section
    className="py-8"
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
  >
    <div className="container">
      <MotionCard className="glass-card flex flex-col items-center gap-4 rounded-lg p-8 text-center sm:flex-row sm:text-left">
        <Sparkles size={40} className="text-primary shrink-0" />
        <div className="flex-1">
          <h3 className="font-heading text-xl font-bold">No idea what you want?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tell us your budget and what you're into. We'll match you to the right site in 30 seconds.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <MotionButton>
            <Link to="/ask-ai" className="cta-btn inline-flex items-center gap-2 rounded-button gold-gradient px-6 py-2.5 text-sm font-semibold text-secondary-foreground whitespace-nowrap">
              Ask TwinkAI
            </Link>
          </MotionButton>
          <MotionButton>
            <Link to="/find-my-site" className="cta-btn rounded-button border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap">
              Take the Quiz →
            </Link>
          </MotionButton>
        </div>
      </MotionCard>
    </div>
  </motion.section>
);

const LatestReviewsSection = () => {
  const featured = getTopRatedPromotable(5);
  const latest = getRecentlyUpdatedPromotable(3, featured);
  return (
    <section className="py-16">
      <div className="container">
        <motion.h2
          className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Latest Reviews
        </motion.h2>
        <StaggerContainer className="mt-8 grid gap-6 md:grid-cols-3">
          {latest.map((site) => (
            <StaggerChild key={site.id}>
              <MotionCard className="glass-card rounded-lg p-6">
                <SitePlaceholderImage site={site} className="mb-3" />
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-xl font-semibold">{site.name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Verified</span>
                </div>
                <StarRating score={site.overall_score} size={14} />
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{site.short_description}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-button bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{`Updated ${currentMonthShort} ${currentYear}`}</span>
                <div className="mt-4 flex gap-3">
                  <MotionButton className="flex-1">
                    <Link to={`/reviews/${site.slug}`} className="block rounded-button border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
                      Read Review
                    </Link>
                  </MotionButton>
                  <MotionButton className="flex-1">
                    <OutboundLink site={site} ctaPosition="card" className={`cta-btn block gold-gradient rounded-button px-4 py-2 text-center text-sm font-semibold text-secondary-foreground ${!isAffiliated(site) ? "opacity-85" : ""}`}>
                      Visit Site
                    </OutboundLink>
                  </MotionButton>
                </div>
                <p className="mt-1 text-center text-[9px] text-muted-foreground">Opens in new tab{isAffiliated(site) ? " · Partner link" : ""}</p>
              </MotionCard>
            </StaggerChild>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

const TrustSection = () => (
  <motion.section
    className="border-t border-border py-16"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
  >
    <div className="container">
      <h2 className="text-center font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block w-full">Why We Do This</h2>
      <StaggerContainer className="mt-10 grid gap-8 md:grid-cols-3">
        {[
          { icon: <Search size={48} className="text-primary" />, title: "We Actually Subscribe", desc: "Every review comes from a paid membership. We browse the member area, not just the trailer page." },
          { icon: <ShieldCheck size={48} className="text-primary" />, title: "No Pay-to-Play", desc: "We earn commissions on some links, but no site has ever paid us to rank higher. Our scores are ours." },
          { icon: <RefreshCw size={48} className="text-primary" />, title: "Prices Change. We Check.", desc: "Sites raise prices, kill trials, or stop updating. We catch it and adjust scores the same month." },
        ].map((item) => (
          <StaggerChild key={item.title}>
            <div className="text-center">
              <div className="flex justify-center">{item.icon}</div>
              <h3 className="mt-4 font-heading text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </StaggerChild>
        ))}
      </StaggerContainer>
    </div>
  </motion.section>
);

const GayDatingSection = () => (
  <motion.section
    className="py-12"
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
  >
    <div className="container">
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">
          Looking for Something More Personal?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Memberships cover content. These sites cover connections.
        </p>
      </motion.div>
      <StaggerContainer className="grid gap-4 sm:grid-cols-2">
        {/* Manfinder — free join angle */}
        <StaggerChild>
          <MotionCard className="glass-card rounded-lg p-6 flex flex-col h-full border border-emerald-500/20">
            <span className="text-3xl">💚</span>
            <span className="mt-3 text-xs font-semibold text-emerald-400 uppercase tracking-wide">Free to Join</span>
            <h3 className="mt-1 font-heading text-xl font-bold">Manfinder</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Meet gay men near you for free. Create a profile, browse guys in your area, and connect — no subscription, no credit card required to get started.
            </p>
            <a
              href={MANFINDER_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackManfinderClick("/")}
              className="cta-btn gold-gradient mt-4 inline-flex items-center justify-center gap-2 rounded-button px-6 py-2.5 text-sm font-semibold text-secondary-foreground"
            >
              Join Manfinder Free <ArrowRight size={14} />
            </a>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/60">Free to join · Partner link</p>
          </MotionCard>
        </StaggerChild>
        {/* CrakRevenue Gay Smartlink */}
        <StaggerChild>
          <MotionCard className="glass-card rounded-lg p-6 flex flex-col h-full">
            <span className="text-3xl">🔍</span>
            <span className="mt-3 text-xs font-semibold text-primary uppercase tracking-wide">Browse Options</span>
            <h3 className="mt-1 font-heading text-xl font-bold">Gay Dating & Hookup Sites</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">
              Compare the top gay dating and hookup platforms. Filter by location, what you're into, and how quickly you want to connect.
            </p>
            <a
              href={CRAK_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackCrakClick("/")}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-button border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Find Local Guys <ArrowRight size={14} />
            </a>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/60">Sponsored · Partner link</p>
          </MotionCard>
        </StaggerChild>
      </StaggerContainer>
    </div>
  </motion.section>
);

import { Helmet } from "react-helmet-async";

const Index = () => (
  <Layout>
    <Helmet>
      <title>{`Best Gay Twink Sites ${currentYear} — Ranked & Reviewed | TwinkVault`}</title>
      <meta name="description" content="Honest independent rankings of the best gay twink porn sites. Staff-tested reviews, real pricing, and exclusive deals. Updated monthly." />
      <link rel="canonical" href="https://twinkvault.com" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "TwinkVault",
        "url": "https://twinkvault.com",
        "description": "Independent rankings and reviews of the best gay twink content sites.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": { "@type": "EntryPoint", "urlTemplate": "https://twinkvault.com/reviews?q={search_term_string}" },
          "query-input": "required name=search_term_string"
        }
      })}</script>
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "TwinkVault",
        "url": "https://twinkvault.com",
        "logo": "https://twinkvault.com/pwa-512.png",
        "foundingDate": "2024",
        "description": "Independent gay site review project — paid memberships, transparent scoring, no commission-rigged rankings.",
        "sameAs": [],
      })}</script>
    </Helmet>
    <PageTransition>
      {/* Hero with direct affiliate CTA above the fold */}
      <HeroSection />
      <SocialProofStrip />
      {/* Direct buying CTAs first */}
      <TopPicksSection />
      <QuickPicks />
      <PopularComparisonsSection />
      <MoreListsSection />
      {/* Exploration */}
      <NicheBrowser />
      <LatestReviewsSection />
      {/* Tools + trust */}
      <QuizBanner />
      <GayDatingSection />
      <TrustSection />
      <BentoGrid />
      <section className="py-16">
        <div className="container">
          <BrandStory collapsible />
        </div>
      </section>
      {/* Email capture last */}
      <InlineEmailCapture />
    </PageTransition>
  </Layout>
);

export default Index;
