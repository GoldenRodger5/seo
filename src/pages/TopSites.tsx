import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X as XIcon, ArrowRight, Crown, ThumbsUp } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import ScoreRing from "../components/ScoreRing";
import SitePlaceholderImage from "../components/SitePlaceholderImage";
import SmartImage from "../components/common/SmartImage";
import { getSiteImagery, getCardImage } from "../data/site-imagery";
import OutboundLink from "../components/OutboundLink";
import FeaturedDealBanner from "../components/common/FeaturedDealBanner";
import LocalisedPrice from "../components/LocalisedPrice";
import { sites, getVisitUrl, isAffiliated, isPendingReview } from "../data/sites";
import { StaggerContainer, StaggerChild, MotionButton, PageTransition } from "../components/MotionWrappers";
import { currentYear, currentMonthLong } from "../lib/dates";
import { sitesCountLabel, TOTAL_SITES } from "../lib/siteStats";

const filters = ["All", "Best Value", "HD Quality", "Amateur", "Premium Studio", "Has Trial"];

const filterMap: Record<string, string | null> = {
  All: null,
  "Best Value": "best-value",
  "HD Quality": "hd-quality",
  Amateur: "amateur-twinks",
  "Premium Studio": "premium-studios",
  "Has Trial": "free-trials",
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

  // Pending-review sites are excluded from any ranked list — they have no
  // score yet. They surface only on /reviews and their own review page.
  // Rank order, not file order: sites.ts array order predates rank
  // renumbering, and sentinel-ranked (900+) editorial-only sites must sink
  // to the bottom of both the visible list and the ItemList schema.
  const rankable = [...sites].filter((s) => !isPendingReview(s)).sort((a, b) => a.rank - b.rank);
  const filtered = active === "All"
    ? rankable
    : rankable.filter((s) => s.categories.includes(filterMap[active]!));

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{`Gay Twink Site Rankings ${currentYear} — All Sites Scored | TwinkVault`}</title>
          <meta name="description" content="Every major twink site ranked by content quality, value, update frequency and mobile experience. Paid memberships tested, honest scores, no sponsored rankings." />
          <link rel="canonical" href="https://twinkvault.com/top-sites" />
        </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
            { "@type": "ListItem", position: 2, name: "Top Sites", item: "https://twinkvault.com/top-sites" },
          ],
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${TOTAL_SITES} Best Gay Twink Sites Ranked`,
          description: `The top-ranked twink sites — scored on content quality, value, update frequency, and mobile experience from hands-on review.`,
          url: "https://twinkvault.com/top-sites",
          mainEntity: {
            "@type": "ItemList",
            name: "Top Gay Twink Sites",
            numberOfItems: filtered.length,
            itemListElement: filtered.slice(0, 30).map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: s.name,
              url: `https://twinkvault.com/reviews/${s.slug}`,
            })),
          },
        }) }} />

        <section className="py-16">
          <div className="container">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
                {TOTAL_SITES} Sites. All Reviewed. Ranked Honestly.
              </h1>
              <p className="mt-4 text-muted-foreground">
                We researched and scored every site, and ranked the ones actually worth your money. Scored on content, value, updates, and mobile UX. No site paid us to be here.
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-button bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {`Updated ${currentMonthLong} ${currentYear}`}
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
            {/* key={active} forces remount on filter change so whileInView (once:true)
                re-fires and child variants transition to "visible" again. Without this,
                filtered children mount in "hidden" state (opacity:0) and stay invisible. */}
            <StaggerContainer key={active} className="mt-10 space-y-4">
              {filtered.map((site, i) => (
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
                        {(() => {
                          // Real card art when we have it; branded placeholder otherwise.
                          const im = getSiteImagery(site.slug);
                          const img = getCardImage(site.slug);
                          return img ? (
                            <div className="rounded-lg overflow-hidden border border-border/40">
                              <SmartImage src={img} alt={im.banner_alt || `${site.name} banner`} aspectRatio="3:2" fallbackLabel={site.name} />
                            </div>
                          ) : (
                            <SitePlaceholderImage site={site} />
                          );
                        })()}
                        <div className="flex items-center justify-center gap-2">
                          {i === 0 && <Crown size={20} className="text-secondary" />}
                          <span className="font-heading text-3xl font-bold text-muted-foreground/40">#{i + 1}</span>
                          <ScoreRing score={site.overall_score} size={50} />
                        </div>
                      </div>

                      {/* Main content */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-heading text-2xl font-bold">{site.name}</h2>
                          {site.badge && (
                            <span className={`rounded-button px-2.5 py-1 text-xs font-semibold ${badgeStyle(site.badge)}`}>
                              {site.badge}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Reviewed</span>
                          <span className="inline-flex items-center gap-1 rounded-button bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{`Updated ${currentMonthLong} ${currentYear}`}</span>
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

                        {(() => {
                          const helpful = parseInt(localStorage.getItem(`tv_helpful_${site.slug}`) || "0");
                          if (helpful < 5) return null;
                          return (
                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                              <ThumbsUp size={12} />
                              <span>{helpful} readers found this review helpful</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* CTA column — affiliated sites get BOTH buttons regardless
                          of rank (top-ranked sites are the strongest conversion
                          paths and shouldn't be hidden behind a review click). */}
                      <div className="flex flex-col items-center gap-3 lg:w-44">
                        <div className="rounded-button border border-border bg-muted/50 px-3 py-1.5">
                          <LocalisedPrice usd={site.price_monthly} className="text-lg font-semibold" />
                        </div>
                        {isAffiliated(site) && (
                          <OutboundLink
                            site={site}
                            ctaPosition="top-sites-card"
                            sourceTypeOverride="top-sites"
                            className="cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
                          >
                            Visit Site <ArrowRight size={13} />
                          </OutboundLink>
                        )}
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

            <FeaturedDealBanner placement="homepage" />

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
                        <td className="px-4 py-3 font-heading font-bold text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 font-semibold">
                          <Link to={`/reviews/${site.slug}`} className="hover:text-secondary transition-colors">{site.name}</Link>
                        </td>
                        <td className="px-4 py-3 font-semibold text-secondary">{site.overall_score}</td>
                        <td className="px-4 py-3 text-muted-foreground"><LocalisedPrice usd={site.price_monthly} /></td>
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

            {/* Related Lists — internal-link hub for the broad SEO landing pages */}
            <div className="mt-16">
              <h2 className="font-heading text-2xl font-bold heading-gradient inline-block mb-6">Related Lists</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { to: "/best-gay-porn-sites", label: "Best Gay Porn Sites", desc: "Top 15 across every niche." },
                  { to: "/best-twink-porn-sites", label: "Best Twink Porn Sites", desc: "Twink niche, content-quality first." },
                  { to: "/best-premium-gay-sites", label: "Best Premium Sites", desc: "Studio-tier production rankings." },
                  { to: "/best-value-gay-porn-sites", label: "Best Value", desc: "Most content per dollar." },
                ].map((l) => (
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
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default TopSites;
