import { useParams, Link } from "react-router-dom";
import { Check, X as XIcon, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import AnimateOnScroll from "../components/AnimateOnScroll";
import { getSiteBySlug, sites } from "../data/sites";

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}/100</span>
    </div>
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const ReviewPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const site = getSiteBySlug(slug || "");

  if (!site) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-3xl font-bold">Review Not Found</h1>
          <Link to="/top-sites" className="mt-4 inline-block text-secondary hover:underline">
            Browse All Sites →
          </Link>
        </div>
      </Layout>
    );
  }

  const similar = sites.filter((s) => s.id !== site.id).slice(0, 3);

  return (
    <Layout>
      <Helmet>
        <title>{site.name} Review 2025 — Is It Worth It? | TwinkVault</title>
        <meta name="description" content={`Read our honest ${site.name} review. We tested the content, pricing, and usability so you know exactly what you're getting.`} />
        <link rel="canonical" href={`https://twinkvault.com/reviews/${site.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            itemReviewed: { "@type": "WebSite", name: site.name },
            reviewRating: { "@type": "Rating", ratingValue: site.overall_score, bestRating: 5 },
            author: { "@type": "Organization", name: "TwinkVault" },
          })}
        </script>
      </Helmet>

      {/* Affiliate disclosure */}
      <div className="border-b border-border bg-secondary/5">
        <div className="container py-2 text-center text-xs text-muted-foreground">
          Disclosure: We earn commissions from affiliate links. This doesn't affect our rankings.
        </div>
      </div>

      <div className="container py-12">
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Main content */}
          <div className="flex-1">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/top-sites" className="hover:text-foreground">Reviews</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{site.name}</span>
            </nav>

            <AnimateOnScroll>
              <h1 className="font-heading text-3xl font-bold md:text-5xl">{site.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <StarRating score={site.overall_score} size={20} />
                <span className="text-sm text-muted-foreground">Expert review</span>
              </div>

              {/* Quick stats */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <ScoreBar label="Content Quality" value={site.content_quality} />
                <ScoreBar label="Update Frequency" value={site.update_frequency} />
                <ScoreBar label="Value for Money" value={site.value_score} />
                <ScoreBar label="Mobile Experience" value={site.mobile_score} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/go/${site.slug}`}
                  className="gold-gradient inline-flex items-center gap-2 rounded-button px-8 py-3 text-sm font-semibold text-secondary-foreground"
                >
                  Visit {site.name} <ArrowRight size={14} />
                </Link>
                <Link
                  to="/top-sites"
                  className="inline-flex items-center gap-2 rounded-button border border-border px-8 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  See All Reviews
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                We may earn a commission if you sign up through our links.
              </p>
            </AnimateOnScroll>

            {/* Summary */}
            <AnimateOnScroll className="mt-10">
              <div className="rounded-lg border border-card-border bg-card p-6">
                <div className="flex items-center gap-4">
                  <span className="font-heading text-4xl font-bold text-secondary">{site.overall_score}</span>
                  <div>
                    <p className="font-medium">{site.short_description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Best for: Fans of {site.categories[0]?.replace(/-/g, " ")} content
                    </p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Pros & Cons */}
            <AnimateOnScroll className="mt-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
                  <h3 className="font-heading text-lg font-semibold text-green-400">Pros</h3>
                  <div className="mt-3 space-y-2">
                    {site.pros.map((p) => (
                      <div key={p} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
                  <h3 className="font-heading text-lg font-semibold text-destructive">Cons</h3>
                  <div className="mt-3 space-y-2">
                    {site.cons.map((c) => (
                      <div key={c} className="flex items-start gap-2 text-sm">
                        <XIcon size={14} className="mt-0.5 shrink-0 text-destructive" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Review body */}
            <AnimateOnScroll className="mt-10 space-y-8">
              <section>
                <h2 className="font-heading text-2xl font-bold">Content Quality</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{site.description}</p>
              </section>
              <section>
                <h2 className="font-heading text-2xl font-bold">Site Design & Usability</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  The site features a modern, easy-to-navigate interface that works well across all devices. Content is well-organized with intuitive search and filtering options. The streaming player supports multiple quality settings and provides a smooth viewing experience.
                </p>
              </section>
              <section>
                <h2 className="font-heading text-2xl font-bold">Pricing & Value</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 text-left font-semibold">Plan</th>
                        <th className="py-3 text-left font-semibold">Price</th>
                        <th className="py-3 text-left font-semibold">Per Month</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-3">Monthly</td>
                        <td className="py-3">{site.price_from}</td>
                        <td className="py-3">{site.price_from}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3">Quarterly</td>
                        <td className="py-3">$24.99</td>
                        <td className="py-3">$8.33/mo</td>
                      </tr>
                      <tr>
                        <td className="py-3">Annual</td>
                        <td className="py-3">$79.99</td>
                        <td className="py-3">$6.67/mo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
              <section>
                <h2 className="font-heading text-2xl font-bold">Our Verdict</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {site.name} earns a strong {site.overall_score}/5 rating. {site.short_description} If you're looking for quality {site.categories[0]?.replace(/-/g, " ")} content, this is a solid choice worth considering.
                </p>
                <div className="mt-4 rounded-lg bg-muted/50 p-4 text-center">
                  <span className="text-sm text-muted-foreground">Final Score</span>
                  <p className="font-heading text-3xl font-bold text-secondary">{site.overall_score}/5</p>
                </div>
              </section>
              <p className="text-xs text-muted-foreground">Last Updated: January 2025</p>
            </AnimateOnScroll>

            {/* Similar Sites */}
            <AnimateOnScroll className="mt-12">
              <h2 className="font-heading text-2xl font-bold">You Might Also Like</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {similar.map((s) => (
                  <Link
                    key={s.id}
                    to={`/reviews/${s.slug}`}
                    className="card-glow rounded-lg border border-card-border bg-card p-4"
                  >
                    <h3 className="font-heading font-semibold">{s.name}</h3>
                    <StarRating score={s.overall_score} size={12} />
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{s.short_description}</p>
                  </Link>
                ))}
              </div>
            </AnimateOnScroll>
          </div>

          {/* Sticky Sidebar - desktop only */}
          <aside className="hidden lg:block lg:w-72">
            <div className="sticky top-24 rounded-lg border border-card-border bg-card p-6">
              <h3 className="font-heading text-xl font-bold">{site.name}</h3>
              <div className="mt-2">
                <StarRating score={site.overall_score} />
              </div>
              <p className="mt-3 text-lg font-semibold">{site.price_from}</p>
              <Link
                to={`/go/${site.slug}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
              >
                Visit Site <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-sm lg:hidden">
        <Link
          to={`/go/${site.slug}`}
          className="flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3.5 text-sm font-semibold text-secondary-foreground"
        >
          Visit {site.name} <ArrowRight size={14} />
        </Link>
      </div>
    </Layout>
  );
};

export default ReviewPage;
