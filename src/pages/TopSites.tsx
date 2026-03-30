import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X as XIcon, ArrowRight, Crown, ThumbsUp } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import ScoreRing from "../components/ScoreRing";
import SitePlaceholderImage from "../components/SitePlaceholderImage";
import VisitSiteButton from "../components/VisitSiteButton";
import { sites, getVisitUrl, isAffiliated } from "../data/sites";
import { StaggerContainer, StaggerChild, MotionButton, PageTransition } from "../components/MotionWrappers";
import { currentYear, currentMonthLong } from "../lib/dates";

const filters = ["All", "Best Value", "HD Quality", "Amateur", "Premium Studio", "Free Trial"];

const filterMap: Record<string, string | null> = {
  All: null,
  "Best Value": "best-value",
  "HD Quality": "hd-quality",
  Amateur: "amateur-twinks",
  "Premium Studio": "premium-studios",
  "Free Trial": "free-trials",
};

const badgeStyle = (badge: string | null) => {
  if (!badge) return "";
  if (badge.includes("Value") || badge.includes("Deal")) return "gold-gradient text-secondary-foreground";
  if (badge.includes("Choice")) return "gold-gradient text-secondary-foreground";
  if (badge.includes("Popular")) return "bg-primary/20 text-primary";
  if (badge.includes("Trial")) return "bg-emerald-500/20 text-emerald-400";
  if (badge.includes("Top")) return "gold-gradient text-secondary-foreground";
  return "bg-primary/15 text-primary";
};

const TopSites = () => {
  const [active, setActive] = useState("All");

  const filtered = active === "All"
    ? sites
    : sites.filter((s) => s.categories.includes(filterMap[active]!));

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{`Best Gay Twink Sites ${currentYear} — Top 12 Ranked & Reviewed | TwinkVault`}</title>
          <meta name="description" content={`Staff rankings of the best gay twink content sites in ${currentYear}. Real pricing, honest scores, and exclusive deals. Updated monthly.`} />
          <link rel="canonical" href="https://twinkvault.com/top-sites" />
        </Helmet>

        <section className="py-16">
          <div className="container">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
                The Only Ranking That Actually Matters
              </h1>
              <p className="mt-4 text-muted-foreground">
                We tested and ranked the top twink content sites so you don't have to. Updated monthly.
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-button bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {`🔄 Updated ${currentMonthLong} ${currentYear}`}
                </span>
                <a href="#comparison-table" className="text-xs font-medium text-secondary hover:underline">
                  Jump to Comparison Table ↓
                </a>
              </div>
            </motion.div>

            {/* Filters */}
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {filters.map((f) => (
                <motion.button
                  key={f}
                  onClick={() => setActive(f)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className={`rounded-button px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                    active === f
                      ? "gold-gradient text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </motion.button>
              ))}
            </div>

            {/* Ranked List */}
            <StaggerContainer className="mt-10 space-y-4">
              {filtered.map((site) => (
                <StaggerChild key={site.id}>
                  <motion.div
                    className={`glass-card rounded-lg p-6 ${
                      site.rank === 1
                        ? "gold-pulse-border border-l-4 border-l-secondary"
                        : site.rank <= 3
                        ? "border-l-4 border-l-secondary/50"
                        : ""
                    }`}
                    whileHover={{ scale: 1.01, y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                      {/* Image + Rank on mobile/desktop */}
                      <div className="flex flex-col gap-4 lg:w-48">
                        <SitePlaceholderImage site={site} />
                        <div className="flex items-center justify-center gap-2">
                          {site.rank === 1 && <Crown size={20} className="text-secondary" />}
                          <span className="font-heading text-3xl font-bold text-muted-foreground/40">#{site.rank}</span>
                          <ScoreRing score={site.overall_score} size={50} />
                        </div>
                      </div>

                      {/* Main content */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-heading text-2xl font-bold">{site.name}</h2>
                          {site.badge && (
                            <span className={`rounded-button px-2.5 py-1 text-xs font-semibold ${badgeStyle(site.badge)}`}>
                              {site.rank === 1 ? "👑 " : ""}{site.badge}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Reviewed</span>
                          <span className="inline-flex items-center gap-1 rounded-button bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">🔄 {`Updated ${currentMonthLong} ${currentYear}`}</span>
                        </div>
                        <div className="mt-1">
                          <StarRating score={site.overall_score} />
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{site.short_description}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {site.has_free_trial && (
                            <span className="rounded-button bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">FREE TRIAL</span>
                          )}
                          {site.categories.map((cat) => (
                            <span key={cat} className="rounded-button bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                              {cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            {site.pros.map((pro) => (
                              <div key={pro} className="flex items-start gap-2 text-sm">
                                <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                                <span className="text-muted-foreground">{pro}</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            {site.cons.map((con) => (
                              <div key={con} className="flex items-start gap-2 text-sm">
                                <XIcon size={14} className="mt-0.5 shrink-0 text-muted-foreground/50" />
                                <span className="text-muted-foreground/70">{con}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <ThumbsUp size={12} />
                          <span>{parseInt(localStorage.getItem(`tv_helpful_${site.slug}`) || "0")} readers found this review helpful</span>
                        </div>
                      </div>

                      {/* CTA column */}
                      <div className="flex flex-col items-center gap-3 lg:w-44">
                        <div className="rounded-button border border-border bg-muted/50 px-3 py-1.5">
                          <span className="text-lg font-semibold">{site.price_monthly}</span>
                        </div>
                        <VisitSiteButton site={site} className="w-full" />
                        <Link
                          to={`/reviews/${site.slug}`}
                          className="rounded-button border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors w-full text-center"
                        >
                          Read Full Review →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </StaggerChild>
              ))}
            </StaggerContainer>

            {/* Comparison Table */}
            <motion.div
              className="mt-16"
              id="comparison-table"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl font-bold heading-gradient inline-block mb-6">Quick Comparison</h2>
              <div className="overflow-x-auto rounded-lg glass-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Site</th>
                      <th className="px-4 py-3 font-semibold">Score</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Free Trial</th>
                      <th className="px-4 py-3 font-semibold">HD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((site, i) => (
                      <tr key={site.id} className={`border-b border-border/30 transition-colors hover:bg-primary/5 ${i % 2 === 0 ? "bg-transparent" : "bg-muted/20"}`}>
                        <td className="px-4 py-3 font-heading font-bold text-muted-foreground">{site.rank}</td>
                        <td className="px-4 py-3 font-semibold">
                          <Link to={`/reviews/${site.slug}`} className="hover:text-secondary transition-colors">{site.name}</Link>
                        </td>
                        <td className="px-4 py-3 font-semibold text-secondary">{site.overall_score}</td>
                        <td className="px-4 py-3 text-muted-foreground">{site.price_monthly}</td>
                        <td className="px-4 py-3">
                          {site.has_free_trial ? <Check size={14} className="text-emerald-400" /> : <XIcon size={14} className="text-muted-foreground/30" />}
                        </td>
                        <td className="px-4 py-3">
                          {site.has_hd ? <Check size={14} className="text-emerald-400" /> : <XIcon size={14} className="text-muted-foreground/30" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default TopSites;
