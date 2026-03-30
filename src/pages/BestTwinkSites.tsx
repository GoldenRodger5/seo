import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, Crown, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition, StaggerContainer, StaggerChild, MotionCard } from "../components/MotionWrappers";
import StarRating from "../components/StarRating";
import ScoreRing from "../components/ScoreRing";
import VisitSiteButton from "../components/VisitSiteButton";
import { sites } from "../data/sites";

const sorted = [...sites].sort((a, b) => a.rank - b.rank);

const BestTwinkSites = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>Best Twink Sites 2026 — Top 12 Ranked by Experts | TwinkVault</title>
        <meta name="description" content="The definitive list of the best gay twink sites in 2026. Staff-tested rankings with real pricing, honest scores, and exclusive deals. Updated monthly." />
        <link rel="canonical" href="https://twinkvault.com/best-twink-sites" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Best Twink Sites 2026",
          "description": "Staff-tested rankings of the best gay twink content sites",
          "numberOfItems": sites.length,
          "itemListElement": sorted.map((site, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": site.name,
            "url": `https://twinkvault.com/reviews/${site.slug}`
          }))
        })}</script>
      </Helmet>

      <section className="hero-mesh py-16">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-button bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">
              <Crown size={12} /> Updated March 2026
            </span>
            <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
              Best Twink Sites 2026
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              We paid for memberships on 12 sites, tested everything, and scored them honestly. No sponsorships. No paid placements. Just the real ranking.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-4xl">

          {/* Quick answer box — targets featured snippet */}
          <motion.div
            className="glass-card rounded-lg p-6 border-l-4 border-l-secondary mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-heading text-lg font-bold">Quick Answer: Best Twink Sites in 2026</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              The best twink site in 2026 is <strong className="text-foreground">Helix Studios</strong> (4.8/5) for premium production quality.
              For best value, <strong className="text-foreground">Next Door Twink</strong> offers a $2.95 trial and access to 15 sites.
              For European content, <strong className="text-foreground">Staxus</strong> leads the field. Full rankings below.
            </p>
          </motion.div>

          <StaggerContainer className="space-y-4">
            {sorted.map((site, i) => (
              <StaggerChild key={site.id}>
                <MotionCard className="glass-card rounded-lg p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-heading text-lg font-bold text-muted-foreground">
                        #{i + 1}
                      </span>
                      <ScoreRing score={site.overall_score} size={56} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-xl font-bold">{site.name}</h2>
                        {site.badge && (
                          <span className="rounded-button gold-gradient px-2 py-0.5 text-xs font-semibold text-secondary-foreground">{site.badge}</span>
                        )}
                        {site.has_free_trial && (
                          <span className="rounded-button bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">Free Trial</span>
                        )}
                      </div>
                      <StarRating score={site.overall_score} size={13} />
                      <p className="mt-2 text-sm text-muted-foreground">{site.short_description}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Check size={11} className="text-emerald-400" /> {site.pros[0]}</span>
                        <span className="flex items-center gap-1"><Check size={11} className="text-emerald-400" /> {site.pros[1]}</span>
                        <span>From <strong className="text-foreground">{site.price_annual}/mo</strong> annual</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 sm:w-40">
                      <VisitSiteButton site={site} showDisclosure={false} />
                      <Link
                        to={`/reviews/${site.slug}`}
                        className="rounded-button border border-primary px-4 py-2 text-center text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        Read Review <ArrowRight size={11} className="inline" />
                      </Link>
                    </div>
                  </div>
                </MotionCard>
              </StaggerChild>
            ))}
          </StaggerContainer>

          {/* SEO content block */}
          <motion.div
            className="mt-16 space-y-6 text-muted-foreground leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-2xl font-bold text-foreground">How We Rank the Best Twink Sites</h2>
            <p>Finding the best twink site requires testing beyond the preview pages. We judge every site on four criteria: content quality (production values, performer quality, scene variety), value for money (what you get relative to the price), update frequency (how often new content is added), and mobile experience (how well the site works on phones and tablets).</p>
            <p>Each score is out of 100, and the overall rating is a weighted average. Sites with consistently high content quality score well even if they're more expensive — and budget sites can still rank highly if they deliver solid value at their price point.</p>
            <p>We pay for every membership ourselves. No site has ever paid us to rank higher. If a site changes significantly — prices go up, quality drops, updates slow down — we update the ranking immediately.</p>
            <h2 className="font-heading text-2xl font-bold text-foreground">What Makes a Great Twink Site?</h2>
            <p>The best twink sites in 2026 share a few qualities: exclusive content you can't find elsewhere, consistent update schedules, and performers who look genuinely comfortable on camera. Production quality matters — badly lit, poorly filmed scenes drag down otherwise promising sites.</p>
            <p>Value is relative. Helix Studios at $34.95/month is expensive but delivers cinema-quality production. Next Door Twink at $29.99/month with access to 15 sites is exceptional value. Southern Strokes at $9.95/month annual is the budget pick. The right choice depends entirely on what you value.</p>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default BestTwinkSites;
