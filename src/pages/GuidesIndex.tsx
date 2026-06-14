import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import Breadcrumbs from "../components/Breadcrumbs";
import SmartImage from "../components/common/SmartImage";
import { GUIDE_CONTENT } from "../data/guide-content";

/**
 * /guides index. Until now guides lived only at /guide/{slug} and were
 * reachable only via the sitemap — orphaned from human navigation. This is
 * the hub: real intro copy (clears THIN_LANDING) plus a card per guide.
 */
const BASE_URL = "https://twinkvault.com";

const GuidesIndex = () => {
  const url = `${BASE_URL}/guides`;
  const slugs = Object.keys(GUIDE_CONTENT);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: url },
    ],
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Gay Porn Site Guides",
    description:
      "Plain-English guides to gay porn site billing, cancellation, trials, privacy, and getting the most from a membership.",
    url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: slugs.map((slug, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: GUIDE_CONTENT[slug].h1,
        url: `${BASE_URL}/guide/${slug}`,
      })),
    },
  };

  const metaTitle = "Gay Porn Site Guides — Billing, Cancelling & Trials | TwinkVault";
  const metaDescription =
    "Plain-English guides to gay porn site memberships: how billing and trials work, how to cancel cleanly, decode mystery charges, and protect your privacy.";

  return (
    <Layout>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
      </Helmet>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <PageTransition>
        <div className="container max-w-4xl py-12">
          <Breadcrumbs className="mb-6" items={[{ label: "Home", to: "/" }, { label: "Guides" }]} />

          <h1 className="font-heading text-3xl md:text-4xl font-bold heading-gradient inline-block">
            Gay Porn Site Guides
          </h1>

          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Signing up for a gay porn site is the easy part. It's everything around the membership — the
              trial that quietly converts to a full subscription, the billing descriptor on your statement that
              looks nothing like the site's name, the cancellation flow buried three screens deep — that trips
              people up and costs them money they didn't mean to spend. These guides exist to make that whole
              lifecycle boring and predictable, so you stay in control of what you're paying for and for how long.
            </p>
            <p>
              Everything here is written the way we'd explain it to a friend: plain English, concrete steps, and
              specifics that apply to the studios we actually review — Helix Studios, the Next Door network,
              Southern Strokes, Twinks in Shorts, Breed Me Raw and the rest. We cover how recurring billing is
              structured across the major adult payment processors (CCBill, Epoch, SegPay), how to read and decode
              a mystery charge, how free trials and auto-renewals genuinely work, how to cancel through both the
              member area and the processor directly, and what your escalation options are — chargebacks, card
              blocks, PayPal billing agreements — if a site won't stop charging you.
            </p>
            <p>
              If you're deciding whether a specific site is worth your money in the first place, our individual
              site reviews and comparison pages go deeper on pricing, scene counts, and value. These guides are the
              connective tissue around them: the practical know-how that applies no matter which membership you
              choose. Browse the full set below, and check back as we publish more.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {slugs.map((slug) => {
              const g = GUIDE_CONTENT[slug];
              return (
                <Link
                  key={slug}
                  to={`/guide/${slug}`}
                  className="group block rounded-xl border border-border/40 overflow-hidden hover:border-secondary/60 transition-colors"
                >
                  <SmartImage
                    src={g.hero_image}
                    alt={g.hero_alt || g.h1}
                    aspectRatio="16:10"
                    fallbackLabel={g.h1}
                    className="w-full"
                  />
                  <div className="p-5">
                    <h2 className="font-heading text-lg font-bold leading-snug group-hover:text-secondary transition-colors">
                      {g.h1}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{g.meta_description}</p>
                    <span className="mt-3 inline-block text-sm text-secondary">Read the guide →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
};

export default GuidesIndex;
