import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, Crown, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import Breadcrumbs from "../components/Breadcrumbs";
import LocalisedPrice from "../components/LocalisedPrice";
import { PageTransition, StaggerContainer, StaggerChild, MotionCard } from "../components/MotionWrappers";
import StarRating from "../components/StarRating";
import ScoreRing from "../components/ScoreRing";
import VisitSiteButton from "../components/VisitSiteButton";
import { sites } from "../data/sites";
import { currentYear, currentMonthLong } from "../lib/dates";
import { sitesCountLabel, TOTAL_SITES } from "../lib/siteStats";

const sorted = [...sites].sort((a, b) => a.rank - b.rank);

const BestTwinkSites = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>{`Best Twink Porn Sites ${currentYear} — Top ${sitesCountLabel} Ranked & Reviewed | TwinkVault`}</title>
        <meta name="description" content={`The definitive list of the best twink porn sites in ${currentYear}. Independent rankings of every major gay porn site with real pricing, honest scores, and exclusive deals.`} />
        <link rel="canonical" href="https://twinkvault.com/best-twink-sites" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Best Twink Sites {currentYear}",
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
        <div className="container max-w-4xl">
          <Breadcrumbs
            className="mb-6"
            items={[{ label: "Home", to: "/" }, { label: "Best Twink Sites" }]}
          />
        </div>
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-button bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">
              <Crown size={12} /> {`Updated ${currentMonthLong} ${currentYear}`}
            </span>
            <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
              Best Twink Porn Sites {currentYear}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              The most comprehensive rankings of twink porn sites available — covering every major gay porn site we've tested. {TOTAL_SITES} sites scored on content quality, value, update frequency, and mobile UX. No site paid to be here.
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
            <h2 className="font-heading text-lg font-bold">Quick Answer: Best Twink Porn Sites in {currentYear}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              The best twink porn site in {currentYear} is <strong className="text-foreground">Helix Studios</strong> (4.8/5) for premium production quality — the cinematic end of the gay porn spectrum.
              For best value, <strong className="text-foreground">Next Door Twink</strong> gives access to the 45+ channel ASGmax network for just $10.95/mo annually.
              For British twink porn content, <strong className="text-foreground">Hard Brit Lads</strong> leads the field. Full rankings below.
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
                        <span>From <strong className="text-foreground"><LocalisedPrice usd={site.price_annual} /></strong> annual</span>
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
            <h2 className="font-heading text-2xl font-bold text-foreground">How We Actually Score Twink Porn Sites</h2>
            <p>We don't trust trailers. Every twink porn site on this list was tested with a paid membership — we browsed the member area, tested search, streamed on mobile, and checked if the "weekly updates" claim was real. Most gay porn site review aggregators just look at the tour page. We log in.</p>
            <p>Scores are based on four things: content quality (are scenes well-lit, well-shot, with performers who seem into it?), value (what do you get per dollar?), update frequency (does the site actually release new content regularly?), and mobile (does it work on your phone without being painful?). Each is scored out of 100. The overall rating is a weighted average.</p>
            <p>No site has paid us to rank higher. We earn affiliate commissions on some links, but the scores are entirely ours. When sites raise prices or stop updating, we drop their scores the same month.</p>
            <h2 className="font-heading text-2xl font-bold text-foreground">What Separates the Best Twink Porn Sites From the Worst</h2>
            <p>The difference between a 4.8 and a 3.7 usually comes down to two things: production quality and library depth. Helix Studios at $34.95/month is expensive, but the scenes look like they were shot by people who know what they're doing. Compare that to gay porn sites where half the library is 480p footage from 2014 — you feel the gap immediately.</p>
            <p>For most people, the sweet spot is Next Door Twink at $10.95/month on the annual plan. You get the full ASGmax network — 45+ channels, 12,500+ videos, twink porn ranging from amateur to studio quality. Southern Strokes at $9.95/month annual is the sleeper pick if you want something cheaper with a more specific focus. Whichever you pick, the rankings above are the honest answer to "which twink porn sites are actually worth paying for."</p>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default BestTwinkSites;
