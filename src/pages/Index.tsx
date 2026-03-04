import { Link } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import StarRating from "../components/StarRating";
import AnimateOnScroll from "../components/AnimateOnScroll";
import SocialProofStrip from "../components/SocialProofStrip";
import InlineEmailCapture from "../components/InlineEmailCapture";
import Layout from "../components/Layout";
import { getFeaturedSites, categories, sites } from "../data/sites";

const HeroSection = () => {
  const words = "The Internet's Best Guide to Twink Content".split(" ");

  return (
    <section className="hero-mesh relative overflow-hidden py-24 md:py-36">
      {/* Radial glow behind headline */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/[0.12] blur-[150px]" />

      {/* Animated orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="orb absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="orb-delay absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-primary/[0.08] blur-[120px]" />
      </div>

      <div className="container relative text-center stagger-in">
        <h1 className="hero-heading font-heading font-bold leading-tight">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`inline-block mr-[0.3em] ${
                word === "Twink" || word === "Content" ? "gold-gradient-text" : ""
              }`}
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Honest, independent reviews of the top gay twink sites — ranked by quality, value, and content.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/top-sites"
            className="cta-btn gold-gradient inline-flex items-center gap-2 rounded-button px-8 py-3.5 text-sm font-semibold text-secondary-foreground"
          >
            See Top Rated Sites <ArrowRight size={16} />
          </Link>
          <Link
            to="/top-sites"
            className="inline-flex items-center gap-2 rounded-button border border-border px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Browse All Reviews
          </Link>
        </div>
        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="flex gap-0.5 star-stagger">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-secondary text-secondary" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">Reviewing the web's best twink content since 2024</span>
        </div>
      </div>
    </section>
  );
};

const badgeColor = (badge: string | null) => {
  if (!badge) return "";
  if (badge.includes("Value") || badge.includes("Deal")) return "gold-gradient text-secondary-foreground";
  if (badge.includes("Choice") || badge.includes("Top")) return "gold-gradient text-secondary-foreground";
  if (badge.includes("Popular")) return "bg-primary/20 text-primary";
  if (badge.includes("Trial")) return "bg-success/20 text-success-foreground";
  return "bg-primary/15 text-primary";
};

const TopPicksSection = () => {
  const featured = getFeaturedSites();
  return (
    <AnimateOnScroll>
      <section className="py-16">
        <div className="container">
          <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">🏆 Editor's Top Picks</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {featured.map((site) => (
              <Link
                key={site.id}
                to={`/reviews/${site.slug}`}
                className="card-glow glass-card flex flex-col rounded-lg p-5"
              >
                {site.badge && (
                  <span className={`mb-3 inline-block self-start rounded-button px-2.5 py-1 text-xs font-semibold ${badgeColor(site.badge)}`}>
                    {site.badge}
                  </span>
                )}
                <h3 className="font-heading text-lg font-semibold">{site.name}</h3>
                <StarRating score={site.overall_score} size={14} />
                <p className="mt-2 flex-1 text-xs text-muted-foreground line-clamp-2">{site.short_description}</p>
                <span className="cta-btn mt-4 inline-flex items-center justify-center rounded-button gold-gradient px-4 py-2 text-xs font-semibold text-secondary-foreground">
                  Visit Site
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  );
};

const CategoriesSection = () => (
  <AnimateOnScroll>
    <section className="py-16">
      <div className="container">
        <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">Browse By Category</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="card-glow glass-card flex items-center gap-4 rounded-lg p-5"
            >
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <h3 className="font-heading text-lg font-semibold">{cat.name}</h3>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  </AnimateOnScroll>
);

const LatestReviewsSection = () => {
  const latest = sites.slice(0, 3);
  return (
    <AnimateOnScroll>
      <section className="py-16">
        <div className="container">
          <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">Latest Reviews</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {latest.map((site) => (
              <Link
                key={site.id}
                to={`/reviews/${site.slug}`}
                className="card-glow glass-card rounded-lg p-6"
              >
                <h3 className="font-heading text-xl font-semibold">{site.name}</h3>
                <StarRating score={site.overall_score} size={14} />
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{site.short_description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary">
                  Read Full Review <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AnimateOnScroll>
  );
};

const TrustSection = () => (
  <AnimateOnScroll>
    <section className="border-t border-border py-16">
      <div className="container">
        <h2 className="text-center font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block w-full">Why Trust Us</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            { icon: "🔍", title: "Independent Reviews", desc: "We pay for memberships ourselves and report honestly." },
            { icon: "🚫", title: "No Paid Placements", desc: "Rankings are based on quality, not who pays us more." },
            { icon: "🔄", title: "Updated Monthly", desc: "We revisit sites regularly to keep reviews current." },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <span className="text-4xl">{item.icon}</span>
              <h3 className="mt-4 font-heading text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </AnimateOnScroll>
);

const Index = () => (
  <Layout>
    <HeroSection />
    <SocialProofStrip />
    <TopPicksSection />
    <CategoriesSection />
    <LatestReviewsSection />
    <InlineEmailCapture />
    <TrustSection />
  </Layout>
);

export default Index;
