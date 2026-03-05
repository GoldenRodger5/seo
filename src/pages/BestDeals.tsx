import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { sites, getSiteBySlug, getVisitUrl, isAffiliated } from "../data/sites";
import { StaggerContainer, StaggerChild, MotionButton, PageTransition } from "../components/MotionWrappers";

interface Deal {
  siteSlug: string;
  siteName: string;
  description: string;
  originalPrice: string;
  dealPrice: string;
  discountPercent: number;
  expiry: "limited" | "ongoing";
}

const deals: Deal[] = ([
  { siteSlug: "helix-studios", siteName: "Helix Studios", description: "67% off annual membership", originalPrice: "$29.99/mo", dealPrice: "$9.99/mo", discountPercent: 67, expiry: "limited" as const },
  { siteSlug: "twink-in-shorts", siteName: "Twink In Shorts", description: "50% off first 3 months", originalPrice: "$15.99/mo", dealPrice: "$7.99/mo", discountPercent: 50, expiry: "limited" as const },
  { siteSlug: "athletic-twinks", siteName: "Athletic Twinks", description: "40% off quarterly plan", originalPrice: "$21.99/mo", dealPrice: "$12.99/mo", discountPercent: 40, expiry: "ongoing" as const },
  { siteSlug: "southern-strokes", siteName: "Southern Strokes", description: "55% off annual plan", originalPrice: "$19.99/mo", dealPrice: "$8.99/mo", discountPercent: 55, expiry: "limited" as const },
  { siteSlug: "twinks-bareback", siteName: "Twinks Bareback", description: "Free 2-day trial + 45% off", originalPrice: "$14.99/mo", dealPrice: "$7.99/mo", discountPercent: 45, expiry: "ongoing" as const },
  { siteSlug: "touch-that-boy", siteName: "Touch That Boy", description: "35% off all plans", originalPrice: "$16.99/mo", dealPrice: "$10.99/mo", discountPercent: 35, expiry: "ongoing" as const },
] as Deal[]).sort((a, b) => b.discountPercent - a.discountPercent);

const StatusIndicator = ({ expiry }: { expiry: "limited" | "ongoing" }) => (
  <div className="flex items-center gap-2 text-xs">
    {expiry === "limited" ? (
      <>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
        </span>
        <span className="text-destructive font-medium">Expires Soon</span>
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
        <title>Don't Pay Full Price. Ever. | TwinkVault</title>
        <meta name="description" content="The best current twink site deals and discounts. Updated weekly so you never miss a bargain." />
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
            Don't Pay Full Price. Ever.
          </motion.h1>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            We track the best current offers so you don't have to. Updated weekly.
          </motion.p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-button bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            🔄 Last checked: March 3, 2026
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
                          deal.expiry === "limited" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                        }`}>
                          {deal.expiry === "limited" ? "Limited Time" : "Ongoing"}
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
                    <Link
                      to={`/go/${deal.siteSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cta-btn flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
                    >
                      Claim Deal <ArrowRight size={14} />
                    </Link>
                  </MotionButton>
                  <p className="mt-1 text-center text-[10px] text-muted-foreground">Opens in new tab · Affiliate link</p>
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
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">How We Find These Deals</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              We negotiate directly with sites and monitor their public promotions weekly. Every deal listed here is verified by our team — we never list expired or fake offers.
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
