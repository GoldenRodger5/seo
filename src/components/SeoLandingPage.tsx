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
import { currentYear } from "../lib/dates";

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
      </PageTransition>
    </Layout>
  );
};

export default SeoLandingPage;
