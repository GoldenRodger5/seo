import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import AnimateOnScroll from "../components/AnimateOnScroll";
import { categories, getSitesByCategory } from "../data/sites";

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
        <title>Best {category.name} Sites 2025 — Ranked | TwinkVault</title>
        <meta name="description" content={`The best ${category.name.toLowerCase()} twink content sites, ranked by quality and value.`} />
      </Helmet>

      <section className="py-16">
        <div className="container">
          <AnimateOnScroll>
            <div className="text-center">
              <span className="text-4xl">{category.icon}</span>
              <h1 className="mt-4 font-heading text-3xl font-bold md:text-5xl">{category.name}</h1>
              <p className="mt-3 text-muted-foreground">{category.description}</p>
              <span className="mt-3 inline-block rounded-button bg-muted px-3 py-1 text-xs text-muted-foreground">
                {sorted.length} Sites Reviewed
              </span>
            </div>
          </AnimateOnScroll>

          {/* Sort */}
          <div className="mt-10 flex justify-center gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setSort(opt)}
                className={`rounded-button px-4 py-2 text-sm font-medium transition-all ${
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
                <div className="card-glow rounded-lg border border-card-border bg-card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-heading text-xl font-bold">{site.name}</h2>
                      <StarRating score={site.overall_score} size={14} />
                    </div>
                    <span className="text-sm font-semibold">{site.price_from}</span>
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
                      className="rounded-button border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      Read Review
                    </Link>
                    <Link
                      to={`/go/${site.slug}`}
                      className="gold-gradient inline-flex items-center gap-1 rounded-button px-4 py-2 text-sm font-semibold text-secondary-foreground"
                    >
                      Visit Site <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {sorted.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">No sites found in this category yet.</p>
          )}

          {/* Related */}
          <AnimateOnScroll className="mt-16">
            <h2 className="text-center font-heading text-2xl font-bold">Browse Similar Categories</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="rounded-button border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {cat.icon} {cat.name}
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
