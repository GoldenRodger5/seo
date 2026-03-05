import { Link } from "react-router-dom";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import StarRating from "../components/StarRating";
import AnimateOnScroll from "../components/AnimateOnScroll";
import SocialProofStrip from "../components/SocialProofStrip";
import InlineEmailCapture from "../components/InlineEmailCapture";
import Layout from "../components/Layout";
import { getFeaturedSites, categories, sites } from "../data/sites";
import { Search, CalendarSync, ShieldCheck } from "lucide-react";

const tickerItems = [
  "🔥 New: Helix Studios Review",
  "💰 Deal: 67% off this week",
  "⭐ Just Reviewed: Twink In Shorts",
  "🆕 Athletic Twinks added",
];

const HeroSection = () => {
  const words = "The Internet's Best Guide to Twink Content".split(" ");
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((i) => (i + 1) % tickerItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-mesh relative overflow-hidden" style={{ minHeight: "85vh", display: "flex", alignItems: "center" }}>
      {/* Background floating cards */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[15%] h-48 w-36 rotate-[-8deg] rounded-lg bg-card/15 blur-[2px] border border-border/10" />
        <div className="absolute right-[15%] top-[25%] h-52 w-40 rotate-[5deg] rounded-lg bg-card/15 blur-[2px] border border-border/10" />
        <div className="absolute left-[55%] bottom-[15%] h-44 w-36 rotate-[-3deg] rounded-lg bg-card/15 blur-[2px] border border-border/10" />
      </div>

      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/[0.12] blur-[150px]" />

      {/* Animated orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="orb absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="orb-delay absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/[0.08] blur-[120px]" />
      </div>

      <div className="container relative text-center stagger-in py-16">
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
                word === "Twink" || word === "Content" ? "gold-gradient-text" : ""
              }`}
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Honest, independent reviews of the top gay twink sites — ranked by quality, value, and content.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/top-sites"
            className="cta-btn gold-gradient inline-flex items-center gap-2 rounded-button px-8 py-3.5 text-sm font-semibold text-secondary-foreground"
          >
            See Top Rated Sites <ArrowRight size={16} />
          </Link>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-2 rounded-button border border-primary px-8 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Browse All Reviews
          </Link>
        </div>
        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="flex gap-0.5 star-stagger">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-secondary text-secondary" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">Reviewing the web's best twink content since 2024</span>
        </div>
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
    <AnimateOnScroll>
      <section className="py-16">
        <div className="container">
          <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">🏆 Editor's Top Picks</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {featured.map((site) => (
              <div
                key={site.id}
                className="card-glow glass-card flex flex-col rounded-lg p-5"
              >
                {site.badge && (
                  <span className={`mb-3 inline-block self-start rounded-button px-2.5 py-1 text-xs font-semibold ${badgeColor(site.badge)}`}>
                    {site.badge}
                  </span>
                )}
                <h3 className="font-heading text-lg font-semibold">{site.name}</h3>
                <StarRating score={site.overall_score} size={14} />
                <p className="mt-2 flex-1 text-xs text-muted-foreground line-clamp-2">{site.short_description}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Staff Verified</span>
                <Link
                  to={`/go/${site.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-btn mt-3 inline-flex items-center justify-center rounded-button gold-gradient px-4 py-2 text-xs font-semibold text-secondary-foreground"
                >
                  Visit Site
                </Link>
                <p className="mt-1 text-center text-[9px] text-muted-foreground">Opens in new tab · Affiliate link</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  );
};

const QuizBanner = () => (
  <AnimateOnScroll>
    <section className="py-8">
      <div className="container">
        <Link
          to="/find-my-site"
          className="card-glow glass-card flex flex-col items-center gap-4 rounded-lg p-8 text-center sm:flex-row sm:text-left"
          style={{ borderColor: "hsl(var(--primary) / 0.3)" }}
        >
          <Sparkles size={40} className="text-primary shrink-0" />
          <div className="flex-1">
            <h3 className="font-heading text-xl font-bold">Not sure where to start?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Take our 30-second quiz and we'll recommend the perfect site for you.</p>
          </div>
          <span className="cta-btn rounded-button border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap">
            Take the Quiz →
          </span>
        </Link>
      </div>
    </section>
  </AnimateOnScroll>
);

const CategoriesSection = () => (
  <AnimateOnScroll>
    <section className="py-16">
      <div className="container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">Browse By Category</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const IconMap: Record<string, React.ReactNode> = {
              "amateur-twinks": <span className="text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 1.6.8 3 2 4l1 1 1-1c1.2-1 2-2.4 2-4a3 3 0 0 0-3-3z"/><path d="M19 14c-1 1-3 2-7 2s-6-1-7-2"/><path d="M5 20c1-1 3-2 7-2s6 1 7 2"/></svg></span>,
              "premium-studios": <Star size={28} className="text-primary" />,
              "best-value": <span className="text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg></span>,
              "hd-quality": <span className="text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m15 10-4 4"/><circle cx="15" cy="14" r="1"/><circle cx="11" cy="10" r="1"/></svg></span>,
              "free-trials": <span className="text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><circle cx="12" cy="12" r="10"/></svg></span>,
              "mobile-friendly": <span className="text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span>,
            };
            return (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="card-glow glass-card flex items-center gap-4 rounded-lg p-5 hover:bg-primary/5 transition-colors"
              >
                {IconMap[cat.slug] || <span className="text-3xl">{cat.icon}</span>}
                <div>
                  <h3 className="font-heading text-lg font-semibold">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  </AnimateOnScroll>
);

const LatestReviewsSection = () => {
  const latest = sites.slice(0, 3);
  return (
    <AnimateOnScroll>
      <section className="py-16">
        <div className="container">
          <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">Latest Reviews</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {latest.map((site) => (
              <div key={site.id} className="card-glow glass-card rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-xl font-semibold">{site.name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Verified</span>
                </div>
                <StarRating score={site.overall_score} size={14} />
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{site.short_description}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-button bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">🔄 Updated Mar 2026</span>
                <div className="mt-4 flex gap-3">
                  <Link
                    to={`/reviews/${site.slug}`}
                    className="flex-1 rounded-button border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    Read Review
                  </Link>
                  <Link
                    to={`/go/${site.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-btn flex-1 gold-gradient rounded-button px-4 py-2 text-center text-sm font-semibold text-secondary-foreground"
                  >
                    Visit Site
                  </Link>
                </div>
                <p className="mt-1 text-center text-[9px] text-muted-foreground">Opens in new tab · Affiliate link</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  );
};

const TrustSection = () => (
  <AnimateOnScroll>
    <section className="border-t border-border py-16">
      <div className="container">
        <h2 className="text-center font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block w-full">Why Trust Us</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            { icon: <Search size={48} className="text-primary" />, title: "Independent Reviews", desc: "We pay for memberships ourselves and report honestly." },
            { icon: <ShieldCheck size={48} className="text-primary" />, title: "No Paid Placements", desc: "Rankings are based on quality, not who pays us more." },
            { icon: <CalendarSync size={48} className="text-primary" />, title: "Updated Monthly", desc: "We revisit sites regularly to keep reviews current." },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="flex justify-center">{item.icon}</div>
              <h3 className="mt-4 font-heading text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </AnimateOnScroll>
);

const Index = () => (
  <Layout>
    <HeroSection />
    <SocialProofStrip />
    <TopPicksSection />
    <QuizBanner />
    <CategoriesSection />
    <LatestReviewsSection />
    <InlineEmailCapture />
    <TrustSection />
  </Layout>
);

export default Index;
