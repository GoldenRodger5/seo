import { Link, useParams } from "react-router-dom";
import OutboundLink from "../components/OutboundLink";
import { ArrowRight, Check, X as XIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import ScoreRing from "../components/ScoreRing";
import StarRating from "../components/StarRating";
import { getSiteBySlug, sites, SiteData, getVisitUrl, isAffiliated } from "../data/sites";
import { PageTransition } from "../components/MotionWrappers";

// Auto-generate all possible pairs from real sites
const comparePairs = sites.flatMap((siteA, i) =>
  sites.slice(i + 1).map((siteB) => ({ a: siteA.slug, b: siteB.slug }))
);

const scoreColor = (val: number, max: number) => {
  const ratio = val / max;
  if (ratio >= 0.85) return "text-emerald-400";
  if (ratio >= 0.7) return "text-secondary";
  return "text-destructive";
};

const CompareColumn = ({ site }: { site: SiteData }) => (
  <div className="glass-card rounded-lg p-6 flex-1">
    <div className="flex justify-center">
      <ScoreRing score={site.overall_score} size={80} />
    </div>
    <h2 className="mt-4 text-center font-heading text-xl font-bold">{site.name}</h2>
    <div className="mt-2 flex justify-center">
      <StarRating score={site.overall_score} size={14} />
    </div>
    <p className="mt-3 text-center text-lg font-semibold">{site.price_monthly}</p>
    <div className="mt-4 space-y-1.5">
      {site.pros.map((p) => (
        <div key={p} className="flex items-start gap-2 text-sm">
          <Check size={12} className="mt-0.5 shrink-0 text-emerald-400" />
          <span className="text-muted-foreground text-xs">{p}</span>
        </div>
      ))}
      {site.cons.map((c) => (
        <div key={c} className="flex items-start gap-2 text-sm">
          <XIcon size={12} className="mt-0.5 shrink-0 text-muted-foreground/50" />
          <span className="text-muted-foreground/70 text-xs">{c}</span>
        </div>
      ))}
    </div>
    <OutboundLink
      site={site}
      className={`cta-btn mt-4 flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground ${!isAffiliated(site) ? "opacity-85" : ""}`}
    >
      Visit Site <ArrowRight size={14} />
    </OutboundLink>
    <p className="mt-1 text-center text-[9px] text-muted-foreground">Opens in new tab{isAffiliated(site) ? " · Affiliate link" : ""}</p>
  </div>
);

const criteria = [
  { label: "Content Quality", key: "content_quality" as const, max: 100 },
  { label: "Value for Money", key: "value_score" as const, max: 100 },
  { label: "Update Frequency", key: "update_frequency" as const, max: 100 },
  { label: "Mobile Experience", key: "mobile_score" as const, max: 100 },
  { label: "Overall Score", key: "overall_score" as const, max: 5 },
];

const ComparePage = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !slug.includes("-vs-")) {
    // Index page
    return (
      <Layout>
        <PageTransition>
          <Helmet>
            <title>Compare Twink Sites — Side by Side | TwinkVault</title>
            <meta name="description" content="Compare the best twink content sites side by side. See scores, prices, and features at a glance." />
          </Helmet>
          <section className="py-16">
            <div className="container">
              <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">Compare Sites</h1>
              <p className="mt-4 text-muted-foreground">Side-by-side comparisons to help you choose.</p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {comparePairs.map(({ a, b }) => {
                  const siteA = getSiteBySlug(a);
                  const siteB = getSiteBySlug(b);
                  if (!siteA || !siteB) return null;
                  return (
                    <Link
                      key={`${a}-${b}`}
                      to={`/compare/${a}-vs-${b}`}
                      className="card-glow glass-card rounded-lg p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-semibold">{siteA.name}</span>
                        <span className="text-xs font-bold text-primary">VS</span>
                        <span className="font-heading font-semibold">{siteB.name}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{siteA.overall_score}/5</span>
                        <span>{siteB.overall_score}/5</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </PageTransition>
      </Layout>
    );
  }

  const [slugA, slugB] = slug.split("-vs-");
  const siteA = getSiteBySlug(slugA);
  const siteB = getSiteBySlug(slugB);

  if (!siteA || !siteB) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-2xl font-bold">Comparison not found</h1>
          <Link to="/compare" className="mt-4 inline-block text-secondary">View all comparisons →</Link>
        </div>
      </Layout>
    );
  }

  const winner = siteA.overall_score >= siteB.overall_score ? siteA : siteB;
  const budgetPick = parseFloat(siteA.price_annual.replace(/[^0-9.]/g, "")) <= parseFloat(siteB.price_annual.replace(/[^0-9.]/g, "")) ? siteA : siteB;

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{siteA.name} vs {siteB.name} — Which Is Worth It? (2026) | TwinkVault</title>
          <meta name="description" content={`Compare ${siteA.name} vs ${siteB.name} side by side. Scores, pricing, pros and cons to help you decide.`} />
        </Helmet>
        <section className="py-16">
          <div className="container max-w-4xl">
            <h1 className="text-center font-heading text-2xl font-bold md:text-4xl heading-gradient inline-block w-full">
              {siteA.name} vs {siteB.name}
            </h1>
            <p className="mt-2 text-center text-muted-foreground">Which Is Worth It? (2026)</p>

            {/* BLUF Summary */}
            <div className="mt-8 glass-card rounded-lg p-6 border-l-4 border-l-secondary">
              <h2 className="font-heading text-lg font-bold text-secondary">Bottom Line Up Front</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {winner.name} takes the overall win with a {winner.overall_score}/5 score, excelling in {winner.content_quality >= winner.value_score ? "content quality" : "value for money"}.
                {budgetPick.id !== winner.id
                  ? ` However, ${budgetPick.name} at ${budgetPick.price_annual}/mo (annual) is the smarter pick if you're watching your budget.`
                  : ` It also happens to be the more affordable option at ${winner.price_annual}/mo on the annual plan.`}
              </p>
            </div>

            {/* Intro section */}
            <div className="mt-6 text-sm text-muted-foreground leading-relaxed space-y-4">
              <p>
                Choosing between {siteA.name} vs {siteB.name} comes down to what you value most in a twink content site.
                Both are popular choices in the space, but they serve different audiences and priorities. We've tested both
                with active paid subscriptions to give you an honest, side-by-side comparison.
              </p>
              <p>
                {siteA.name} scores {siteA.overall_score}/5 overall with a content quality rating of {siteA.content_quality}/100,
                while {siteB.name} comes in at {siteB.overall_score}/5 with {siteB.content_quality}/100 for content quality.
                At {siteA.price_monthly} vs {siteB.price_monthly} per month, pricing is also a factor worth considering. Below, we break
                down every category so you can decide which site is right for you.
              </p>
            </div>

            {/* Side by side cards */}
            <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-start">
              <CompareColumn site={siteA} />
              <div className="flex items-center justify-center md:mt-24">
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-full glass-card text-primary font-heading font-bold text-lg"
                  style={{ boxShadow: "0 0 20px hsl(263, 70%, 58%, 0.3)" }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  VS
                </motion.div>
              </div>
              <CompareColumn site={siteB} />
            </div>

            {/* Comparison table */}
            <div className="mt-12 glass-card rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">Criteria</th>
                    <th className="px-4 py-3 text-center font-semibold">{siteA.name}</th>
                    <th className="px-4 py-3 text-center font-semibold">{siteB.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c) => (
                    <tr key={c.key} className="border-b border-border/30">
                      <td className="px-4 py-3 text-muted-foreground">{c.label}</td>
                      <td className={`px-4 py-3 text-center font-semibold ${scoreColor(siteA[c.key], c.max)}`}>
                        {siteA[c.key]}{c.max === 100 ? "/100" : "/5"}
                      </td>
                      <td className={`px-4 py-3 text-center font-semibold ${scoreColor(siteB[c.key], c.max)}`}>
                        {siteB[c.key]}{c.max === 100 ? "/100" : "/5"}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3 text-muted-foreground">Price</td>
                    <td className="px-4 py-3 text-center font-semibold">{siteA.price_monthly}</td>
                    <td className="px-4 py-3 text-center font-semibold">{siteB.price_monthly}</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3 text-muted-foreground">Free Trial</td>
                    <td className="px-4 py-3 text-center">
                      {siteA.has_free_trial ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {siteB.has_free_trial ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">HD Quality</td>
                    <td className="px-4 py-3 text-center">
                      {siteA.has_hd ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {siteB.has_hd ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Verdict */}
            <div className="mt-10 glass-card rounded-lg p-8 text-center">
              <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Our Verdict</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-secondary/30 p-4">
                  <p className="text-sm text-muted-foreground">Overall Winner</p>
                  <p className="mt-1 font-heading text-xl font-bold">{winner.name}</p>
                  <p className="text-xs text-muted-foreground">Best for quality & experience</p>
                </div>
                <div className="rounded-lg border border-primary/30 p-4">
                  <p className="text-sm text-muted-foreground">Budget Pick</p>
                  <p className="mt-1 font-heading text-xl font-bold">{budgetPick.name}</p>
                  <p className="text-xs text-muted-foreground">Best for value</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link to="/compare" className="text-sm text-secondary hover:underline">
                See more comparisons →
              </Link>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default ComparePage;
