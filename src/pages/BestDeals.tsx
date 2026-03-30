import { Link } from "react-router-dom";
import OutboundLink from "../components/OutboundLink";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { sites, getSiteBySlug, getVisitUrl, isAffiliated } from "../data/sites";
import { StaggerContainer, StaggerChild, MotionButton, PageTransition } from "../components/MotionWrappers";
import { currentYear, lastCheckedDate } from "../lib/dates";

interface Deal {
  siteSlug: string;
  siteName: string;
  description: string;
  originalPrice: string;
  dealPrice: string;
  discountPercent: number;
  expiry: "limited" | "flash" | "ongoing";
}

const deals: Deal[] = ([
  { siteSlug: "helix-studios", siteName: "Helix Studios", description: "66% off annual membership — pay just $11.99/mo for 4,000+ scenes", originalPrice: "$34.95/mo", dealPrice: "$11.99/mo", discountPercent: 66, expiry: "limited" as const },
  { siteSlug: "next-door-twink", siteName: "Next Door Twink", description: "56% off annual — 45+ channels & 12,500+ videos for $10.95/mo", originalPrice: "$24.95/mo", dealPrice: "$10.95/mo", discountPercent: 56, expiry: "ongoing" as const },
  { siteSlug: "next-door-world", siteName: "Next Door World", description: "56% off annual — full ASGmax network access for $10.95/mo", originalPrice: "$24.95/mo", dealPrice: "$10.95/mo", discountPercent: 56, expiry: "ongoing" as const },
  { siteSlug: "twinks-in-shorts", siteName: "Twinks in Shorts", description: "50% off first 3 months", originalPrice: "$29.95/mo", dealPrice: "$14.97/mo", discountPercent: 50, expiry: "ongoing" as const },
  { siteSlug: "southern-strokes", siteName: "Southern Strokes", description: "55% off annual plan", originalPrice: "$29.95/mo", dealPrice: "$9.95/mo", discountPercent: 55, expiry: "ongoing" as const },
  { siteSlug: "breed-me-raw", siteName: "Breed Me Raw", description: "Up to 40% off annual plan", originalPrice: "$29.95/mo", dealPrice: "$9.95/mo", discountPercent: 40, expiry: "ongoing" as const },
  { siteSlug: "athletic-twinks", siteName: "Athletic Twinks", description: "40% off quarterly plan", originalPrice: "$29.95/mo", dealPrice: "$9.95/mo", discountPercent: 40, expiry: "ongoing" as const },
  { siteSlug: "daddy-on-twink", siteName: "Daddy on Twink", description: "45% off annual plan", originalPrice: "$29.95/mo", dealPrice: "$9.95/mo", discountPercent: 45, expiry: "ongoing" as const },
] as Deal[]).sort((a, b) => b.discountPercent - a.discountPercent);

const StatusIndicator = ({ expiry }: { expiry: "limited" | "flash" | "ongoing" }) => (
  <div className="flex items-center gap-2 text-xs">
    {expiry === "limited" ? (
      <>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
        <span className="text-destructive font-medium">Expires Soon</span>
      </>
    ) : expiry === "flash" ? (
      <>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
        </span>
        <span className="text-secondary font-medium">Flash Deal — 48 hours</span>
      </>
    ) : (
      <>
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-emerald-400 font-medium">Active Deal</span>
      </>
    )}
  </div>
);

const BestDeals = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>{`Best Gay Twink Site Deals & Discounts ${currentYear} | TwinkVault`}</title>
        <meta name="description" content="The best current gay twink site deals and discounts. Staff-verified offers updated weekly so you never overpay." />
        <link rel="canonical" href="https://twinkvault.com/best-deals" />
      </Helmet>

      <section className="hero-mesh py-16">
        <div className="container text-center">
          <motion.h1
            className="font-heading font-bold heading-gradient inline-block"
            style={{ fontSize: "clamp(1.8rem, 5vw, 3.5rem)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Every Deal We Could Find
          </motion.h1>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Annual plans, flash sales, and trial offers — all verified and working. Dead links get removed within 24 hours.
          </motion.p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-button bg-muted px-3 py-1.5 text-xs text-muted-foreground">
{`🔄 Last checked: ${lastCheckedDate}`}
          </span>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <StaggerContainer className="grid gap-4 md:grid-cols-2">
            {deals.map((deal) => (
              <StaggerChild key={deal.siteSlug}>
                <motion.div
                  className="glass-card rounded-lg p-6"
                  whileHover={{ scale: 1.025, y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-xl font-bold">{deal.siteName}</h2>
                        <span className={`rounded-button px-2 py-0.5 text-xs font-semibold ${
                          deal.expiry === "limited" ? "bg-destructive/20 text-destructive" : deal.expiry === "flash" ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"
                        }`}>
                          {deal.expiry === "limited" ? "Limited Time" : deal.expiry === "flash" ? "Flash Deal" : "Ongoing"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{deal.description}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-button px-2 py-1 text-xs font-bold text-emerald-400 bg-emerald-400/10">
                      -{deal.discountPercent}%
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <span className="text-sm text-muted-foreground line-through">{deal.originalPrice}</span>
                    <span className="text-lg font-bold text-emerald-400">{deal.dealPrice}</span>
                  </div>

                  <div className="mt-3">
                    <StatusIndicator expiry={deal.expiry} />
                  </div>

                  <MotionButton className="mt-4">
                    {(() => {
                      const site = getSiteBySlug(deal.siteSlug);
                      const url = site ? getVisitUrl(site) : `/go/${deal.siteSlug}`;
                      const affiliated = site ? isAffiliated(site) : true;
                      return (
                        <>
                          {site ? (
                            <OutboundLink
                              site={site}
                              className={`cta-btn flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground ${!affiliated ? "opacity-85" : ""}`}
                            >
                              Claim Deal <ArrowRight size={14} />
                            </OutboundLink>
                          ) : (
                            <Link
                              to={url}
                              className="cta-btn flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
                            >
                              Claim Deal <ArrowRight size={14} />
                            </Link>
                          )}
                          <div className="mt-2 flex items-center justify-center gap-3">
                            <p className="text-[10px] text-muted-foreground">Opens in new tab{affiliated ? " · Affiliate link" : ""}</p>
                            <Link to={`/discount/${deal.siteSlug}`} className="text-[10px] font-medium text-secondary hover:underline">
                              Full discount details →
                            </Link>
                          </div>
                        </>
                      );
                    })()}
                  </MotionButton>
                </motion.div>
              </StaggerChild>
            ))}
          </StaggerContainer>

          <motion.div
            className="mt-16 glass-card rounded-lg p-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Where These Deals Come From</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Most are annual plan discounts built into the site's own pricing page — you'd find them yourself if you dug around. We just put them in one place so you can compare. Some are affiliate-exclusive rates we negotiated. Either way, every link is tested before it goes live.
            </p>
            <Link to="/top-sites" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline">
              View Full Site Rankings <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default BestDeals;
