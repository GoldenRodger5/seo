import { Link } from "react-router-dom";
import { Star, ArrowRight, Sparkles, Flame, Film, DollarSign, Play, Gift, Smartphone } from "lucide-react";
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
import { getFeaturedSites, categories, sites, getVisitUrl, isAffiliated } from "../data/sites";
import { Search, CalendarSync, ShieldCheck } from "lucide-react";
import { StaggerContainer, StaggerChild, MotionCard, MotionButton, PageTransition } from "../components/MotionWrappers";
import { ReactNode } from "react";
import { StaggerContainer, StaggerChild, MotionCard, MotionButton, PageTransition } from "../components/MotionWrappers";

const tickerItems = [
  "🔥 New: Helix Studios Review",
  "💰 Deal: 67% off this week",
  "⭐ Just Reviewed: Twink In Shorts",
  "🆕 Athletic Twinks added",
];

const categoryVibes: Record<string, string> = {
  "amateur-twinks": "🔥 Raw & Real",
  "premium-studios": "✨ Cinematic Vibes",
  "best-value": "💰 Bang For Your Buck",
  "hd-quality": "🎬 Crystal Clear",
  "free-trials": "🆓 Try Before You Buy",
  "mobile-friendly": "📱 Scroll & Watch",
};

const HeroSection = () => {
  const words = "We Watched So You Don't Have To".split(" ");
  const [tickerIndex, setTickerIndex] = useState(0);

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

      <div className="container relative text-center py-16">
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

        <h1 className="hero-heading font-heading font-bold leading-tight">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`inline-block mr-[0.3em] ${
                word === "Watched" || word === "Don't" ? "gold-gradient-text" : ""
              }`}
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Honest rankings of the best twink sites — no sponsored garbage, no fake reviews.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <MotionButton>
            <Link
              to="/top-sites"
              className="cta-btn gold-gradient inline-flex items-center gap-2 rounded-button px-8 py-3.5 text-sm font-semibold text-secondary-foreground"
            >
              See Top Rated Sites <ArrowRight size={16} />
            </Link>
          </MotionButton>
          <MotionButton>
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 rounded-button border border-primary px-8 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Browse All Reviews
            </Link>
          </MotionButton>
        </motion.div>
        <motion.div
          className="mt-10 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-secondary text-secondary" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">Trusted by 10,000+ readers since 2024</span>
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

const TopPicksSection = () => {
  const featured = getFeaturedSites();
  return (
    <section className="py-16">
      <div className="container">
        <motion.h2
          className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          🏆 The Ones Worth Your Money
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
                <span className="mt-1 inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Staff Verified</span>
                <VisitSiteButton site={site} label="Visit Site" className="mt-3" />
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
          <h3 className="font-heading text-xl font-bold">Not sure where to start?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Take our 30-second quiz and we'll recommend the perfect site for you.</p>
        </div>
        <MotionButton>
          <Link to="/find-my-site" className="cta-btn rounded-button border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap">
            Take the Quiz →
          </Link>
        </MotionButton>
      </MotionCard>
    </div>
  </motion.section>
);

const CategoriesSection = () => (
  <section className="py-16">
    <div className="container">
      <motion.h2
        className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        Browse By Vibe
      </motion.h2>
      <StaggerContainer className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <StaggerChild key={cat.slug}>
            <MotionCard className="glass-card flex items-center gap-4 rounded-lg p-5">
              <Link to={`/category/${cat.slug}`} className="flex items-center gap-4 w-full">
                <span className="text-2xl">{categoryVibes[cat.slug]?.split(" ")[0] || cat.icon}</span>
                <div>
                  <h3 className="font-heading text-lg font-semibold">{categoryVibes[cat.slug] || cat.name}</h3>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </Link>
            </MotionCard>
          </StaggerChild>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

const LatestReviewsSection = () => {
  const latest = sites.slice(0, 3);
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
                <span className="mt-2 inline-flex items-center gap-1 rounded-button bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">🔄 Updated Mar 2026</span>
                <div className="mt-4 flex gap-3">
                  <MotionButton className="flex-1">
                    <Link to={`/reviews/${site.slug}`} className="block rounded-button border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
                      Read Review
                    </Link>
                  </MotionButton>
                  <MotionButton className="flex-1">
                    <Link to={getVisitUrl(site)} target="_blank" rel="noopener noreferrer" className={`cta-btn block gold-gradient rounded-button px-4 py-2 text-center text-sm font-semibold text-secondary-foreground ${!isAffiliated(site) ? "opacity-85" : ""}`}>
                      Visit Site
                    </Link>
                  </MotionButton>
                </div>
                <p className="mt-1 text-center text-[9px] text-muted-foreground">Opens in new tab{isAffiliated(site) ? " · Affiliate link" : ""}</p>
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
      <h2 className="text-center font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block w-full">Why Trust Us</h2>
      <StaggerContainer className="mt-10 grid gap-8 md:grid-cols-3">
        {[
          { icon: <Search size={48} className="text-primary" />, title: "We Pay, You Save", desc: "We pay for memberships ourselves and report honestly." },
          { icon: <ShieldCheck size={48} className="text-primary" />, title: "Zero BS Rankings", desc: "Rankings are based on quality, not who pays us more." },
          { icon: <CalendarSync size={48} className="text-primary" />, title: "Always Fresh, Never Stale", desc: "We revisit sites regularly to keep reviews current." },
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

const Index = () => (
  <Layout>
    <PageTransition>
      <HeroSection />
      <SocialProofStrip />
      <TopPicksSection />
      <QuizBanner />
      <CategoriesSection />
      <BentoGrid />
      <LatestReviewsSection />
      <InlineEmailCapture />
      <TrustSection />
      <section className="py-16">
        <div className="container">
          <BrandStory collapsible />
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default Index;
