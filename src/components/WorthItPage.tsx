import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, X as XIcon, ArrowRight } from "lucide-react";
import Layout from "./Layout";
import { PageTransition, MotionCard } from "./MotionWrappers";
import StarRating from "./StarRating";
import VisitSiteButton from "./VisitSiteButton";
import OutboundLink from "./OutboundLink";
import LocalisedPrice from "./LocalisedPrice";
import SitePlaceholderImage from "./SitePlaceholderImage";
import { SiteData, isAffiliated, getSiteBySlug } from "../data/sites";
import { getVerdict } from "../data/site-verdicts";
import { getWorthItBody } from "../data/isworthit-content";
import { getSimilarSites } from "../lib/similarSites";
import { currentYear } from "../lib/dates";

/**
 * Hand-picked alternatives for sites with no affiliate program. The
 * editorial review and #1 ranking stand on their own — but visitors
 * who want to subscribe via our link deserve a clearly-framed pivot
 * to a comparable site we can actually be paid to refer.
 *
 * Helix Studios → Sean Cody:
 *   - Both premium tier, both 20+ year exclusive rosters
 *   - Sean Cody covers the athletic / all-American niche that
 *     overlaps significantly with Helix's twink-leaning casting
 *   - Active 75% deal (vs Helix's 66%) actually makes Sean Cody
 *     a stronger value when factoring discount
 *   - HelixCash affiliate program confirmed dormant 2026-05-15
 *     after multiple bounce-backs from their mail server.
 */
const HARDCODED_ALTERNATIVES: Record<string, string> = {
  "helix-studios": "sean-cody",
};

function pickAlternative(site: SiteData): SiteData | null {
  const hardcoded = HARDCODED_ALTERNATIVES[site.slug];
  if (hardcoded) {
    const alt = getSiteBySlug(hardcoded);
    if (alt && isAffiliated(alt)) return alt;
  }
  // Fallback: top affiliated similar site (getSimilarSites already filters
  // by isAffiliated and weights niche overlap, so the first result is the
  // closest monetizable match).
  const similar = getSimilarSites(site.slug, 1);
  return similar[0] ?? null;
}

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
        </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

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
                  {isAffiliated(site) ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <VisitSiteButton site={site} className="flex-1 max-w-xs" ctaPosition="hero" />
                      <Link
                        to={`/reviews/${site.slug}`}
                        className="flex-1 max-w-xs rounded-button border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        Full Review →
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to={`/reviews/${site.slug}`}
                      className="mt-4 inline-flex w-full max-w-xs items-center justify-center rounded-button border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      Full Review →
                    </Link>
                  )}
                </div>
              </div>
            </MotionCard>

            {/* Alternative-recommendation block for unaffiliated sites.
                Editorial review stays intact — this block is the only
                conversion path on the page since we can't refer to the
                subject site directly. */}
            {!isAffiliated(site) && (() => {
              const alt = pickAlternative(site);
              if (!alt) return null;
              const dealLine = alt.deal_discount > 0
                ? `, plus an active ${alt.deal_discount}% off deal`
                : "";
              return (
                <MotionCard className="glass-card rounded-lg p-6 border border-secondary/40">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary mb-3">
                    ⚡ Alternative we can recommend
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {site.name} doesn't offer affiliate tracking, so we recommend{" "}
                    <strong className="text-foreground">{alt.name}</strong> as the closest comparable option.
                    Same premium tier, same production quality{dealLine}.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <OutboundLink
                      site={alt}
                      ctaPosition="hero"
                      sourceTypeOverride="worth-it-alternative"
                      className="cta-btn gold-gradient inline-flex items-center justify-center gap-2 rounded-button px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
                    >
                      Visit {alt.name} <ArrowRight size={13} />
                    </OutboundLink>
                    <Link
                      to={`/reviews/${alt.slug}`}
                      className="inline-flex items-center justify-center gap-1 rounded-button border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      Read {alt.name} review
                    </Link>
                  </div>
                  <p className="mt-4 text-[11px] text-muted-foreground italic leading-relaxed">
                    We rank {site.name} #{site.rank} in our reviews — if you can subscribe directly that's the best option. We just can't track affiliate referrals to {site.name} specifically, so we surface our next-best pick for visitors who want to subscribe through our link.
                  </p>
                </MotionCard>
              );
            })()}

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
              {isAffiliated(site) ? (
                <div className="mt-4">
                  <VisitSiteButton site={site} ctaPosition="final" />
                </div>
              ) : (() => {
                const alt = pickAlternative(site);
                if (!alt) return null;
                return (
                  <div className="mt-4">
                    <OutboundLink
                      site={alt}
                      ctaPosition="final"
                      sourceTypeOverride="worth-it-alternative"
                      className="cta-btn gold-gradient inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground"
                    >
                      Subscribe via {alt.name} (our alternative pick) <ArrowRight size={14} />
                    </OutboundLink>
                  </div>
                );
              })()}
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
