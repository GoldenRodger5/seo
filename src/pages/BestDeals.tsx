import { Link } from "react-router-dom";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import AnimateOnScroll from "../components/AnimateOnScroll";
import { sites } from "../data/sites";

interface Deal {
  siteSlug: string;
  siteName: string;
  description: string;
  originalPrice: string;
  dealPrice: string;
  discountPercent: number;
  expiry: "limited" | "ongoing";
}

const deals: Deal[] = [
  { siteSlug: "helix-studios", siteName: "Helix Studios", description: "67% off annual membership", originalPrice: "$29.99/mo", dealPrice: "$9.99/mo", discountPercent: 67, expiry: "limited" },
  { siteSlug: "twink-in-shorts", siteName: "Twink In Shorts", description: "50% off first 3 months", originalPrice: "$15.99/mo", dealPrice: "$7.99/mo", discountPercent: 50, expiry: "limited" },
  { siteSlug: "athletic-twinks", siteName: "Athletic Twinks", description: "40% off quarterly plan", originalPrice: "$21.99/mo", dealPrice: "$12.99/mo", discountPercent: 40, expiry: "ongoing" },
  { siteSlug: "southern-strokes", siteName: "Southern Strokes", description: "55% off annual plan", originalPrice: "$19.99/mo", dealPrice: "$8.99/mo", discountPercent: 55, expiry: "limited" },
  { siteSlug: "twinks-bareback", siteName: "Twinks Bareback", description: "Free 2-day trial + 45% off", originalPrice: "$14.99/mo", dealPrice: "$7.99/mo", discountPercent: 45, expiry: "ongoing" },
  { siteSlug: "touch-that-boy", siteName: "Touch That Boy", description: "35% off all plans", originalPrice: "$16.99/mo", dealPrice: "$10.99/mo", discountPercent: 35, expiry: "ongoing" },
].sort((a, b) => b.discountPercent - a.discountPercent);

const CountdownTimer = () => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Clock size={12} />
    <span className="font-mono">23:14:07</span>
  </div>
);

const BestDeals = () => (
  <Layout>
    <Helmet>
      <title>Best Gay Twink Site Deals & Discounts — 2025 | TwinkVault</title>
      <meta name="description" content="The best current twink site deals and discounts. Updated weekly so you never miss a bargain." />
      <link rel="canonical" href="https://twinkvault.com/best-deals" />
    </Helmet>

    <section className="hero-mesh py-16">
      <div className="container text-center stagger-in">
        <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
          Best Deals & Discounts
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          We track the best current offers so you don't have to. Updated weekly.
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-button bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <Clock size={12} /> Last checked: March 3, 2026
        </span>
      </div>
    </section>

    <section className="py-16">
      <div className="container">
        <div className="grid gap-4 md:grid-cols-2">
          {deals.map((deal) => (
            <AnimateOnScroll key={deal.siteSlug}>
              <div className="card-glow glass-card rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading text-xl font-bold">{deal.siteName}</h2>
                      <span className={`rounded-button px-2 py-0.5 text-xs font-semibold ${
                        deal.expiry === "limited"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {deal.expiry === "limited" ? "Limited Time" : "Ongoing"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{deal.description}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-button px-2 py-1 text-xs font-bold" style={{ color: "hsl(142, 71%, 45%)", background: "hsl(142 71% 45% / 0.1)" }}>
                    <Tag size={12} />
                    -{deal.discountPercent}%
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <span className="text-sm text-muted-foreground line-through">{deal.originalPrice}</span>
                  <span className="text-lg font-bold" style={{ color: "hsl(142, 71%, 45%)" }}>{deal.dealPrice}</span>
                </div>

                {deal.expiry === "limited" && (
                  <div className="mt-3">
                    <CountdownTimer />
                  </div>
                )}

                <Link
                  to={`/go/${deal.siteSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-btn mt-4 flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
                >
                  Claim Deal <ArrowRight size={14} />
                </Link>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Trust section */}
        <AnimateOnScroll className="mt-16">
          <div className="glass-card rounded-lg p-8 text-center">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">How We Find These Deals</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              We negotiate directly with sites and monitor their public promotions weekly. Every deal listed here is verified by our team — we never list expired or fake offers.
            </p>
            <Link
              to="/top-sites"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-secondary hover:underline"
            >
              View Full Site Rankings <ArrowRight size={14} />
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  </Layout>
);

export default BestDeals;
