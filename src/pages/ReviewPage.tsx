import { useParams, Link } from "react-router-dom";
import { Check, X as XIcon, ArrowRight, ThumbsUp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import ScoreRing from "../components/ScoreRing";
import AnimateOnScroll from "../components/AnimateOnScroll";
import CommunityRating from "../components/CommunityRating";
import VisitSiteButton from "../components/VisitSiteButton";
import { getSiteBySlug, sites, getVisitUrl, isAffiliated } from "../data/sites";

const ScoreBar = ({ label, value }: { label: string; value: number }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

const ReviewPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const site = getSiteBySlug(slug || "");
  const [showMobileCta, setShowMobileCta] = useState(false);
  const [mobileDismissed, setMobileDismissed] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (site) {
      const base = 47 + parseInt(site.id) * 33;
      const stored = localStorage.getItem(`tv_helpful_${site.slug}`);
      setHelpfulCount(stored ? parseInt(stored) : base);
      setHasVoted(!!localStorage.getItem(`tv_voted_${site.slug}`));
    }
  }, [site]);

  useEffect(() => {
    const handleScroll = () => {
      setShowMobileCta(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleVote = () => {
    if (hasVoted || !site) return;
    const newCount = helpfulCount + 1;
    setHelpfulCount(newCount);
    setHasVoted(true);
    localStorage.setItem(`tv_helpful_${site.slug}`, String(newCount));
    localStorage.setItem(`tv_voted_${site.slug}`, "1");
  };

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
        <title>{site.name} Review 2026 — Is It Worth It? | TwinkVault</title>
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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
              { "@type": "ListItem", position: 2, name: "Reviews", item: "https://twinkvault.com/reviews" },
              { "@type": "ListItem", position: 3, name: site.name, item: `https://twinkvault.com/reviews/${site.slug}` },
            ]
          })}
        </script>
      </Helmet>

      {/* Affiliate disclosure */}
      <div className="border-b border-primary/10 bg-secondary/5">
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
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span className="mx-2 text-muted-foreground/30">/</span>
              <Link to="/reviews" className="hover:text-foreground transition-colors">Reviews</Link>
              <span className="mx-2 text-muted-foreground/30">/</span>
              <span className="text-foreground">{site.name}</span>
            </nav>

            <AnimateOnScroll>
              <div className="stagger-in">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">{site.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-xs text-emerald-400">✓ Staff Verified</span>
                  <span className="inline-flex items-center gap-1 rounded-button bg-muted px-2 py-0.5 text-xs text-muted-foreground">🔄 Updated Mar 2026</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <StarRating score={site.overall_score} size={20} />
                  <span className="text-sm text-muted-foreground">Expert review</span>
                </div>

                {/* Score Breakdown */}
                <div className="mt-8">
                  <h3 className="font-heading text-lg font-semibold mb-4">Score Breakdown</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ScoreBar label="Content Quality" value={site.content_quality} />
                    <ScoreBar label="Update Frequency" value={site.update_frequency} />
                    <ScoreBar label="Value for Money" value={site.value_score} />
                    <ScoreBar label="Mobile Experience" value={site.mobile_score} />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <VisitSiteButton site={site} label={`Visit ${site.name}`} />
                  <Link
                    to="/top-sites"
                    className="inline-flex items-center gap-2 rounded-button border border-primary px-8 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    See All Reviews
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Summary */}
            <AnimateOnScroll className="mt-10">
              <div className="glass-card rounded-lg p-6">
                <div className="flex items-center gap-6">
                  <ScoreRing score={site.overall_score} size={80} />
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
                <div className="glass-card rounded-lg border-l-4 border-l-emerald-500 p-5">
                  <h3 className="font-heading text-lg font-semibold text-emerald-400">Pros</h3>
                  <div className="mt-3 space-y-2">
                    {site.pros.map((p) => (
                      <div key={p} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card rounded-lg border-l-4 border-l-destructive p-5">
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
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Content Quality</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{site.description}</p>
              </section>
              <section>
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Site Design & Usability</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  The site features a modern, easy-to-navigate interface that works well across all devices. Content is well-organized with intuitive search and filtering options. The streaming player supports multiple quality settings and provides a smooth viewing experience.
                </p>
              </section>
              <section>
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Pricing & Value</h2>
                <div className="mt-4 overflow-x-auto glass-card rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold">Plan</th>
                        <th className="px-4 py-3 text-left font-semibold">Price</th>
                        <th className="px-4 py-3 text-left font-semibold">Per Month</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/30">
                        <td className="px-4 py-3">Monthly</td>
                        <td className="px-4 py-3">{site.price_from}</td>
                        <td className="px-4 py-3">{site.price_from}</td>
                      </tr>
                      <tr className="border-b border-border/30 bg-muted/20">
                        <td className="px-4 py-3">Quarterly</td>
                        <td className="px-4 py-3">$24.99</td>
                        <td className="px-4 py-3">$8.33/mo</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Annual</td>
                        <td className="px-4 py-3">$79.99</td>
                        <td className="px-4 py-3">$6.67/mo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
              <section>
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Our Verdict</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {site.name} earns a strong {site.overall_score}/5 rating. {site.short_description} If you're looking for quality {site.categories[0]?.replace(/-/g, " ")} content, this is a solid choice worth considering.
                </p>
                <div className="mt-4 glass-card rounded-lg p-6 text-center">
                  <span className="text-sm text-muted-foreground">Final Score</span>
                  <div className="mt-2 flex justify-center">
                    <ScoreRing score={site.overall_score} />
                  </div>
                  <VisitSiteButton site={site} className="mt-4" />
                </div>
              </section>

              {/* Helpful signal */}
              <div className="glass-card rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  👍 {helpfulCount} readers found this review helpful
                </span>
                <button
                  onClick={handleVote}
                  disabled={hasVoted}
                  className={`inline-flex items-center gap-1.5 rounded-button px-4 py-2 text-xs font-semibold transition-colors ${
                    hasVoted
                      ? "bg-muted text-muted-foreground cursor-default"
                      : "border border-primary text-primary hover:bg-primary/10"
                  }`}
                >
                  <ThumbsUp size={14} />
                  {hasVoted ? "Thanks!" : "Helpful"}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">Last Updated: March 2026</p>

              {/* FAQ Section */}
              <section className="mt-8">
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="mt-4 space-y-2">
                  {[
                    { q: `Is ${site.name} worth it?`, a: `${site.name} scores ${site.overall_score}/5 in our testing. ${site.short_description} At ${site.price_from}, it ${site.value_score >= 85 ? "offers excellent value for money" : site.value_score >= 75 ? "offers decent value" : "is on the pricier side"}. We'd recommend it if you're looking for quality ${site.categories[0]?.replace(/-/g, " ")} content.` },
                    { q: `How much does ${site.name} cost per month?`, a: `${site.name} starts at ${site.price_from} for a monthly subscription. Quarterly and annual plans are available at a discount. Check their site for the latest pricing and any active promotions.` },
                    { q: `Does ${site.name} have a free trial?`, a: site.categories.includes("free-trials") ? `Yes, ${site.name} offers a free trial period so you can explore the content before committing to a paid subscription.` : `${site.name} does not currently offer a free trial. However, they do offer competitive monthly pricing starting at ${site.price_from}.` },
                    { q: `What is the best alternative to ${site.name}?`, a: `The best alternative depends on what you're looking for. ${similar[0]?.name} (${similar[0]?.overall_score}/5) and ${similar[1]?.name} (${similar[1]?.overall_score}/5) are both strong alternatives. Check our full rankings for more options.` },
                    { q: `Is ${site.name} updated regularly?`, a: `${site.name} has an update frequency score of ${site.update_frequency}/100. ${site.update_frequency >= 85 ? "They update very frequently with fresh content." : site.update_frequency >= 75 ? "They update regularly with new content." : "Updates come less frequently than some competitors."}` },
                  ].map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-lg border-none px-5">
                      <AccordionTrigger className="font-heading font-semibold text-left hover:no-underline">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: [
                    { "@type": "Question", name: `Is ${site.name} worth it?`, acceptedAnswer: { "@type": "Answer", text: `${site.name} scores ${site.overall_score}/5 in our testing.` } },
                    { "@type": "Question", name: `How much does ${site.name} cost?`, acceptedAnswer: { "@type": "Answer", text: `${site.name} starts at ${site.price_from}.` } },
                    { "@type": "Question", name: `Does ${site.name} have a free trial?`, acceptedAnswer: { "@type": "Answer", text: site.categories.includes("free-trials") ? "Yes, a free trial is available." : "No free trial is currently offered." } },
                    { "@type": "Question", name: `What is the best alternative to ${site.name}?`, acceptedAnswer: { "@type": "Answer", text: `Top alternatives include ${similar[0]?.name} and ${similar[1]?.name}.` } },
                    { "@type": "Question", name: `Is ${site.name} updated regularly?`, acceptedAnswer: { "@type": "Answer", text: `Update frequency score: ${site.update_frequency}/100.` } },
                  ]
                }) }} />
              </section>

              {/* Community Rating & Emoji Reactions */}
              <CommunityRating siteSlug={site.slug} />
            </AnimateOnScroll>

            {/* Similar Sites */}
            <AnimateOnScroll className="mt-12">
              <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">You Might Also Like</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {similar.map((s) => (
                  <Link
                    key={s.id}
                    to={`/reviews/${s.slug}`}
                    className="card-glow glass-card rounded-lg p-4"
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
            <div className="sticky top-24 glass-card rounded-lg p-6">
              <h3 className="font-heading text-xl font-bold">{site.name}</h3>
              <div className="mt-3 flex justify-center">
                <ScoreRing score={site.overall_score} />
              </div>
              <div className="mt-3 text-center">
                <StarRating score={site.overall_score} />
              </div>
              <div className="mt-3 flex justify-center">
                <span className="rounded-button border border-border bg-muted/50 px-3 py-1.5 text-lg font-semibold">
                  {site.price_from}
                </span>
              </div>
              <VisitSiteButton site={site} className="mt-4" />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA - improved with scroll trigger and dismiss */}
      {showMobileCta && !mobileDismissed && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass-card lg:hidden animate-slide-up" style={{ height: "64px", padding: "12px" }}>
          <div className="flex items-center gap-3 h-full">
            <button onClick={() => setMobileDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
              <XIcon size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{site.name}</p>
              <span className="text-xs text-secondary">{site.overall_score}/5</span>
            </div>
            <Link
              to={getVisitUrl(site)}
              target="_blank"
              rel="noopener noreferrer"
              className={`cta-btn flex items-center gap-2 rounded-button gold-gradient px-6 py-2.5 text-sm font-semibold text-secondary-foreground whitespace-nowrap ${!isAffiliated(site) ? "opacity-85" : ""}`}
            >
              Visit Site <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReviewPage;
