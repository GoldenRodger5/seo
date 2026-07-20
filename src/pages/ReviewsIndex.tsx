import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Check, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import StarRating from "../components/StarRating";
import AnimateOnScroll from "../components/AnimateOnScroll";
import OutboundLink from "../components/OutboundLink";
import SitePlaceholderImage from "../components/SitePlaceholderImage";
import LocalisedPrice from "../components/LocalisedPrice";
import FeaturedDealBanner from "../components/common/FeaturedDealBanner";
import { Fragment } from "react";
import { sites, categories, isAffiliated, isPendingReview, getSiteBySlug } from "../data/sites";
import type { SiteData } from "../data/sites";
import { siteNicheMap } from "../data/site-niches";
import { getNiche } from "../data/niches";
import { currentYear, currentMonthLong } from "../lib/dates";
import { TOTAL_SITES } from "../lib/siteStats";
import { parseMonthlyPrice } from "../lib/dealMath";

const sortOptions = ["Top Rated", "Best Value", "Most Active", "Newest", "Alphabetical"];

// Pills retained from the categories list. HD Quality and Mobile Friendly
// were removed — in 2026 nearly every site qualifies, so the pills filter
// almost nothing useful. Best Value is now a derived filter (see below),
// not a category-membership filter.
const FILTER_SLUGS = new Set(["amateur-twinks", "premium-studios", "free-trials"]);
const BEST_VALUE_KEY = "best-value-derived";

// EDITOR_RECOMMENDATIONS: rewrite manually each month
// Three hand-picked sites that anchor the editorial framing of the page.
// CTA goes to /reviews/{slug} only — this section sends to reviews, not
// affiliate destinations. Visit Site logic stays on the per-card grid below.
const EDITOR_RECOMMENDATIONS: { slug: string; note: string }[] = [
  {
    slug: "nakedsword",
    note: "Start here if you want premium production quality and the largest scene library at the best annual rate.",
  },
  {
    slug: "sean-cody",
    note: "The all-American athletic casting we keep returning to, especially at 75% off.",
  },
  {
    slug: "next-door-world",
    note: "The deepest network catalog. One subscription, 45+ channels. Best value if you want variety.",
  },
];

/** Primary niche from siteNicheMap → display name. Returns null if absent. */
function primaryNicheLabel(site: SiteData): string | null {
  const slug = siteNicheMap[site.slug]?.[0];
  if (!slug) return null;
  return getNiche(slug)?.displayName ?? null;
}

/**
 * Best Value derived filter: annual ≤ $10/mo AND score ≥ 4.0. Replaces the
 * category-membership lookup, which was a hand-tagged list and missed sites
 * that should have qualified.
 */
function isBestValue(site: SiteData): boolean {
  const annual = parseMonthlyPrice(site.price_annual);
  return annual !== null && annual <= 10 && site.overall_score >= 4.0;
}

/**
 * Free Trials filter.
 * TODO(data): `has_free_trial` boolean is inconsistent with the
 * "free-trials" category tag — some sites are tagged but flagged as
 * paid intros ($2.95 etc.). Falling back to the category tag for now
 * since it's how the existing pills filtered. Audit sites.ts and pick
 * one canonical signal.
 */
function isFreeTrial(site: SiteData): boolean {
  return site.categories.includes("free-trials");
}

