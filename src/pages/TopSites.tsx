import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X as XIcon, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import AnimateOnScroll from "../components/AnimateOnScroll";
import { sites } from "../data/sites";

const filters = ["All", "Best Value", "HD Quality", "Amateur", "Premium Studio", "Free Trial"];

const filterMap: Record<string, string | null> = {
  All: null,
  "Best Value": "best-value",
  "HD Quality": "hd-quality",
  Amateur: "amateur-twinks",
  "Premium Studio": "premium-studios",
  "Free Trial": "free-trials",
};

const TopSites = () => {
  const [active, setActive] = useState("All");

  const filtered = active === "All"
    ? sites
    : sites.filter((s) => s.categories.includes(filterMap[active]!));

  return (
    <Layout>
      <section className="py-16">
        <div className="container">
          <AnimateOnScroll>
            <div className="text-center">
              <h1 className="font-heading text-3xl font-bold md:text-5xl">
                Best Twink Porn Sites — <span className="gold-gradient-text">2025 Rankings</span>
              </h1>
              <p className="mt-4 text-muted-foreground">
                We tested and ranked the top twink content sites so you don't have to. Updated monthly.
              </p>
              <span className="mt-3 inline-block rounded-button bg-muted px-3 py-1 text-xs text-muted-foreground">
                Last Updated: January 2025
              </span>
            </div>
          </AnimateOnScroll>

          {/* Filters */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`rounded-button px-4 py-2 text-sm font-medium transition-all ${
                  active === f
                    ? "gold-gradient text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Ranked List */}
          <div className="mt-10 space-y-4">
            {filtered.map((site, i) => (
              <AnimateOnScroll key={site.id}>
                <div className="card-glow rounded-lg border border-card-border bg-card p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* Rank */}
                    <div className="flex items-center gap-4 lg:w-16 lg:flex-col lg:items-center">
                      <span className="font-heading text-4xl font-bold text-muted-foreground/40">#{site.rank}</span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-heading text-2xl font-bold">{site.name}</h2>
                        {site.badge && (
                          <span className={`rounded-button px-2.5 py-1 text-xs font-semibold ${
                            site.rank === 1
                              ? "gold-gradient text-secondary-foreground"
                              : "bg-primary/15 text-primary"
                          }`}>
                            {site.badge}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <StarRating score={site.overall_score} />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{site.short_description}</p>

                      {/* Tags */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {site.categories.map((cat) => (
                          <span key={cat} className="rounded-button bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            {cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        ))}
                      </div>

                      {/* Pros/Cons */}
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          {site.pros.map((pro) => (
                            <div key={pro} className="flex items-start gap-2 text-sm">
                              <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                              <span className="text-muted-foreground">{pro}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          {site.cons.map((con) => (
                            <div key={con} className="flex items-start gap-2 text-sm">
                              <XIcon size={14} className="mt-0.5 shrink-0 text-muted-foreground/50" />
                              <span className="text-muted-foreground/70">{con}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CTA column */}
                    <div className="flex flex-col items-center gap-3 lg:w-44">
                      <span className="text-lg font-semibold">{site.price_from}</span>
                      <Link
                        to={`/go/${site.slug}`}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                          site.rank === 1
                            ? "gold-gradient text-secondary-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        Visit Site <ArrowRight size={14} />
                      </Link>
                      <Link
                        to={`/reviews/${site.slug}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Read Full Review →
                      </Link>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {/* Bottom CTA */}
          <AnimateOnScroll>
            <div className="mt-16 text-center">
              <h3 className="font-heading text-2xl font-bold">Looking for a specific type of content?</h3>
              <p className="mt-2 text-muted-foreground">Browse our category pages to find exactly what you want.</p>
              <Link
                to="/"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline"
              >
                Browse Categories <ArrowRight size={14} />
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </Layout>
  );
};

export default TopSites;
