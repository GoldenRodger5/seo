import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Layout from "./Layout";
import { PageTransition, StaggerContainer, StaggerChild, MotionCard } from "./MotionWrappers";
import StarRating from "./StarRating";
import VisitSiteButton from "./VisitSiteButton";
import LocalisedPrice from "./LocalisedPrice";
import { SiteData } from "../data/sites";
import { AlternativesBody } from "../data/alternatives-content";
import { currentYear } from "../lib/dates";
import RelatedReading from "./RelatedReading";

export interface SeoLandingPageProps {
  /** URL path, e.g. "/best-bareback-gay-sites" */
  path: string;
  /** <title> content (year suffix appended automatically) */
  title: string;
  /** Meta description */
  description: string;
  /** H1 shown in hero */
  h1: string;
  /** Tag line above the H1 */
  badge: string;
  /** 2-3 sentence intro paragraph */
  intro: string;
  /** Pre-filtered, pre-sorted list of sites to render */
  sites: SiteData[];
  /** Optional commentary block at bottom (renders as paragraphs split on \n\n) */
  closing?: string;
  /** Optional cross-link cards at the end */
  related?: { to: string; label: string }[];
  /** Optional AI-generated long-form body — renders above the site list
   *  when present (used by alternatives pages to surface daily-engine output). */
  aiBody?: AlternativesBody;
  /** Optional buyer's guide section — each entry becomes an H2 + paragraphs.
   *  Renders below the site list, above FAQs. */
  buyersGuide?: { title: string; paragraphs: string[] }[];
  /** Optional FAQ section — adds rendered Q&A list AND FAQPage JSON-LD. */
  faqs?: { q: string; a: string }[];
  /** Optional price comparison table. Renders before buyer's guide. */
  showPriceTable?: boolean;
}

const SeoLandingPage = ({
  path,
  title,
  description,
  h1,
  badge,
  intro,
  sites,
  closing,
  related,
  aiBody,
  buyersGuide,
  faqs,
  showPriceTable,
}: SeoLandingPageProps) => {
  const fullTitle = `${title} (${currentYear}) | TwinkVault`;
  const url = `https://twinkvault.com${path}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
      { "@type": "ListItem", position: 2, name: title, item: url },
    ],
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    numberOfItems: sites.length,
    itemListElement: sites.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `https://twinkvault.com/reviews/${s.slug}`,
    })),
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
          <script type="application/ld+json">{JSON.stringify(itemList)}</script>
          {faqs && faqs.length > 0 && (
            <script type="application/ld+json">{JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            })}</script>
          )}
        </Helmet>

        <section className="hero-mesh py-16">
          <div className="container max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 rounded-button bg-secondary/15 px-3 py-1.5 text-xs font-medium text-secondary">
                {badge}
              </span>
              <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
                {h1}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{intro}</p>
              <nav aria-label="Breadcrumb" className="mt-4 text-xs text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">{title}</span>
              </nav>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-4xl">
            {aiBody && (
              <article className="mb-10 space-y-5 text-sm text-foreground/90 leading-relaxed">
                <p className="text-base">{aiBody.intro}</p>
                <div className="glass-card rounded-lg p-6 border-l-4 border-l-secondary">
                  <h2 className="font-heading text-lg font-bold">Verdict</h2>
                  <p className="mt-2 text-sm text-foreground/90">{aiBody.verdict}</p>
                </div>
              </article>
            )}
            <StaggerContainer className="space-y-4 mb-12">
              {sites.map((site, i) => (
                <StaggerChild key={site.id}>
                  <MotionCard className="glass-card rounded-lg p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                          #{i + 1}
                        </span>
                        <div className="text-center">
                          <p className="text-base font-bold text-emerald-400">
                            <LocalisedPrice usd={site.price_annual} />
                          </p>
                          <p className="text-[10px] text-muted-foreground">per month</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-heading text-lg font-bold">{site.name}</h2>
                          <span className="text-sm font-semibold text-secondary">{site.overall_score}/5</span>
                          {site.badge && (
                            <span className="rounded-button gold-gradient px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                              {site.badge}
                            </span>
                          )}
                        </div>
                        <StarRating score={site.overall_score} size={12} />
                        <p className="mt-1 text-xs text-muted-foreground">{site.short_description}</p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {site.pros.slice(0, 2).map((p) => (
                            <span key={p} className="flex items-center gap-1">
                              <Check size={10} className="text-emerald-400" />
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <div className="flex gap-2">
                          <Link
                            to={`/reviews/${site.slug}`}
                            className="rounded-button border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                          >
                            Read Review
                          </Link>
                          <VisitSiteButton site={site} showDisclosure={false} />
                        </div>
                        {site.deal_discount > 0 && (
                          <Link
                            to={`/discount/${site.slug}`}
                            className="text-center text-[10px] font-medium text-secondary hover:underline"
                          >
                            {site.deal_discount}% off — see deal →
                          </Link>
                        )}
                      </div>
                    </div>
                  </MotionCard>
                </StaggerChild>
              ))}
            </StaggerContainer>

            {showPriceTable && (
              <div className="mb-12">
                <h2 className="font-heading text-2xl font-bold mb-4 heading-gradient inline-block">Price Comparison</h2>
                <div className="overflow-x-auto rounded-lg glass-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold">Site</th>
                        <th className="px-4 py-3 text-center font-semibold">Monthly</th>
                        <th className="px-4 py-3 text-center font-semibold">Annual (per mo)</th>
                        <th className="px-4 py-3 text-center font-semibold">Total/year</th>
                        <th className="px-4 py-3 text-center font-semibold">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s) => {
                        const annualMo = parseFloat(s.price_annual.replace(/[^0-9.]/g, "")) || 0;
                        const totalYr = (annualMo * 12).toFixed(2);
                        return (
                          <tr key={s.id} className="border-b border-border/30">
                            <td className="px-4 py-3 font-semibold">
                              <Link to={`/reviews/${s.slug}`} className="hover:text-secondary transition-colors">{s.name}</Link>
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{s.price_monthly}</td>
                            <td className="px-4 py-3 text-center font-semibold text-emerald-400">{s.price_annual}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">${totalYr}</td>
                            <td className="px-4 py-3 text-center text-secondary">{s.overall_score}/5</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {buyersGuide && buyersGuide.length > 0 && (
              <article className="space-y-8 mb-12 text-muted-foreground leading-relaxed">
                {buyersGuide.map((section) => (
                  <section key={section.title}>
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-3">{section.title}</h2>
                    {section.paragraphs.map((p, i) => (
                      <p key={i} className="mb-3">{p}</p>
                    ))}
                  </section>
                ))}
              </article>
            )}

            {faqs && faqs.length > 0 && (
              <section className="mb-12">
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block mb-4">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {faqs.map((f) => (
                    <details key={f.q} className="glass-card group rounded-lg p-4">
                      <summary className="cursor-pointer list-none font-semibold flex items-center justify-between text-sm">
                        {f.q}
                        <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
                      </summary>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {closing && (
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {closing.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border/50 pt-6 text-sm">
              <Link to="/methodology" className="inline-flex items-center gap-1 font-medium text-secondary hover:underline">
                How we score sites <ArrowRight size={12} />
              </Link>
              {related?.map((r) => (
                <Link key={r.to} to={r.to} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  {r.label} <ArrowRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        </section>
        <RelatedReading sourceType="landing" currentPath={path} />
      </PageTransition>
    </Layout>
  );
};

export default SeoLandingPage;
