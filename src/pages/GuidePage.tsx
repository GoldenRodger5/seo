import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedGuides from "../components/RelatedGuides";
import LinkedProse from "../components/LinkedProse";
import SmartImage from "../components/common/SmartImage";
import { getGuideBody } from "../data/guide-content";
import { selectGuideHero } from "../lib/guideImagery";
import { sites } from "../data/sites";
import { currentYear } from "../lib/dates";

const BASE_URL = "https://twinkvault.com";

/**
 * Generic guide page. Renders any /guide/{slug} for which GUIDE_CONTENT
 * has an entry. Until now the daily content engine wrote guide bodies to
 * disk with no route to surface them — every queued guide article became
 * invisible.
 */
const GuidePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const body = slug ? getGuideBody(slug) : undefined;

  if (!body || !slug) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-3xl font-bold">Guide not found</h1>
          <p className="mt-3 text-muted-foreground">This guide may not be published yet.</p>
          <Link to="/guides" className="mt-4 inline-block text-secondary hover:underline">
            Browse all guides →
          </Link>
        </div>
      </Layout>
    );
  }

  const url = `https://twinkvault.com/guide/${slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://twinkvault.com/guides" },
      { "@type": "ListItem", position: 3, name: body.h1, item: url },
    ],
  };
  // Hero chosen at render time, seeded by the guide slug, so each guide gets a
  // distinct cover from its related sites (single source of truth; no stored
  // value to drift). Falls back to any stored hero_image for safety.
  const hero = selectGuideHero(body.related_sites ?? [], slug ?? "")
    ?? (body.hero_image ? { hero_image: body.hero_image, hero_alt: body.hero_alt ?? body.h1, hero_site_slug: body.hero_site_slug ?? "" } : null);
  const heroAbs = hero ? `${BASE_URL}${hero.hero_image}` : null;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: body.h1,
    description: body.meta_description,
    url,
    ...(heroAbs
      ? { image: { "@type": "ImageObject", url: heroAbs, width: 1200, height: 750 } }
      : {}),
    datePublished: `${currentYear}-01-01`,
    dateModified: new Date().toISOString().split("T")[0],
    author: { "@type": "Organization", name: "TwinkVault" },
    publisher: {
      "@type": "Organization",
      name: "TwinkVault",
      logo: { "@type": "ImageObject", url: "https://twinkvault.com/pwa-512.png" },
    },
  };
  // Sites this guide discusses, resolved to {name, slug} for the
  // "Sites mentioned" block. Filters to slugs that exist in the catalog.
  const mentioned = (body.related_sites ?? [])
    .map((slug) => sites.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .slice(0, 10);

  // Shared across intro → sections → conclusion so each site/niche is
  // auto-linked only on its FIRST mention in the article (rendered in
  // document order during SSR + client). Caps over-linking.
  const linkedSet = new Set<string>();
  const faqSchema = body.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: body.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  // SEO title budget = 65 chars. The semantic <h1> on the page can be
  // longer (it's editorial), so build the meta <title> with a smart
  // fallback rather than blindly appending the " | TwinkVault" suffix.
  // Same pattern the prerender route table uses for review/blog routes.
  const SUFFIX = " | TwinkVault";
  const withSuffix = `${body.h1}${SUFFIX}`;
  const metaTitle =
    withSuffix.length <= 60 ? withSuffix
    : body.h1.length <= 60 ? body.h1
    : body.h1.slice(0, 57) + "…";

  return (
    <Layout>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={body.meta_description} />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={body.meta_description} />
      </Helmet>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <PageTransition>
        <article className="container max-w-3xl py-12">
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: "Home", to: "/" },
              { label: "Guides", to: "/guides" },
              { label: body.h1 },
            ]}
          />
          <h1 className="font-heading text-3xl md:text-4xl font-bold heading-gradient inline-block">{body.h1}</h1>

          {hero && (
            <figure className="mt-6">
              {hero.hero_site_slug ? (
                <Link to={`/reviews/${hero.hero_site_slug}`} aria-label={`Read our ${hero.hero_alt || "site"} review`}>
                  <SmartImage
                    src={hero.hero_image}
                    alt={hero.hero_alt || body.h1}
                    aspectRatio="16:10"
                    priority
                    fallbackLabel={body.h1}
                    className="w-full rounded-xl overflow-hidden"
                  />
                </Link>
              ) : (
                <SmartImage
                  src={hero.hero_image}
                  alt={hero.hero_alt || body.h1}
                  aspectRatio="16:10"
                  priority
                  fallbackLabel={body.h1}
                  className="w-full rounded-xl overflow-hidden"
                />
              )}
            </figure>
          )}

          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            <LinkedProse text={body.intro} linked={linkedSet} />
          </p>

          <div className="mt-10 space-y-10">
            {body.sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-heading text-2xl font-bold">{s.h2}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-line">
                  <LinkedProse text={s.content} linked={linkedSet} />
                </p>
              </section>
            ))}
          </div>

          <section className="mt-12 border-t border-border/40 pt-8">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Bottom line</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              <LinkedProse text={body.conclusion} linked={linkedSet} />
            </p>
          </section>

          {body.faq.length > 0 && (
            <section className="mt-12 border-t border-border/40 pt-8">
              <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Frequently asked questions</h2>
              <div className="mt-6 space-y-6">
                {body.faq.map((f, i) => (
                  <div key={i}>
                    <h3 className="font-heading font-semibold">{f.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {mentioned.length > 0 && (
            <section className="mt-12 border-t border-border/40 pt-8">
              <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Sites mentioned in this guide</h2>
              <ul className="mt-6 flex flex-wrap gap-3">
                {mentioned.map((s) => (
                  <li key={s.slug}>
                    <Link
                      to={`/reviews/${s.slug}`}
                      className="inline-block rounded-full border border-border/50 px-4 py-1.5 text-sm hover:border-secondary/60 hover:text-secondary transition-colors"
                    >
                      {s.name} review
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <RelatedGuides excludeSlug={slug} className="mt-12" />
        </article>
      </PageTransition>
    </Layout>
  );
};

export default GuidePage;
