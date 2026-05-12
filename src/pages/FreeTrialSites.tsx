import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Gift, Check, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition, StaggerContainer, StaggerChild, MotionCard } from "../components/MotionWrappers";
import StarRating from "../components/StarRating";
import VisitSiteButton from "../components/VisitSiteButton";
import LocalisedPrice from "../components/LocalisedPrice";
import { sites } from "../data/sites";
import { currentYear } from "../lib/dates";

const trialSites = sites.filter(s => s.has_free_trial).sort((a, b) => a.rank - b.rank);
const noTrialSites = sites.filter(s => !s.has_free_trial).sort((a, b) => a.rank - b.rank).slice(0, 4);

const FreeTrialSites = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>{`Twink Porn Sites with Free Trials ${currentYear} — Try Before You Buy | TwinkVault`}</title>
        <meta name="description" content={`The best twink porn sites offering free trials in ${currentYear}. Try every major gay porn site before you commit — verified trial offers with no hidden fees.`} />
        <link rel="canonical" href="https://twinkvault.com/free-trial-twink-sites" />
      </Helmet>

      <section className="hero-mesh py-16">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-button bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <Gift size={12} /> Try Before You Buy
            </span>
            <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
              Twink Porn Sites with Free Trials
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Don't commit blind to a gay porn site you've never used. These twink porn sites offer trial memberships so you can test the actual content before paying full price — verified offers, no hidden gotchas.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-4xl">

          {/* Featured snippet box */}
          <motion.div
            className="glass-card rounded-lg p-6 border-l-4 border-l-emerald-500 mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-heading text-lg font-bold">Best Free Trial Twink Sites in {currentYear}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The ASGmax network (Next Door Twink / Next Door World) offers a <strong className="text-foreground">$2.95 three-day trial</strong> — the cheapest way to test 45+ channels and 12,500+ videos.
              On the annual plan, it drops to just $10.95/mo — one of the best values in the space.
              Always check directly with the site for current trial availability, as promotions change frequently.
            </p>
          </motion.div>

          <h2 className="font-heading text-2xl font-bold mb-6 heading-gradient inline-block">Sites Offering Trials</h2>
          <StaggerContainer className="space-y-4 mb-12">
            {trialSites.map((site) => (
              <StaggerChild key={site.id}>
                <MotionCard className="glass-card rounded-lg p-6 border border-emerald-500/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-xl font-bold">{site.name}</h3>
                        <span className="rounded-button bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          ✓ Trial Available
                        </span>
                      </div>
                      <StarRating score={site.overall_score} size={13} />
                      <p className="mt-2 text-sm text-muted-foreground">{site.short_description}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="text-emerald-400 font-semibold">{site.deal_text}</span>
                        <span>Then <LocalisedPrice usd={site.price_monthly} /></span>
                        <span>Annual: <LocalisedPrice usd={site.price_annual} /></span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {site.pros.slice(0, 3).map(p => (
                          <span key={p} className="flex items-center gap-1"><Check size={11} className="text-emerald-400" />{p}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 sm:w-40">
                      <VisitSiteButton site={site} showDisclosure={false} />
                      <Link to={`/reviews/${site.slug}`} className="rounded-button border border-primary px-4 py-2 text-center text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
                        Read Review <ArrowRight size={11} className="inline" />
                      </Link>
                    </div>
                  </div>
                </MotionCard>
              </StaggerChild>
            ))}
          </StaggerContainer>

          <h2 className="font-heading text-2xl font-bold mb-2 heading-gradient inline-block">Top Rated (No Trial)</h2>
          <p className="mb-6 text-sm text-muted-foreground">These don't offer trials but consistently rank as our top overall picks.</p>
          <StaggerContainer className="space-y-4 mb-12">
            {noTrialSites.map((site) => (
              <StaggerChild key={site.id}>
                <MotionCard className="glass-card rounded-lg p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold">{site.name}</h3>
                      <StarRating score={site.overall_score} size={12} />
                      <p className="mt-1 text-xs text-muted-foreground"><LocalisedPrice usd={site.price_monthly} /> · <LocalisedPrice usd={site.price_annual} /> annual</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link to={`/reviews/${site.slug}`} className="rounded-button border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
                        Review
                      </Link>
                      <VisitSiteButton site={site} showDisclosure={false} className="text-xs px-3 py-2" />
                    </div>
                  </div>
                </MotionCard>
              </StaggerChild>
            ))}
          </StaggerContainer>

          {/* SEO content */}
          <div className="space-y-5 text-muted-foreground leading-relaxed">
            <h2 className="font-heading text-2xl font-bold text-foreground">Are These Twink Porn Trials Actually Worth It?</h2>
            <p>Yes — and here's why. Tour pages on every gay porn site are pure marketing. They show the best 5 scenes, the hottest performers, and hide the fact that half the library might be 480p from 2015. A trial lets you log in and see what you're actually buying: the real library depth, the streaming quality on your device, whether the search works, and how often they actually upload new content.</p>
            <p>The ASGmax $2.95 trial is the best deal in the twink porn space. Three days, 45+ channels, 12,500+ videos. That's enough time to know if it's for you. If it is, switch to the $10.95/mo annual plan — at that price, the trial almost isn't necessary, but it's nice to have the option.</p>
            <p>For gay porn sites without trials, look at the annual price. If it's under $10/mo and the site scores above 4.0, the risk is low enough that you probably don't need a trial anyway.</p>
          </div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default FreeTrialSites;
