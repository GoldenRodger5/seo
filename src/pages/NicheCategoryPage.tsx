import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { NICHE_IMAGERY } from "@/data/hub-imagery";
import SmartImage from "@/components/common/SmartImage";
import Layout from "../components/Layout";
import { PageTransition, StaggerContainer, StaggerChild } from "../components/MotionWrappers";
import FeaturedDealBanner from "../components/common/FeaturedDealBanner";
import SiteCard from "../components/SiteCard";
import LandingDataBlock from "../components/LandingDataBlock";
import Breadcrumbs from "../components/Breadcrumbs";
import { sites, isEditorialOnly, isPendingReview } from "../data/sites";
import { getNiche } from "../data/niches";
import { siteNicheMap } from "../data/site-niches";
import { currentYear } from "../lib/dates";

const NicheCategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const niche = slug ? getNiche(slug) : undefined;

  if (!slug || !niche) {
    return <Navigate to="/reviews" replace />;
  }

  const matching = sites
    .filter((s) => (siteNicheMap[s.slug] ?? []).includes(niche.slug))
    .filter((s) => !isEditorialOnly(s) && !isPendingReview(s))
    .sort((a, b) => b.overall_score - a.overall_score);

  const related = niche.related
    .map(getNiche)
    .filter((n): n is NonNullable<typeof n> => Boolean(n));

  const url = `https://twinkvault.com/niche/${niche.slug}`;
  const title = `${niche.seoTitle} ${currentYear} | TwinkVault`;

  const fullListMap: Record<string, { path: string; label: string }> = {
    bareback: { path: "/best-bareback-gay-sites", label: "See full bareback list" },
    asian: { path: "/best-asian-gay-sites", label: "See full Asian gay sites list" },
    amateur: { path: "/best-amateur-gay-sites", label: "See full amateur list" },
    daddy: { path: "/best-daddy-twink-sites", label: "See full daddy/twink list" },
  };
  const fullList = fullListMap[niche.slug];

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{title}</title>
          <meta name="description" content={niche.seoDescription} />
          <link rel="canonical" href={url} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={niche.seoDescription} />
          <meta property="og:url" content={url} />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={niche.seoDescription} />
        </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
              { "@type": "ListItem", position: 2, name: "Niches", item: "https://twinkvault.com/reviews" },
              { "@type": "ListItem", position: 3, name: niche.displayName, item: url },
            ],
          }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description: niche.seoDescription,
            url,
            mainEntity: {
              "@type": "ItemList",
              name: niche.seoTitle,
              description: niche.seoDescription,
              numberOfItems: matching.length,
              itemListElement: matching.map((site, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: site.name,
                url: `https://twinkvault.com/reviews/${site.slug}`,
              })),
            },
          }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: `What are the best ${niche.displayName.toLowerCase()} gay sites in ${currentYear}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: `Our top picks are ${matching.slice(0, 3).map((s) => s.name).join(", ")}. Each was scored on content quality, value, update frequency, and mobile UX from hands-on review.`,
                },
              },
              {
                "@type": "Question",
                name: `How do you rank ${niche.displayName.toLowerCase()} gay sites?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We review hands-on — paying for memberships where we subscribe and researching the rest closely — logging in where we can, browsing the library, testing the player on mobile and desktop, and re-checking pricing monthly. Scores are 1–5 across four pillars: content quality, value, update frequency, and mobile experience.",
                },
              },
              {
                "@type": "Question",
                name: `Are these ${niche.displayName.toLowerCase()} sites safe to subscribe to?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Every site we list uses standard billing processors and discreet credit card descriptors. We flag any site with credible billing complaints in the cons section of its review.",
                },
              },
              {
                "@type": "Question",
                name: `Do any of these ${niche.displayName.toLowerCase()} sites offer free trials?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Trials come and go. Check the individual review for each site — we update trial availability monthly, and the /best-deals page lists every active trial.",
                },
              },
            ],
          }) }} />

        {/* Hero */}
        <section className="hero-mesh py-16">
          <div className="container max-w-4xl">
            <Breadcrumbs
              className="mb-6"
              items={[
                { label: "Home", to: "/" },
                { label: "Reviews", to: "/reviews" },
                { label: niche.displayName },
              ]}
            />
          </div>
          <div className="container max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 rounded-button bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary">
                {matching.length} sites tested · Updated {currentYear}
              </span>
              <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
                Best {niche.displayName} Porn Sites in {currentYear}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                {niche.heroTagline}
              </p>
              {NICHE_IMAGERY[niche.slug] && (
                <div className="mx-auto mt-6 max-w-3xl rounded-lg overflow-hidden border border-border/40">
                  <SmartImage
                    src={NICHE_IMAGERY[niche.slug].image}
                    alt={NICHE_IMAGERY[niche.slug].alt}
                    aspectRatio={NICHE_IMAGERY[niche.slug].wide ? "banner-wide" : "16:9"}
                    customAspect={NICHE_IMAGERY[niche.slug].wide ? undefined : "21 / 9"}
                    fallbackLabel={niche.displayName}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-8 border-y border-border">
          <div className="container max-w-3xl prose prose-invert">
            <p className="text-muted-foreground">
              {niche.description} We've reviewed and scored every {niche.displayName.toLowerCase()} porn site on this page — content libraries, streaming quality, mobile UX, pricing, and update cadence are all scored consistently. Sites are ranked by overall score, with the highest-scored {niche.displayName.toLowerCase()} gay porn site at the top.
            </p>
            <p className="text-muted-foreground mt-3">
              People into {niche.displayName.toLowerCase()} porn content also tend to browse{" "}
              {related.map((r, i) => (
                <span key={r.slug}>
                  <Link to={`/niche/${r.slug}`} className="text-primary hover:underline">
                    {r.displayName.toLowerCase()}
                  </Link>
                  {i < related.length - 1 ? ", " : "."}
                </span>
              ))}{" "}
              All three are linked at the bottom of this page.
            </p>
          </div>
        </section>

        {/* Data-driven comparison block — unique stats + table from our scores */}
        <LandingDataBlock sites={matching} label={niche.displayName.toLowerCase()} />

        <FeaturedDealBanner placement="niche-category" context={{ nicheSlug: niche.slug }} />

        {/* Site grid */}
        <section className="py-12">
          <div className="container">
            {matching.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No {niche.displayName.toLowerCase()} sites have been added to TwinkVault yet. Check back soon — we're adding sites monthly.
              </p>
            ) : (
              <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {matching.map((site, i) => (
                  <StaggerChild key={site.slug}>
                    <SiteCard site={site} rankBadge={i + 1} />
                  </StaggerChild>
                ))}
              </StaggerContainer>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 border-t border-border">
          <div className="container max-w-3xl">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              {niche.displayName} Sites FAQ
            </h2>
            <div className="mt-6 space-y-4">
              {[
                {
                  q: `What are the best ${niche.displayName.toLowerCase()} gay sites in ${currentYear}?`,
                  a: matching.length
                    ? `Our top picks are ${matching.slice(0, 3).map((s) => s.name).join(", ")}. Each was scored on content quality, value, update frequency, and mobile UX from hands-on review.`
                    : "We're still expanding coverage in this niche — check back soon.",
                },
                {
                  q: `How do you rank ${niche.displayName.toLowerCase()} gay sites?`,
                  a: "We review hands-on — paying for memberships where we subscribe and researching the rest closely — logging in where we can, browsing the library, testing the player on mobile and desktop, and re-checking pricing monthly. Scores are 1–5 across four pillars: content quality, value, update frequency, and mobile experience.",
                },
                {
                  q: `Are these ${niche.displayName.toLowerCase()} sites safe to subscribe to?`,
                  a: "Every site we list uses standard billing processors and discreet credit card descriptors. We flag any site with credible billing complaints in the cons section of its review.",
                },
                {
                  q: `Do any of these ${niche.displayName.toLowerCase()} sites offer free trials?`,
                  a: "Trials come and go. Check the individual review for each site — we update trial availability monthly, and the /best-deals page lists every active trial across the catalog.",
                },
              ].map((item) => (
                <details key={item.q} className="glass-card group rounded-lg p-5">
                  <summary className="cursor-pointer list-none font-semibold flex items-center justify-between">
                    {item.q}
                    <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related niches */}
        <section className="py-12 border-t border-border">
          <div className="container max-w-3xl text-center">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              People Into {niche.displayName} Also Browse
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/niche/${r.slug}`}
                  className="glass-card rounded-button px-4 py-2 text-sm font-medium hover:border-primary/50 transition-colors inline-flex items-center gap-2"
                >
                  {r.displayName}
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {fullList && (
                <Link
                  to={fullList.path}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
                >
                  {fullList.label} <ArrowRight size={14} />
                </Link>
              )}
              <Link
                to="/reviews"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Browse all reviews <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default NicheCategoryPage;
