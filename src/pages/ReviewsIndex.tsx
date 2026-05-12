import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import AnimateOnScroll from "../components/AnimateOnScroll";
import VisitSiteButton from "../components/VisitSiteButton";
import LocalisedPrice from "../components/LocalisedPrice";
import { sites, categories } from "../data/sites";
import { currentYear, currentMonthLong } from "../lib/dates";
import { TOTAL_SITES } from "../lib/siteStats";

const sortOptions = ["Top Rated", "Newest", "Alphabetical"];

const ReviewsIndex = () => {
  const [sort, setSort] = useState("Top Rated");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  let filtered = activeCategory
    ? sites.filter((s) => s.categories.includes(activeCategory))
    : [...sites];

  if (sort === "Top Rated") filtered.sort((a, b) => a.rank - b.rank);
  else if (sort === "Newest") filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  else if (sort === "Alphabetical") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Layout>
      <Helmet>
        <title>{`Twink Site Reviews — ${TOTAL_SITES} Gay Porn Sites Tested & Scored | TwinkVault`}</title>
        <meta name="description" content={`In-depth twink site reviews — ${TOTAL_SITES} gay porn sites tested and scored on content, value, updates and mobile UX. Find the right site for your budget and taste.`} />
        <link rel="canonical" href="https://twinkvault.com/reviews" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `Gay Twink Site Reviews ${currentYear}`,
          "numberOfItems": sites.length,
          "itemListElement": [...sites].sort((a,b) => a.rank - b.rank).map((site, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": site.name,
            "url": `https://twinkvault.com/reviews/${site.slug}`
          }))
        })}</script>
      </Helmet>

      <section className="py-16">
        <div className="container">
          <AnimateOnScroll>
            <div className="text-center stagger-in">
              <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
                Twink Site Reviews
              </h1>
              <p className="mt-4 text-muted-foreground">
                Every gay porn site we've tested in one place — {TOTAL_SITES} honest twink reviews scored on the same four-pillar methodology. Updated monthly.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-button bg-muted px-3 py-1 text-xs text-muted-foreground">
                {`Updated ${currentMonthLong} ${currentYear}`}
              </span>
            </div>
          </AnimateOnScroll>

          {/* Sort + Filter */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex gap-2">
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
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-button px-3 py-1.5 text-xs transition-all ${
                  !activeCategory ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`rounded-button px-3 py-1.5 text-xs transition-all ${
                    activeCategory === cat.slug ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((site) => (
              <AnimateOnScroll key={site.id}>
                <div className="card-glow glass-card flex flex-col rounded-lg p-5 h-full">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-lg font-bold">{site.name}</h2>
                    <span className="text-sm font-semibold text-secondary">{site.overall_score}/5</span>
                  </div>
                  <StarRating score={site.overall_score} size={14} />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {site.categories.map((cat) => (
                      <span key={cat} className="rounded-button bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground line-clamp-2">{site.short_description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-[10px] text-emerald-400">✓ Reviewed</span>
                    <LocalisedPrice usd={site.price_monthly} className="text-xs text-muted-foreground" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/reviews/${site.slug}`}
                      className="flex-1 rounded-button border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      Read Review
                    </Link>
                    <VisitSiteButton site={site} className="flex-1" showDisclosure={false} />
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ReviewsIndex;
