import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { DollarSign, Check, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition, StaggerContainer, StaggerChild, MotionCard } from "../components/MotionWrappers";
import StarRating from "../components/StarRating";
import VisitSiteButton from "../components/VisitSiteButton";
import { sites } from "../data/sites";

// Sort by annual price ascending
const byPrice = [...sites].sort((a, b) => {
  const aPrice = parseFloat(a.price_annual.replace(/[^0-9.]/g, ""));
  const bPrice = parseFloat(b.price_annual.replace(/[^0-9.]/g, ""));
  return aPrice - bPrice;
});

const CheapestTwinkSites = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>Cheapest Gay Twink Sites 2026 — Best Value Subscriptions | TwinkVault</title>
        <meta name="description" content="The most affordable gay twink sites in 2026 ranked by value. Get quality content without overpaying — best cheap twink site subscriptions." />
        <link rel="canonical" href="https://twinkvault.com/cheapest-twink-sites" />
      </Helmet>

      <section className="hero-mesh py-16">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-button bg-secondary/15 px-3 py-1.5 text-xs font-medium text-secondary">
              <DollarSign size={12} /> Best Value 2026
            </span>
            <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
              Cheapest Twink Sites
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Quality content doesn't have to be expensive. Here's every twink site ranked by annual price — cheapest first, with honest scores so you don't waste money on bad value.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-4xl">

          {/* Featured snippet */}
          <motion.div
            className="glass-card rounded-lg p-6 border-l-4 border-l-secondary mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-heading text-lg font-bold">Cheapest Twink Sites in 2026</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The cheapest twink sites on an annual plan are <strong className="text-foreground">Southern Strokes</strong>, <strong className="text-foreground">Athletic Twinks</strong>, and <strong className="text-foreground">Twinks in Shorts</strong> — all at $9.95/mo when billed annually.
              For pure value, <strong className="text-foreground">Next Door World</strong> at $12/mo annual unlocks 15 sites — easily the cheapest per-site cost available.
            </p>
          </motion.div>

          {/* Price comparison table */}
          <div className="glass-card rounded-lg overflow-x-auto mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold">Site</th>
                  <th className="px-4 py-3 text-center font-semibold">Annual/mo</th>
                  <th className="px-4 py-3 text-center font-semibold">Monthly</th>
                  <th className="px-4 py-3 text-center font-semibold">Score</th>
                  <th className="px-4 py-3 text-center font-semibold">Trial</th>
                </tr>
              </thead>
              <tbody>
                {byPrice.map((site, i) => (
                  <tr key={site.id} className={`border-b border-border/30 ${i === 0 ? "bg-secondary/5" : ""}`}>
                    <td className="px-4 py-3">
                      <Link to={`/reviews/${site.slug}`} className="font-semibold hover:text-secondary transition-colors">
                        {site.name}
                      </Link>
                      {i === 0 && <span className="ml-2 rounded-button gold-gradient px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">Cheapest</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-400">{site.price_annual}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{site.price_monthly}</td>
                    <td className="px-4 py-3 text-center">{site.overall_score}/5</td>
                    <td className="px-4 py-3 text-center">{site.has_free_trial ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading text-2xl font-bold mb-6 heading-gradient inline-block">Ranked: Cheapest to Most Expensive</h2>
          <StaggerContainer className="space-y-4 mb-12">
            {byPrice.map((site, i) => (
              <StaggerChild key={site.id}>
                <MotionCard className="glass-card rounded-lg p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        #{i + 1}
                      </span>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">{site.price_annual}</p>
                        <p className="text-[10px] text-muted-foreground">per month</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-lg font-bold">{site.name}</h3>
                        {site.badge && <span className="rounded-button gold-gradient px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">{site.badge}</span>}
                      </div>
                      <StarRating score={site.overall_score} size={12} />
                      <p className="mt-1 text-xs text-muted-foreground">{site.short_description}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {site.pros.slice(0, 2).map(p => (
                          <span key={p} className="flex items-center gap-1"><Check size={10} className="text-emerald-400" />{p}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link to={`/reviews/${site.slug}`} className="rounded-button border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
                        Review
                      </Link>
                      <VisitSiteButton site={site} showDisclosure={false} />
                    </div>
                  </div>
                </MotionCard>
              </StaggerChild>
            ))}
          </StaggerContainer>

          <div className="space-y-5 text-muted-foreground leading-relaxed">
            <h2 className="font-heading text-2xl font-bold text-foreground">How to Get Cheap Twink Site Access</h2>
            <p>The single most effective way to reduce cost is to pay annually rather than monthly. Most sites offer 60-70% discounts on annual plans — Helix Studios drops from $34.95/month to $11.99/month, a saving of over $275 per year. If you're confident you'll use a site, the annual plan is almost always the right choice.</p>
            <p>The second strategy is network memberships. Next Door World gives you 15 sites for $12/month annually. Even if you only regularly use 3-4 of those sites, that's less than $4 per site — far cheaper than individual subscriptions.</p>
            <p>We do not recommend the very cheapest option if the content quality is poor. A site scoring below 3.5/5 at any price is not good value. The sweet spot is sites scoring 4.0+ at under $12/month annually — Southern Strokes, Athletic Twinks, and Twinks in Shorts all fit this profile.</p>
            <div className="flex flex-wrap gap-3 pt-4">
              <Link to="/best-deals" className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline">
                See All Current Deals <ArrowRight size={14} />
              </Link>
              <Link to="/top-sites" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                Full Rankings <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default CheapestTwinkSites;
