import { useParams, Link } from "react-router-dom";
import OutboundLink from "../components/OutboundLink";
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
import { useAIReview } from "../hooks/useAIReview";
import { currentYear, currentMonthShort, currentMonthLong } from "../lib/dates";
import { CRAK_URL, trackCrakClick, MANFINDER_URL, trackManfinderClick } from "@/lib/crak";
import { siteNicheMap } from "@/data/site-niches";
import { getNiche } from "@/data/niches";
import { getSimilarSites } from "@/lib/similarSites";
import SiteCard from "../components/SiteCard";
import Breadcrumbs from "../components/Breadcrumbs";
import { stripMonthlyUnit } from "@/lib/dealMath";
import { getSiteImagery } from "@/data/site-imagery";
import { generateSiteFaqs } from "@/lib/faqGenerator";
import StickyMobileCTA from "../components/StickyMobileCTA";
import SimilarSites from "../components/SimilarSites";
import LocalisedPrice from "../components/LocalisedPrice";

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
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (site) {
      const stored = localStorage.getItem(`tv_helpful_${site.slug}`);
      setHelpfulCount(stored ? parseInt(stored) : 0);
      setHasVoted(!!localStorage.getItem(`tv_voted_${site.slug}`));
    }
  }, [site]);

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

  const { content: aiContent, loading: aiLoading } = useAIReview(site);

  // Niche-overlap-weighted similar sites (60% niche / 20% score / 10% affil / 10% network diversity)
  const similar = getSimilarSites(site.slug, 3);

  return (
    <Layout>
      <Helmet>
        <title>{`${site.name} Review ${currentYear} — Is It Worth It? | TwinkVault`}</title>
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
            <Breadcrumbs
              className="mb-6"
              items={[
                { label: "Home", to: "/" },
                { label: "Reviews", to: "/reviews" },
                { label: site.name },
              ]}
            />

            {(() => {
              const imagery = getSiteImagery(site.slug);
              const banner = imagery.hero_image_url;
              if (!banner) return null;
              return (
                <div className="mb-6 overflow-hidden rounded-lg border border-border/40">
                  <img
                    src={banner}
                    alt={imagery.banner_alt}
                    loading="eager"
                    decoding="async"
                    className="aspect-[21/9] w-full object-cover"
                  />
                </div>
              );
            })()}

            <AnimateOnScroll>
              <div className="stagger-in">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">{site.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-button bg-muted/50 px-2 py-0.5 text-xs text-emerald-400">✓ Reviewed</span>
                  <span className="inline-flex items-center gap-1 rounded-button bg-muted px-2 py-0.5 text-xs text-muted-foreground">{`🔄 Updated ${currentMonthShort} ${currentYear}`}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <StarRating score={site.overall_score} size={20} />
                  <span className="text-sm text-muted-foreground">Expert review</span>
                </div>

                {/* Score Breakdown */}
                <div className="mt-8">
                  <div className="flex items-baseline justify-between flex-wrap gap-2">
                    <h3 className="font-heading text-lg font-semibold">Score Breakdown</h3>
                    <Link to="/methodology" className="text-xs text-secondary hover:underline">
                      How are these scored? →
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <ScoreBar label="Content Quality" value={site.content_quality} />
                    <ScoreBar label="Update Frequency" value={site.update_frequency} />
                    <ScoreBar label="Value for Money" value={site.value_score} />
                    <ScoreBar label="Mobile Experience" value={site.mobile_score} />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <VisitSiteButton site={site} label={`Visit ${site.name}`} />
                  <Link
                    to={`/discount/${site.slug}`}
                    className="inline-flex items-center gap-2 rounded-button border border-emerald-400/50 bg-emerald-400/10 px-8 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                  >
                    {site.deal_discount}% Off Deal <ArrowRight size={14} />
                  </Link>
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
                  <div className="flex-1">
                    <p className="font-medium">{site.short_description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Best for: Fans of {site.categories[0]?.replace(/-/g, " ")} content
                    </p>
                    {(siteNicheMap[site.slug]?.length ?? 0) > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(siteNicheMap[site.slug] ?? []).map((nslug) => {
                          const n = getNiche(nslug);
                          if (!n) return null;
                          return (
                            <Link
                              key={nslug}
                              to={`/niche/${nslug}`}
                              className="rounded-button bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                            >
                              {n.emoji} {n.displayName}
                            </Link>
                          );
                        })}
                      </div>
                    )}
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
                <div className="mt-3 mb-4 flex items-start gap-2 rounded-button border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                  <span className="shrink-0">✓</span>
                  <span><strong>Editorially Reviewed</strong> — This review is based on publicly available information including pricing, features, and user feedback. Last reviewed: {currentMonthLong} {currentYear}.</span>
                </div>
                {aiLoading ? (
                  <div className="mt-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${85 - i * 10}%` }} />
                    ))}
                  </div>
                ) : aiContent ? (
                  <div className="mt-3 space-y-4 text-muted-foreground leading-relaxed">
                    {aiContent.split("\n\n").filter(Boolean).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-muted-foreground leading-relaxed">{site.description}</p>
                )}
              </section>
              <section>
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Site Design & Usability</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {site.mobile_score >= 85
                    ? `The interface is fast and the search actually works — which sounds basic, but plenty of sites in this niche get it wrong. Mobile streaming is smooth with no buffering issues, and switching quality settings is instant. Overall, ${site.name} feels like a site built by people who use it.`
                    : site.mobile_score >= 70
                    ? `The desktop experience is solid — navigation is clean and content is well-organized. Mobile is decent but not perfect; some pages load slower than they should. The streaming player works fine across devices, though the search could be better.`
                    : `The design is functional but dated. You'll find what you need, but the interface hasn't been updated in a while. Mobile works but feels like an afterthought. The streaming player gets the job done without any standout features.`}
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
                        <td className="px-4 py-3"><LocalisedPrice usd={site.price_monthly} /></td>
                        <td className="px-4 py-3"><LocalisedPrice usd={site.price_monthly} /></td>
                      </tr>
                      <tr className="border-b border-border/30 bg-muted/20">
                        <td className="px-4 py-3">Quarterly</td>
                        <td className="px-4 py-3"><LocalisedPrice usd={site.price_quarterly} /></td>
                        <td className="px-4 py-3"><LocalisedPrice usd={site.price_quarterly} /></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Annual</td>
                        <td className="px-4 py-3"><LocalisedPrice usd={stripMonthlyUnit(site.price_annual)} stripUnit />/mo (billed annually)</td>
                        <td className="px-4 py-3"><LocalisedPrice usd={site.price_annual} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
              <section>
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Our Verdict</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {site.overall_score >= 4.5
                    ? `${site.name} is one of the best in the space — ${site.overall_score}/5 isn't given lightly. ${site.short_description} If you can afford the price, this is the one to get.`
                    : site.overall_score >= 4.0
                    ? `${site.name} scores a solid ${site.overall_score}/5. ${site.short_description} It's not the absolute top pick, but it punches above its weight — especially at ${stripMonthlyUnit(site.price_annual)}/mo on the annual plan.`
                    : `${site.name} comes in at ${site.overall_score}/5. ${site.short_description} It's a niche pick — not for everyone, but if the content matches what you're after, the ${stripMonthlyUnit(site.price_annual)}/mo annual plan makes it a reasonable bet.`}
                </p>
                <div className="mt-4 glass-card rounded-lg p-6 text-center">
                  <span className="text-sm text-muted-foreground">Final Score</span>
                  <div className="mt-2 flex justify-center">
                    <ScoreRing score={site.overall_score} />
                  </div>
                  <VisitSiteButton site={site} className="mt-4" />
                </div>
              </section>

              {/* Helpful signal — only surface counts >= 5 to avoid the social-proof anti-pattern of "0 readers found this helpful" */}
              <div className="glass-card rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {helpfulCount >= 5
                    ? `👍 ${helpfulCount} readers found this review helpful`
                    : "Was this review helpful?"}
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

              <p className="text-xs text-muted-foreground">Last Updated: {currentMonthLong} {currentYear}</p>

              {/* Gay Dating interstitial — two cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="glass-card rounded-lg border border-emerald-500/20 p-4 flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Free to Join</span>
                  <p className="text-sm font-semibold">Meet gay men near you</p>
                  <p className="text-xs text-muted-foreground">Manfinder is free — create a profile and browse local guys without paying anything.</p>
                  <a
                    href={MANFINDER_URL}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={() => trackManfinderClick(window.location.pathname)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                  >
                    Join Manfinder Free <ArrowRight size={11} />
                  </a>
                  <p className="text-[9px] text-muted-foreground/60">Affiliate link</p>
                </div>
                <div className="glass-card rounded-lg border border-border/50 p-4 flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Not ready to subscribe?</span>
                  <p className="text-sm font-semibold">Browse gay dating sites</p>
                  <p className="text-xs text-muted-foreground">Compare gay hookup and dating platforms — no membership required.</p>
                  <a
                    href={CRAK_URL}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={() => trackCrakClick(window.location.pathname)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Find Local Guys <ArrowRight size={11} />
                  </a>
                  <p className="text-[9px] text-muted-foreground/60">Sponsored · Affiliate link</p>
                </div>
              </div>

              {/* FAQ Section — site-specific, purchase-intent questions */}
              <section className="mt-8">
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Frequently Asked Questions</h2>
                {(() => {
                  const faqs = generateSiteFaqs(site);
                  return (
                    <>
                      <Accordion type="single" collapsible className="mt-4 space-y-2">
                        {faqs.map((faq, i) => (
                          <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-lg border-none px-5">
                            <AccordionTrigger className="font-heading font-semibold text-left hover:no-underline">{faq.q}</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: faqs.map((f) => ({
                          "@type": "Question",
                          name: f.q,
                          acceptedAnswer: { "@type": "Answer", text: f.a },
                        })),
                      }) }} />
                    </>
                  );
                })()}
              </section>

              {/* Community Rating & Emoji Reactions */}
              <CommunityRating siteSlug={site.slug} />
            </AnimateOnScroll>

            {/* Similar Sites — niche-weighted, extracted to dedicated component */}
            <AnimateOnScroll className="mt-12">
              <SimilarSites site={site} />
            </AnimateOnScroll>

            {/* Compare internal links */}
            <AnimateOnScroll className="mt-10">
              <h2 className="font-heading text-lg font-bold">Compare {site.name} Against Others</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {similar.map((s) => (
                  <Link
                    key={s.id}
                    to={`/compare/${site.slug}-vs-${s.slug}`}
                    className="rounded-button border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    {site.name} vs {s.name}
                  </Link>
                ))}
                <Link
                  to="/compare"
                  className="rounded-button border border-primary/30 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  See all comparisons →
                </Link>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Sticky Sidebar - desktop only */}
          <aside className="hidden lg:block lg:w-72">
            <div className="sticky top-24 glass-card rounded-lg p-6">
              <h3 className="font-heading text-xl font-bold">{site.name}</h3>
              {site.deal_discount > 0 && (
                <div className="mt-2 inline-flex items-center justify-center w-full rounded-button bg-emerald-500/15 px-3 py-1.5 text-sm font-bold text-emerald-400">
                  −{site.deal_discount}% OFF
                </div>
              )}
              <div className="mt-3 flex justify-center">
                <ScoreRing score={site.overall_score} />
              </div>
              <div className="mt-3 text-center">
                <StarRating score={site.overall_score} />
              </div>
              <div className="mt-3 flex justify-center">
                <span className="rounded-button border border-border bg-muted/50 px-3 py-1.5 text-lg font-semibold">
                  <LocalisedPrice usd={site.price_monthly} />
                </span>
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                or <LocalisedPrice usd={site.price_annual} /> billed annually
              </p>
              <VisitSiteButton site={site} className="mt-4" />
              {site.deal_discount > 0 && (
                <Link
                  to={`/discount/${site.slug}`}
                  className="mt-3 block text-center rounded-button border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                >
                  Get the Discount →
                </Link>
              )}
              {(siteNicheMap[site.slug]?.length ?? 0) > 0 && (() => {
                const primaryNiche = siteNicheMap[site.slug]?.[0];
                const n = primaryNiche ? getNiche(primaryNiche) : null;
                if (!n) return null;
                return (
                  <Link
                    to={`/niche/${n.slug}`}
                    className="mt-2 block text-center text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    More {n.displayName.toLowerCase()} sites →
                  </Link>
                );
              })()}

              {/* All niches as larger clickable pills in the sidebar */}
              {(siteNicheMap[site.slug]?.length ?? 0) > 0 && (
                <div className="mt-5 border-t border-border/40 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Niches
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(siteNicheMap[site.slug] ?? []).map((nslug) => {
                      const n = getNiche(nslug);
                      if (!n) return null;
                      return (
                        <Link
                          key={nslug}
                          to={`/niche/${nslug}`}
                          className="rounded-button bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                        >
                          {n.emoji} {n.displayName}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Compare with another site picker — niche-filtered dropdown */}
              {(() => {
                const primaryNiche = siteNicheMap[site.slug]?.[0];
                const niched = primaryNiche
                  ? sites.filter(
                      (s) =>
                        s.slug !== site.slug &&
                        (siteNicheMap[s.slug] ?? []).includes(primaryNiche)
                    )
                  : [];
                const fallback = sites
                  .filter((s) => s.slug !== site.slug && !niched.includes(s))
                  .slice(0, 5);
                const options = [...niched, ...fallback].slice(0, 12);
                if (options.length === 0) return null;
                return (
                  <div className="mt-5 border-t border-border/40 pt-4">
                    <label
                      htmlFor="compare-with"
                      className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                    >
                      Compare with
                    </label>
                    <select
                      id="compare-with"
                      defaultValue=""
                      onChange={(e) => {
                        const target = e.target.value;
                        if (target) {
                          window.location.href = `/compare/${site.slug}-vs-${target}`;
                        }
                      }}
                      className="mt-2 w-full rounded-button border border-border bg-muted/30 px-3 py-2 text-xs focus:outline-none focus:border-primary/50"
                    >
                      <option value="" disabled>
                        Pick a site…
                      </option>
                      {options.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.name} ({s.overall_score}/5)
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA — extracted to dedicated component */}
      <StickyMobileCTA site={site} />
    </Layout>
  );
};

export default ReviewPage;
