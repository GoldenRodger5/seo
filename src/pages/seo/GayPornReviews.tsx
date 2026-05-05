import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Layout from "../../components/Layout";
import { PageTransition } from "../../components/MotionWrappers";
import StarRating from "../../components/StarRating";
import { sites, isAffiliated } from "../../data/sites";
import { siteNicheMap } from "../../data/site-niches";
import { TOTAL_SITES } from "../../lib/siteStats";
import { currentYear } from "../../lib/dates";

const NICHE_GROUPS: { slug: string; label: string }[] = [
  { slug: "twink", label: "Twink" },
  { slug: "bareback", label: "Bareback" },
  { slug: "amateur", label: "Amateur" },
  { slug: "daddy", label: "Daddy / Older-Younger" },
  { slug: "asian", label: "Asian" },
  { slug: "japanese", label: "Japanese" },
  { slug: "muscle", label: "Muscle / Jock" },
  { slug: "bear", label: "Bear" },
  { slug: "latin", label: "Latin" },
  { slug: "interracial", label: "Interracial" },
  { slug: "str8-curious", label: "Straight-Curious" },
  { slug: "fetish", label: "Fetish & Group" },
];

const path = "/gay-porn-site-reviews";
const url = `https://twinkvault.com${path}`;
const fullTitle = `Gay Porn Site Reviews — ${TOTAL_SITES} Sites Tested & Scored (${currentYear}) | TwinkVault`;
const description = `Honest reviews of ${TOTAL_SITES} gay porn sites — paid memberships only, scored on content quality, value, updates, and mobile UX. Browse by niche.`;

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
    { "@type": "ListItem", position: 2, name: "Gay Porn Site Reviews", item: url },
  ],
};

const GayPornReviews = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>

      <section className="hero-mesh py-16">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 rounded-button bg-secondary/15 px-3 py-1.5 text-xs font-medium text-secondary">
              {TOTAL_SITES} Sites · {currentYear}
            </span>
            <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
              Gay Porn Site Reviews — {TOTAL_SITES} Sites Tested & Scored
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Every review on TwinkVault is based on a paid membership. We score sites on four pillars — content quality, value-for-money, update frequency, and mobile experience — and re-verify every score monthly. Browse by niche below or jump to the full ranked list.
            </p>
            <nav aria-label="Breadcrumb" className="mt-4 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Gay Porn Site Reviews</span>
            </nav>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-5xl">
          <div className="mb-10 glass-card rounded-lg p-6 border-l-4 border-l-secondary">
            <h2 className="font-heading text-lg font-bold">How TwinkVault Scoring Works</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We pay for every membership. Each site is scored 1–100 across four pillars and the average becomes the headline 1–5 score. No ranking is sold. Affiliate revenue funds the operation but never determines placement — sites without affiliate programs are still reviewed and listed honestly.
            </p>
            <Link to="/methodology" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
              Read the full methodology <ArrowRight size={12} />
            </Link>
          </div>

          {NICHE_GROUPS.map((group) => {
            const groupSites = sites
              .filter((s) => isAffiliated(s) && (siteNicheMap[s.slug] ?? []).includes(group.slug))
              .sort((a, b) => b.overall_score - a.overall_score);
            if (groupSites.length === 0) return null;
            return (
              <div key={group.slug} className="mb-10">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="font-heading text-xl font-bold heading-gradient inline-block">{group.label} ({groupSites.length})</h2>
                  <Link to={`/niche/${group.slug}`} className="text-xs font-medium text-secondary hover:underline">
                    View niche hub →
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {groupSites.map((s) => (
                    <Link
                      key={s.id}
                      to={`/reviews/${s.slug}`}
                      className="glass-card rounded-lg p-4 hover:border-primary/50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-heading font-semibold truncate">{s.name}</p>
                        <StarRating score={s.overall_score} size={11} />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-secondary">{s.overall_score}/5</p>
                        <p className="text-[10px] text-muted-foreground">{s.price_annual}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border/50 pt-6 text-sm">
            <Link to="/top-sites" className="inline-flex items-center gap-1 font-medium text-secondary hover:underline">
              See full ranked list <ArrowRight size={12} />
            </Link>
            <Link to="/gay-porn-sites-ranked" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Sortable comparison table <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default GayPornReviews;
