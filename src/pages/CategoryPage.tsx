import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import OutboundLink from "../components/OutboundLink";
import { ArrowRight, Star } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import AnimateOnScroll from "../components/AnimateOnScroll";
import LocalisedPrice from "../components/LocalisedPrice";
import FeaturedDealBanner from "../components/common/FeaturedDealBanner";
import { categories, getSitesByCategory } from "../data/sites";
import { currentYear } from "../lib/dates";

const sortOptions = ["Top Rated", "Best Value", "Most Popular"];

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((c) => c.slug === slug);
  const [sort, setSort] = useState("Top Rated");

  const sitesInCategory = getSitesByCategory(slug || "");
  const sorted = [...sitesInCategory].sort((a, b) => {
    if (sort === "Best Value") return b.value_score - a.value_score;
    return a.rank - b.rank;
  });

  const relatedCategories = categories.filter((c) => c.slug !== slug).slice(0, 4);

  if (!category) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-3xl font-bold">Category Not Found</h1>
          <Link to="/" className="mt-4 inline-block text-secondary hover:underline">Back to Home →</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{`Best ${category.name} Sites ${currentYear} — Ranked | TwinkVault`}</title>
        <meta name="description" content={`The best ${category.name.toLowerCase()} twink content sites, ranked by quality and value. Staff-tested reviews with real pricing.`} />
        <link rel="canonical" href={`https://twinkvault.com/category/${slug}`} />
      </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `Best ${category.name} Sites {currentYear}`,
          "numberOfItems": sorted.length,
          "itemListElement": sorted.map((site, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": site.name,
            "url": `https://twinkvault.com/reviews/${site.slug}`
          }))
        }) }} />

      <section className="py-16">
        <div className="container">
          <AnimateOnScroll>
            <div className="text-center stagger-in">
              <Star size={36} className="text-primary mx-auto" />
              <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">{category.name}</h1>
              <p className="mt-3 text-muted-foreground">{category.description}</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <span className="rounded-button bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {sorted.length} Sites Reviewed
                </span>
                <Link to="/top-sites" className="text-xs font-medium text-secondary hover:underline">
                  ← View All Rankings
                </Link>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Sort */}
          <div className="mt-10 flex justify-center gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setSort(opt)}
                className={`rounded-button px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  sort === opt
                    ? "gold-gradient text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Site cards */}
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {sorted.map((site) => (
              <AnimateOnScroll key={site.id}>
                <div className="card-glow glass-card rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-xl font-bold">{site.name}</h2>
                        <span className="inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Reviewed</span>
                      </div>
                      <StarRating score={site.overall_score} size={14} />
                    </div>
                    <LocalisedPrice usd={site.price_monthly} className="text-sm font-semibold" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{site.short_description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {site.categories.map((cat) => (
                      <span key={cat} className="rounded-button bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link
                      to={`/reviews/${site.slug}`}
                      className="rounded-button border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      Read Review
                    </Link>
                    <OutboundLink
                      site={site}
                      className="cta-btn gold-gradient inline-flex items-center gap-1 rounded-button px-4 py-2 text-sm font-semibold text-secondary-foreground"
                    >
                      Visit Site <ArrowRight size={12} />
                    </OutboundLink>
                  </div>
                  <p className="mt-1 text-[9px] text-muted-foreground">Opens in new tab · Partner link</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {sorted.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">No sites found in this category yet.</p>
          )}

          <FeaturedDealBanner placement="niche-category" context={{ nicheSlug: slug }} />

          {/* Related */}
          <AnimateOnScroll className="mt-16">
            <h2 className="text-center font-heading text-2xl font-bold">Browse Similar Categories</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="rounded-button border border-primary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </Layout>
  );
};

export default CategoryPage;
