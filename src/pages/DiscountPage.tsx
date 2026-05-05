import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, Check, Tag, Clock } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Layout from "../components/Layout";
import Breadcrumbs from "../components/Breadcrumbs";
import LocalisedPrice from "../components/LocalisedPrice";
import { PageTransition, MotionCard, StaggerContainer, StaggerChild } from "../components/MotionWrappers";
import VisitSiteButton from "../components/VisitSiteButton";
import StarRating from "../components/StarRating";
import VerifiedBadge from "../components/VerifiedBadge";
import { currentYear, currentMonthLong, lastCheckedDate, DEAL_VERIFIED_DATE } from "../lib/dates";
import { sites, getSiteBySlug, isAffiliated } from "../data/sites";
import { siteNicheMap } from "../data/site-niches";
import { getNiche } from "../data/niches";

const StatusIndicator = ({ expiry }: { expiry: "limited" | "flash" | "ongoing" }) => (
  <div className="flex items-center gap-2 text-xs">
    {expiry === "flash" ? (
      <>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
        <span className="text-destructive font-medium">Flash deal</span>
      </>
    ) : expiry === "limited" ? (
      <>
        <span className="inline-flex h-2 w-2 rounded-full bg-secondary" />
        <span className="text-secondary font-medium">Limited time</span>
      </>
    ) : (
      <>
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-emerald-400 font-medium">Always available</span>
      </>
    )}
  </div>
);

const DiscountPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const site = getSiteBySlug(slug || "");

  if (!site) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-3xl font-bold">404 — Discount Not Found</h1>
          <p className="mt-4 text-muted-foreground">
            We couldn't find a discount page for that site.
          </p>
          <Link
            to="/best-deals"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline"
          >
            Browse All Deals <ArrowRight size={14} />
          </Link>
        </div>
      </Layout>
    );
  }

  const affiliated = isAffiliated(site);

  // Parse raw monthly price number for schema markup
  const monthlyPriceNum = parseFloat(site.price_monthly.replace(/[^0-9.]/g, ""));
  const annualPriceNum = parseFloat(site.price_annual.replace(/[^0-9.]/g, ""));
  const savingsPerMonth = (monthlyPriceNum - annualPriceNum).toFixed(2);

  // Related discount pages — prefer same primary niche, fall back to any active deal
  const primaryNiche = (siteNicheMap[site.slug] ?? [])[0];
  const sameNicheSites = primaryNiche
    ? sites.filter(
        (s) =>
          s.id !== site.id &&
          s.deal_discount > 0 &&
          (siteNicheMap[s.slug] ?? []).includes(primaryNiche)
      )
    : [];
  const otherSites = (sameNicheSites.length >= 3
    ? sameNicheSites
    : [
        ...sameNicheSites,
        ...sites.filter(
          (s) =>
            s.id !== site.id &&
            s.deal_discount > 0 &&
            !sameNicheSites.includes(s)
        ),
      ]
  )
    .sort((a, b) => b.deal_discount - a.deal_discount)
    .slice(0, 3);

  // FAQ data
  const faqs = [
    {
      q: `Does ${site.name} have a discount code?`,
      a: `Yes. ${site.name} currently offers: ${site.deal_text}. This deal is verified and active as of ${lastCheckedDate}. Click our link above to activate the discount automatically — no coupon code required.`,
    },
    {
      q: `How much can I save on ${site.name}?`,
      a: `You can save up to ${site.deal_discount}% off the regular price. On the annual plan, that brings the cost down to just ${site.price_annual} compared to the standard ${site.price_monthly} monthly rate — a savings of $${savingsPerMonth} every month.`,
    },
    {
      q: `Is the ${site.name} discount code legit?`,
      a: `Absolutely. Every deal listed on TwinkVault is verified by our team. This ${site.name} offer was last confirmed working on ${lastCheckedDate}. We never list expired or fake discount codes.`,
    },
    {
      q: `What's the cheapest ${site.name} plan?`,
      a: `The cheapest ${site.name} plan is the annual membership at ${site.price_annual}. That's significantly less than the ${site.price_monthly} monthly rate and the ${site.price_quarterly} quarterly option. The annual plan is always the best value.`,
    },
  ];

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{`${site.name} Discount: ${site.deal_discount || "Up to 67"}% Off Deal (Verified ${DEAL_VERIFIED_DATE}) | TwinkVault`}</title>
          <meta
            name="description"
            content={`Get ${site.deal_discount || "up to 67"}% off ${site.name} — the lowest verified price we've found. Deal confirmed ${DEAL_VERIFIED_DATE}. Click to activate the discount before it expires.`}
          />
          <meta property="og:title" content={`${site.name} Discount: ${site.deal_discount || "Up to 67"}% Off (Verified ${DEAL_VERIFIED_DATE})`} />
          <meta property="og:description" content={`Get ${site.deal_discount || "up to 67"}% off ${site.name} — the lowest verified price we've found. Deal confirmed ${DEAL_VERIFIED_DATE}.`} />
          <meta property="og:url" content={`https://twinkvault.com/discount/${site.slug}`} />
          <link rel="canonical" href={`https://twinkvault.com/discount/${site.slug}`} />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Offer",
              name: `${site.name} Discount — ${site.deal_text}`,
              description: `Save up to ${site.deal_discount}% on ${site.name} membership. Verified ${currentMonthLong} ${currentYear}.`,
              price: annualPriceNum.toFixed(2),
              priceCurrency: "USD",
              availability: "https://schema.org/InStock",
              validThrough: `${currentYear}-12-31`,
              seller: {
                "@type": "Organization",
                name: site.name,
              },
              discount: `${site.deal_discount}%`,
            })}
          </script>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
                { "@type": "ListItem", position: 2, name: "Deals", item: "https://twinkvault.com/best-deals" },
                { "@type": "ListItem", position: 3, name: `${site.name} Discount`, item: `https://twinkvault.com/discount/${site.slug}` },
              ],
            })}
          </script>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: `${site.name} Discount ${currentYear} — ${site.deal_discount}% Off`,
              description: `Get ${site.name} for ${site.price_annual} with our active discount. ${site.deal_text}.`,
              author: { "@type": "Organization", name: "TwinkVault" },
              publisher: {
                "@type": "Organization",
                name: "TwinkVault",
                logo: { "@type": "ImageObject", url: "https://twinkvault.com/pwa-512.png" },
              },
              datePublished: `${currentYear}-01-01`,
              dateModified: new Date().toISOString().split("T")[0],
              mainEntityOfPage: `https://twinkvault.com/discount/${site.slug}`,
            })}
          </script>
        </Helmet>

        {/* Hero */}
        <section className="hero-mesh py-16">
          <div className="container">
            <Breadcrumbs
              className="mb-6"
              items={[
                { label: "Home", to: "/" },
                { label: "Deals", to: "/best-deals" },
                { label: `${site.name} Discount` },
              ]}
            />
          </div>
          <div className="container text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-button bg-muted px-3 py-1.5 text-xs text-muted-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Tag size={12} />
              Verified {currentMonthLong} {currentYear}
            </motion.div>
            <motion.h1
              className="font-heading font-bold heading-gradient inline-block"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {site.name} Discount: {site.deal_discount}% Off in {currentYear}
            </motion.h1>
            <motion.p
              className="mx-auto mt-4 max-w-2xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {site.deal_text} — verified and working for {currentMonthLong} {currentYear}.
              Save up to {site.deal_discount}% on your {site.name} membership.
            </motion.p>
            <motion.div
              className="mt-3 flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <StarRating score={site.overall_score} size={16} />
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{site.short_description.split(".")[0]}</span>
            </motion.div>
            <motion.div
              className="mt-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <VerifiedBadge />
            </motion.div>
          </div>
        </section>

        {/* Main Deal Card */}
        <section className="py-12">
          <div className="container max-w-2xl">
            <MotionCard className="glass-card rounded-lg border-l-4 border-l-secondary p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-bold md:text-2xl">
                    {site.deal_text}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Exclusive {site.name} deal for TwinkVault visitors
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-button bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-400">
                  -{site.deal_discount}%
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <LocalisedPrice usd={site.price_monthly} className="text-lg text-muted-foreground line-through" />
                <LocalisedPrice usd={site.price_annual} className="text-2xl font-bold text-emerald-400" />
                <span className="text-sm text-muted-foreground">/mo on annual</span>
              </div>

              <div className="mt-4">
                <StatusIndicator expiry={site.deal_type} />
              </div>

              <div className="mt-6">
                <VisitSiteButton
                  site={site}
                  label={`Claim ${site.name} Discount`}
                />
              </div>

              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Opens in new tab{affiliated ? " · Partner link" : ""}
              </p>
            </MotionCard>
          </div>
        </section>

        {/* Pricing Table */}
        <section className="py-12">
          <div className="container max-w-2xl">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              {site.name} Pricing Plans
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Compare all available plans. The annual option delivers the best per-month rate.
            </p>
            <div className="mt-6 overflow-x-auto glass-card rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">Plan</th>
                    <th className="px-4 py-3 text-left font-semibold">Price</th>
                    <th className="px-4 py-3 text-left font-semibold">Savings</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3">Monthly</td>
                    <td className="px-4 py-3"><LocalisedPrice usd={site.price_monthly} /></td>
                    <td className="px-4 py-3 text-muted-foreground/50">—</td>
                  </tr>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <td className="px-4 py-3">Quarterly</td>
                    <td className="px-4 py-3"><LocalisedPrice usd={site.price_quarterly} /></td>
                    <td className="px-4 py-3 text-emerald-400">
                      Save {Math.round(((monthlyPriceNum - parseFloat(site.price_quarterly.replace(/[^0-9.]/g, ""))) / monthlyPriceNum) * 100)}%
                    </td>
                  </tr>
                  <tr className="bg-emerald-400/5">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      Annual
                      <span className="ml-2 rounded-button bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        BEST VALUE
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400"><LocalisedPrice usd={site.price_annual} /></td>
                    <td className="px-4 py-3 text-emerald-400">
                      Save {Math.round(((monthlyPriceNum - annualPriceNum) / monthlyPriceNum) * 100)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* How to Claim */}
        <section className="py-12">
          <div className="container max-w-2xl">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              How to Claim Your {site.name} Discount
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No coupon code needed. The discount activates automatically through our link.
            </p>
            <StaggerContainer className="mt-6 grid gap-4">
              {[
                {
                  step: 1,
                  title: "Click our link above",
                  desc: `Use the "Claim ${site.name} Discount" button on this page. It opens ${site.name} with the deal pre-applied.`,
                },
                {
                  step: 2,
                  title: "Choose your plan on the site",
                  desc: "Select the membership plan that works for you — monthly, quarterly, or annual. Annual gives the biggest savings.",
                },
                {
                  step: 3,
                  title: "Discount applies automatically at checkout",
                  desc: `The ${site.deal_discount}% discount is applied at checkout. No promo code to enter — it's built into the link.`,
                },
              ].map((item) => (
                <StaggerChild key={item.step}>
                  <div className="glass-card rounded-lg p-5 flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/20 font-heading text-sm font-bold text-secondary">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </StaggerChild>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* FAQ Accordion with Schema */}
        <section className="py-12">
          <div className="container max-w-2xl">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="mt-6 space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="glass-card rounded-lg border-none px-5"
                >
                  <AccordionTrigger className="font-heading font-semibold text-left hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faqs.map((faq) => ({
                    "@type": "Question",
                    name: faq.q,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: faq.a,
                    },
                  })),
                }),
              }}
            />
          </div>
        </section>

        {/* More Deals — niche-aware when possible */}
        <section className="py-12">
          <div className="container max-w-2xl">
            {(() => {
              const primaryNiche = (siteNicheMap[site.slug] ?? [])[0];
              const niche = primaryNiche ? getNiche(primaryNiche) : null;
              if (!niche) return (
                <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
                  More Deals You Might Like
                </h2>
              );
              return (
                <>
                  <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
                    Other {niche.displayName} Deals
                  </h2>
                  <Link
                    to={`/niche/${niche.slug}`}
                    className="ml-3 text-sm text-primary hover:underline align-middle"
                  >
                    See all {niche.displayName.toLowerCase()} sites →
                  </Link>
                </>
              );
            })()}
            <StaggerContainer className="mt-6 grid gap-4 sm:grid-cols-3">
              {otherSites.map((s) => (
                <StaggerChild key={s.id}>
                  <Link
                    to={`/discount/${s.slug}`}
                    className="card-glow glass-card rounded-lg p-4 block"
                  >
                    <h3 className="font-heading font-semibold">{s.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-button bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                        -{s.deal_discount}%
                      </span>
                      <StarRating score={s.overall_score} size={12} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {s.deal_text}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary">
                      View Discount <ArrowRight size={10} />
                    </span>
                  </Link>
                </StaggerChild>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* SEO Content */}
        <section className="py-12">
          <div className="container max-w-2xl">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              How to Save on {site.name} in {currentYear}
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Finding the best price on {site.name} comes down to choosing the right plan and timing.
                Right now, the best available deal is <strong className="text-foreground">{site.deal_text}</strong>,
                which brings the effective monthly cost down to just <LocalisedPrice usd={site.price_annual} />. That's a{" "}
                {site.deal_discount}% saving compared to the standard <LocalisedPrice usd={site.price_monthly} /> monthly rate —
                and it's the lowest price we've tracked for {site.name} in {currentYear}.
              </p>
              <p>
                {site.name} offers three membership tiers: monthly at <LocalisedPrice usd={site.price_monthly} />, quarterly at{" "}
                <LocalisedPrice usd={site.price_quarterly} />, and annual at <LocalisedPrice usd={site.price_annual} />. While the monthly plan gives you
                maximum flexibility, the annual plan delivers the best value by far — you'll save ${savingsPerMonth}{" "}
                every single month compared to paying month-to-month. For most users, the annual plan is the
                clear winner unless you're genuinely unsure about committing.
                {site.has_free_trial
                  ? ` If you want to test the waters first, ${site.name} also offers a trial option so you can explore the full library before choosing a plan.`
                  : ""}
              </p>
              <p>
                We verify every deal listed on TwinkVault on a weekly basis, so you can trust that the{" "}
                {site.name} discount shown above is current and working. Our team last confirmed this offer on{" "}
                {lastCheckedDate}. If you spot a deal that isn't working, <Link to="/contact" className="text-secondary hover:underline">let us know</Link>{" "}
                and we'll update it immediately. For more options, check out our{" "}
                <Link to="/best-deals" className="text-secondary hover:underline">full deals page</Link> or read
                our in-depth <Link to={`/reviews/${site.slug}`} className="text-secondary hover:underline">{site.name} review</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12">
          <div className="container max-w-2xl">
            <motion.div
              className="glass-card rounded-lg p-8 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Clock size={24} className="mx-auto text-secondary" />
              <h2 className="mt-3 font-heading text-xl font-bold">
                Don't Miss This {site.name} Deal
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {site.deal_type === "flash"
                  ? "This flash deal is short-lived. Pricing can change without notice."
                  : site.deal_type === "limited"
                    ? "This is a limited-time offer. Pricing can change without notice."
                    : `This is a standing ${site.name} discount, but pricing is set by the studio and can change without notice.`}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Check size={12} />
                  <span>Verified {lastCheckedDate}</span>
                </div>
                <span className="text-muted-foreground/30">·</span>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Check size={12} />
                  <span>Save {site.deal_discount}%</span>
                </div>
              </div>
              <div className="mt-5 inline-block">
                <VisitSiteButton
                  site={site}
                  label={`Get ${site.deal_discount}% Off ${site.name}`}
                />
              </div>
            </motion.div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default DiscountPage;
