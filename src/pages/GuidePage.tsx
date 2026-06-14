import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import Breadcrumbs from "../components/Breadcrumbs";
import { getGuideBody } from "../data/guide-content";
import { currentYear } from "../lib/dates";

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
          <Link to="/blog" className="mt-4 inline-block text-secondary hover:underline">
            Browse the blog →
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
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://twinkvault.com/blog" },
      { "@type": "ListItem", position: 3, name: body.h1, item: url },
    ],
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: body.h1,
    description: body.meta_description,
    url,
    datePublished: `${currentYear}-01-01`,
    dateModified: new Date().toISOString().split("T")[0],
    author: { "@type": "Organization", name: "TwinkVault" },
    publisher: {
      "@type": "Organization",
      name: "TwinkVault",
      logo: { "@type": "ImageObject", url: "https://twinkvault.com/pwa-512.png" },
    },
  };
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
              { label: "Guides", to: "/blog" },
              { label: body.h1 },
            ]}
          />
          <h1 className="font-heading text-3xl md:text-4xl font-bold heading-gradient inline-block">{body.h1}</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{body.intro}</p>

          <div className="mt-10 space-y-10">
            {body.sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-heading text-2xl font-bold">{s.h2}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
              </section>
            ))}
          </div>

          <section className="mt-12 border-t border-border/40 pt-8">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Bottom line</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{body.conclusion}</p>
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
        </article>
      </PageTransition>
    </Layout>
  );
};

export default GuidePage;