const EditorRecommendationsStrip = () => {
  const items = EDITOR_RECOMMENDATIONS.map((r) => ({ ...r, site: getSiteBySlug(r.slug) }))
    .filter((r): r is { slug: string; note: string; site: SiteData } => Boolean(r.site));
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary mb-4">
        Editor's recommendations
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(({ slug, note, site }) => (
          <Link
            key={slug}
            to={`/reviews/${slug}`}
            className="block rounded-lg border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-heading text-lg font-bold">{site.name}</h3>
              <span className="text-sm font-semibold text-secondary tabular-nums shrink-0">
                {site.overall_score}/5
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{note}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline underline-offset-4">
              Read review <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

const ReviewsIndex = () => {
  const [sort, setSort] = useState("Top Rated");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const visiblePillCategories = categories.filter((c) => FILTER_SLUGS.has(c.slug));

  let filtered: SiteData[];
  if (activeFilter === null) {
    filtered = [...sites];
  } else if (activeFilter === BEST_VALUE_KEY) {
    filtered = sites.filter(isBestValue);
  } else if (activeFilter === "free-trials") {
    filtered = sites.filter(isFreeTrial);
  } else {
    filtered = sites.filter((s) => s.categories.includes(activeFilter));
  }

  if (sort === "Top Rated") filtered.sort((a, b) => a.rank - b.rank);
  else if (sort === "Best Value") filtered.sort((a, b) => b.value_score - a.value_score);
  else if (sort === "Most Active") filtered.sort((a, b) => b.update_frequency - a.update_frequency);
  else if (sort === "Newest") filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
  else if (sort === "Alphabetical") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Layout>
      <Helmet>
        <title>{`All reviews — ${TOTAL_SITES} gay porn sites scored | TwinkVault`}</title>
        <meta name="description" content={`${TOTAL_SITES} gay porn sites reviewed hands-on — paid memberships and close research. Same four-pillar rubric, updated monthly.`} />
        <link rel="canonical" href="https://twinkvault.com/reviews" />
      </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `All Reviews ${currentYear}`,
          description: `${TOTAL_SITES} gay porn site reviews — tested with paid memberships, scored on the same four-pillar rubric.`,
          url: "https://twinkvault.com/reviews",
          mainEntity: {
            "@type": "ItemList",
            name: `All Reviews ${currentYear}`,
            numberOfItems: sites.length,
            itemListElement: [...sites].sort((a, b) => a.rank - b.rank).map((site, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: site.name,
              url: `https://twinkvault.com/reviews/${site.slug}`,
            })),
          },
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
            { "@type": "ListItem", position: 2, name: "Reviews", item: "https://twinkvault.com/reviews" },
          ],
        }) }} />

      <section className="py-16">
        <div className="container max-w-6xl">
          <AnimateOnScroll>
            <div>
              <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
                All reviews
              </h1>
              <p className="mt-4 text-muted-foreground max-w-2xl">
                {TOTAL_SITES} reviews, hands-on — paid memberships and close research. Same rubric, every time. Last updated {currentMonthLong} {currentYear}.
              </p>
            </div>
          </AnimateOnScroll>

          <EditorRecommendationsStrip />

          {/* Sort + Filter */}
          <div className="mt-12 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSort(opt)}
                  className={`rounded-button px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                    sort === opt
                      ? "gold-gradient text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter(null)}
                className={`rounded-button px-3 py-2 text-xs transition-all min-h-[36px] ${
                  !activeFilter ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {visiblePillCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveFilter(cat.slug)}
                  className={`rounded-button px-3 py-2 text-xs transition-all min-h-[36px] ${
                    activeFilter === cat.slug ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              <button
                onClick={() => setActiveFilter(BEST_VALUE_KEY)}
                className={`rounded-button px-3 py-2 text-xs transition-all min-h-[36px] ${
                  activeFilter === BEST_VALUE_KEY ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Best Value
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((site, idx) => {
              const niche = primaryNicheLabel(site);
              return (
                <Fragment key={site.id}>
                  {idx === 6 && (
                    <div className="col-span-full sm:col-span-2 lg:col-span-3">
                      <FeaturedDealBanner placement="reviews-index" className="!my-6 lg:!my-8 !px-0" />
                    </div>
                  )}
                <AnimateOnScroll>
                  <div className="card-glow glass-card flex flex-col rounded-lg overflow-hidden h-full">
                    <SitePlaceholderImage site={site} />
                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h2 className="font-heading text-lg font-bold inline-flex items-baseline gap-1.5 min-w-0">
                          <Check size={14} className="text-emerald-400 shrink-0 translate-y-px" aria-label="Reviewed" />
                          <span className="truncate">{site.name}</span>
                        </h2>
                        {isPendingReview(site) ? (
                          <span className="rounded-button bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                            Pending Review
                          </span>
                        ) : (
                          <span className="text-base font-semibold text-secondary tabular-nums shrink-0">
                            {site.overall_score}/5
                          </span>
                        )}
                      </div>
                      {!isPendingReview(site) && (
                        <div className="mt-1">
                          <StarRating score={site.overall_score} size={13} />
                        </div>
                      )}
                      {niche && (
                        <div className="mt-3">
                          <span className="rounded-button bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {niche}
                          </span>
                        </div>
                      )}
                      {/* TODO: trim description manually to <= 15 words in sites.ts over time */}
                      <p className="mt-3 flex-1 text-sm text-muted-foreground line-clamp-2">{site.short_description}</p>
                      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                        {isPendingReview(site) ? (
                          <span className="text-xs text-muted-foreground/70">Pricing TBD</span>
                        ) : (
                          <LocalisedPrice usd={site.price_monthly} className="text-xs text-foreground/80" />
                        )}
                        {site.deal_discount > 0 && (
                          <span className="rounded-button bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 tabular-nums">
                            −{site.deal_discount}% deal
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link
                          to={`/reviews/${site.slug}`}
                          className={`${isAffiliated(site) ? "flex-1" : "block w-full"} rounded-button border border-primary px-3 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors`}
                        >
                          Read Review
                        </Link>
                        {isAffiliated(site) && (
                          <OutboundLink
                            site={site}
                            ctaPosition="reviews-grid-card"
                            sourceTypeOverride="reviews_index_card"
                            className="flex-1 cta-btn gold-gradient inline-flex items-center justify-center gap-1 rounded-button px-3 py-2 text-sm font-semibold text-secondary-foreground"
                          >
                            Visit Site
                          </OutboundLink>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
                </Fragment>
              );
            })}
          </div>

          {/* Footer hint — editorial sign-off, not a CTA */}
          <p className="mt-12 text-xs text-muted-foreground">
            Missing a site? It's because I haven't tested it yet.{" "}
            <Link to="/methodology" className="text-secondary hover:underline underline-offset-4">
              How I pick what to test →
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default ReviewsIndex;
