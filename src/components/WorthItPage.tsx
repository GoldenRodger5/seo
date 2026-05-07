import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, X as XIcon, ArrowRight } from "lucide-react";
import Layout from "./Layout";
import { PageTransition, MotionCard } from "./MotionWrappers";
import StarRating from "./StarRating";
import VisitSiteButton from "./VisitSiteButton";
import LocalisedPrice from "./LocalisedPrice";
import SitePlaceholderImage from "./SitePlaceholderImage";
import { SiteData, isAffiliated } from "../data/sites";
import { getVerdict } from "../data/site-verdicts";
import { getWorthItBody } from "../data/isworthit-content";
import { currentYear } from "../lib/dates";

type Verdict = "yes" | "no" | "depends";

const verdictFromScore = (score: number): Verdict => {
  if (score >= 4.3) return "yes";
  if (score >= 3.8) return "depends";
  return "no";
};

const verdictCopy: Record<Verdict, { label: string; color: string; sentence: (name: string) => string }> = {
  yes: {
    label: "Yes",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    sentence: (name) => `${name} is worth subscribing to.`,
  },
  depends: {
    label: "Depends",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    sentence: (name) => `${name} is worth it for the right kind of subscriber. Check the breakdown below.`,
  },
  no: {
    label: "No",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    sentence: (name) => `${name} is not what we'd recommend at the current price. There are stronger picks in the same niche.`,
  },
};

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}/100</span>
    </div>
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full gold-gradient transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const WorthItPage = ({ site }: { site: SiteData }) => {
  const path = `/is-${site.slug}-worth-it`;
  const url = `https://twinkvault.com${path}`;
  const fullTitle = `Is ${site.name} Worth It? (${currentYear} Review) | TwinkVault`;
  const description = `Honest answer to "is ${site.name} worth it" — ${site.overall_score}/5 score, monthly vs annual pricing breakdown, real pros and cons, and the bottom line.`;
  const verdict = verdictFromScore(site.overall_score);
  const v = verdictCopy[verdict];
  const editorialVerdict = getVerdict(site.slug);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
      { "@type": "ListItem", position: 2, name: `Is ${site.name} Worth It?`, item: url },
    ],
  };

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{fullTitle}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={url} />
          <meta property="og:url" content={url} />
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={description} />
          <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        </Helmet>

        <section className="hero-mesh py-12">
          <div className="container max-w-3xl">
            <motion.nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to={`/reviews/${site.slug}`} className="hover:text-foreground transition-colors">{site.name} Review</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Is It Worth It?</span>
            </motion.nav>

            <motion.h1 className="hero-heading font-heading font-bold heading-gradient inline-block" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              Is {site.name} Worth It?
            </motion.h1>

            <motion.div
              className={`mt-6 inline-flex items-center gap-2 rounded-button border px-4 py-2 text-sm font-semibold ${v.color}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              Verdict: {v.label}
            </motion.div>
            <p className="mt-3 text-base text-foreground/90 max-w-2xl">{v.sentence(site.name)}</p>
            {editorialVerdict && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{editorialVerdict}</p>
            )}
          </div>
        </section>

        <section className="py-10">
          <div className="container max-w-3xl space-y-8">
            <MotionCard className="glass-card rounded-lg p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="sm:w-48 shrink-0">
                  <SitePlaceholderImage site={site} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className="font-heading text-2xl font-bold">{site.name}</h2>
                    <span className="text-lg font-semibold text-secondary">{site.overall_score}/5</span>
                  </div>
                  <StarRating score={site.overall_score} />
                  <p className="mt-3 text-sm text-muted-foreground">{site.short_description}</p>
                  {isAffiliated(site) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <VisitSiteButton site={site} className="flex-1 max-w-xs" />
                      <Link
                        to={`/reviews/${site.slug}`}
                        className="flex-1 max-w-xs rounded-button border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        Full Review →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </MotionCard>

            <MotionCard className="glass-card rounded-lg p-6">
              <h2 className="font-heading text-lg font-bold mb-4">Score Breakdown</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <ScoreBar label="Content Quality" value={site.content_quality} />
                <ScoreBar label="Value for Money" value={site.value_score} />
                <ScoreBar label="Update Frequency" value={site.update_frequency} />
                <ScoreBar label="Mobile Experience" value={site.mobile_score} />
              </div>
            </MotionCard>

            <MotionCard className="glass-card rounded-lg p-6">
              <h2 className="font-heading text-lg font-bold mb-4">Price Analysis</h2>
              <div className="grid gap-4 sm:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="text-lg font-semibold"><LocalisedPrice usd={site.price_monthly} /></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quarterly</p>
                  <p className="text-lg font-semibold"><LocalisedPrice usd={site.price_quarterly} /></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Annual (per month)</p>
                  <p className="text-lg font-semibold text-emerald-400"><LocalisedPrice usd={site.price_annual} /></p>
                </div>
              </div>
              {site.deal_discount > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Going annual saves {site.deal_discount}% vs the monthly rate. {site.deal_text}.
                </p>
              )}
            </MotionCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <MotionCard className="glass-card rounded-lg p-6">
                <h2 className="font-heading text-base font-bold mb-3 text-emerald-400">Pros</h2>
                <ul className="space-y-2 text-sm">
                  {site.pros.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span className="text-muted-foreground">{p}</span>
                    </li>
                  ))}
                </ul>
              </MotionCard>
              <MotionCard className="glass-card rounded-lg p-6">
                <h2 className="font-heading text-base font-bold mb-3 text-muted-foreground">Cons</h2>
                <ul className="space-y-2 text-sm">
                  {site.cons.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <XIcon size={14} className="mt-0.5 shrink-0 text-muted-foreground/50" />
                      <span className="text-muted-foreground/80">{c}</span>
                    </li>
                  ))}
                </ul>
              </MotionCard>
            </div>

            {/* AI-generated long-form body (renders above the auto-derived
                Bottom Line when isworthit-content.ts has an entry). */}
            {(() => {
              const ai = getWorthItBody(site.slug);
              if (!ai) return null;
              return (
                <article className="space-y-5 text-sm text-foreground/90 leading-relaxed">
                  <p className="text-base">{ai.intro}</p>
                  {ai.sections.map((s) => (
                    <section key={s.h2}>
                      <h3 className="font-heading text-base font-bold">{s.h2}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{s.content}</p>
                    </section>
                  ))}
                  <p className="text-sm text-muted-foreground">{ai.conclusion}</p>
                </article>
              );
            })()}

            <MotionCard className="glass-card rounded-lg p-6 border-l-4 border-l-secondary">
              <h2 className="font-heading text-lg font-bold">Bottom Line</h2>
              <p className="mt-2 text-sm text-foreground/90">
                {site.name} scores {site.overall_score}/5 overall. {site.best_for ? `Best for: ${site.best_for}.` : ""} The annual plan at <LocalisedPrice usd={site.price_annual} /> is the only commitment we'd recommend — monthly billing is rarely worth it on this site or any other.
              </p>
              {isAffiliated(site) && (
                <div className="mt-4">
                  <VisitSiteButton site={site} />
                </div>
              )}
            </MotionCard>

            <div className="flex flex-wrap items-center gap-4 border-t border-border/50 pt-6 text-sm">
              <Link to="/methodology" className="inline-flex items-center gap-1 font-medium text-secondary hover:underline">
                How we score sites <ArrowRight size={12} />
              </Link>
              <Link to="/top-sites" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                Full rankings <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default WorthItPage;
