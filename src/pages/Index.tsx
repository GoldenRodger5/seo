import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import OutboundLink from "../components/OutboundLink";
import InlineEmailCapture from "../components/InlineEmailCapture";
import StarRating from "../components/StarRating";
import LocalisedPrice from "../components/LocalisedPrice";
import SmartImage from "../components/common/SmartImage";
import LandingDataBlock from "../components/LandingDataBlock";
import FeaturedDealBanner from "../components/common/FeaturedDealBanner";
import { sites, isAffiliated, isPendingReview, getTopDealPick, getRecentlyUpdatedPromotable } from "../data/sites";
import type { SiteData } from "../data/sites";
import { getSiteImagery } from "../data/site-imagery";
import { currentYear, currentMonthLong, currentMonthShort } from "../lib/dates";
import { parseMonthlyPrice } from "../lib/dealMath";
import { MANFINDER_URL, trackManfinderClick } from "../lib/crak";

// ─────────────────────────────────────────────────────────────────────────────
// Hand-curated editorial content — rewrite each month after the data refresh.
// ─────────────────────────────────────────────────────────────────────────────

// EDITOR_NOTE: hand-curated for the current dynamic pick from getTopDealPick().
// Rewrite manually each month — should reference: library size, update cadence,
// next-best alternative for comparison, and the active deal. ~60-80 words.
// If the dynamic pick no longer matches EDITOR_PICK_NOTE_SLUG below, the section
// gracefully falls back to the site's short_description to keep it honest.
const EDITOR_PICK_NOTE_SLUG = "nakedsword";
const EDITOR_PICK_NOTE =
  "NakedSword is the closest thing this category has to a default. The library is the largest I've personally subscribed to — 50,000+ scenes spanning Falcon, Hot House, Raging Stallion, and NakedSword Originals, and new scenes land daily. At $9.99/mo annual with the current 67% off, it undercuts Sean Cody's $7.49 and Men.com's $8.33 on per-scene math by a wider margin than either's headline discount suggests. If you only subscribe to one site, this is the one.";

// EDITOR_NOTE: niche tiles hand-curated. Hooks ≤90 chars. Verify against
// siteNicheMap once a month and rewrite when site counts shift materially.
// Cover image is a representative site banner per niche until dedicated
// niche cover art lands. See docs/missing-niche-images.md.
const ALL_NICHES: {
  slug: string;
  name: string;
  siteCount: number;
  image: string;
  hook: string;
  badge?: string;
}[] = [
  { slug: "twink",    name: "Twink",    siteCount: 41, image: "/site-banners/twinks-in-shorts-hero.jpg",
    hook: "The core of TwinkVault: premium studios down to amateur networks.",
    badge: "Most reviewed" },
  { slug: "bareback", name: "Bareback", siteCount: 47, image: "/site-banners/bareback-that-hole-hero.jpg",
    hook: "The largest category here, all explicitly bareback-focused.",
    badge: "Largest" },
  { slug: "amateur",  name: "Amateur",  siteCount: 40, image: "/site-banners/southern-strokes-hero.jpg",
    hook: "Real performers, no studio polish. Casting feels found, not cast." },
  { slug: "muscle",   name: "Muscle",   siteCount: 14, image: "/site-banners/athletic-twinks-hero.jpg",
    hook: "Built physiques, gym aesthetics. Heavy crossover with premium studios." },
  { slug: "daddy",    name: "Daddy",    siteCount: 7,  image: "/site-banners/daddy-on-twink-hero.jpg",
    hook: "Older-younger pairings. Mostly bareback, mostly mature studios." },
  { slug: "asian",    name: "Asian",    siteCount: 7,  image: "/site-banners/peterfever-hero.jpg",
    hook: "Asian performers and studios. Limited but growing selection." },
  { slug: "jock",     name: "Jock",     siteCount: 6,  image: "/site-banners/athletic-twinks-hero.jpg",
    hook: "Athletic builds, sports themes. Crossover with college and amateur." },
  { slug: "college",  name: "College",  siteCount: 5,  image: "/site-banners/boys-at-camp-hero.jpg",
    hook: "Casting that skews 18–22, often dorm-themed or amateur networks." },
  { slug: "bear",     name: "Bear",     siteCount: 4,  image: "/site-banners/bear-films-hero.jpg",
    hook: "Heavier, hairier, more masculine. Smaller but distinct catalog." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Compact one-word category tag derived from each site's metadata. */
function categoryTag(site: SiteData): string {
  const c = site.categories;
  if (c.includes("amateur-twinks")) return "Amateur";
  if (c.includes("premium-studios") && c.includes("best-value")) return "Network";
  if (c.includes("premium-studios")) return "Premium";
  if (c.includes("best-value")) return "Network";
  const first = c[0] ?? "";
  return first.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()) || "Site";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────

const Hero = () => (
  // Short full-width text hero. The text IS the hero, no thumbnail
  // contact-sheet on the right (deleted from prior sprint; tile sizes
  // were too small to deliver the "here's what we have" payoff). The
  // niche grid below now serves as the visual hook, sitting close
  // (32px gap) so it reads as a continuous experience.
  //
  // pb-8 (32px) is intentionally tight so the niche grid follows
  // visually — the niche grid's own py-8 lg:py-14 takes care of its
  // own breathing room.
  // Hero pb is intentionally 0 — the niche grid's own py-8 produces the
  // 32px gap to the next section. Don't add bottom padding here, you'll
  // double-pad and the gap balloons to 64px.
  <section className="pt-12 pb-0 md:pt-18 lg:pt-24 lg:min-h-[60vh] flex items-center">
    <div className="container max-w-6xl w-full">
      <h1 className="font-heading font-bold heading-gradient inline-block text-3xl leading-tight md:text-4xl lg:text-5xl xl:text-6xl">
        The best gay twink sites, ranked &amp; reviewed.
      </h1>

      {/* max-w-2xl (≈672px) keeps the paragraph readable — wider
          would stretch into uncomfortably long line-length territory.
          Opening copy leads with the exact head term — on Bing,
          exact-match in H1 + first paragraph is a direct ranking
          signal (and the H1 had drifted off-keyword entirely). */}
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground md:mt-8 md:text-base lg:text-lg">
        We rank the best twink sites from independent reviews of {sites.length} gay porn sites. Every one is built from a paid membership and scored on the same four-pillar rubric. Updated monthly. No paid placements, ever.
      </p>

      <motion.div
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Same gold treatment as Top 10 Visit buttons. min-h-[44px]
            meets WCAG 2.5.5 touch-target minimum. */}
        <Link
          to="/reviews"
          className="cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground min-h-[44px] sm:w-auto sm:text-base"
        >
          Browse all {sites.length} sites →
        </Link>
        <Link
          to="/methodology"
          className="inline-flex w-full items-center justify-center gap-2 rounded-button border border-primary bg-transparent px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors min-h-[44px] sm:w-auto sm:text-base"
        >
          See how we score
        </Link>
      </motion.div>
    </div>
  </section>
);

// EditorsPick standalone component removed — content absorbed into
// TopTen as a sidecar (desktop) / card-above-list (mobile/tablet).
// EDITOR_PICK_NOTE constants and getTopDealPick() are still used.

/**
 * Two-column section on desktop: Top 10 list (left) + sticky Editor's
 * Pick sidecar (right). On mobile/tablet, the sidecar collapses to a
 * full-width card that renders ABOVE the list (user gets the
 * recommendation first, then can scan the full ranked list).
 *
 * Absorbs the prior standalone Editor's Pick section. The standalone
 * version is no longer rendered.
 */
const TopTen = () => {
  // Homepage is a promotional surface: the top-10 features partner sites only
  // (the unfiltered editorial ranking lives at /top-sites). Owner call 2026-07-19.
  const top10 = [...sites].filter((s) => !isPendingReview(s) && isAffiliated(s)).sort((a, b) => b.overall_score - a.overall_score).slice(0, 10);

  // Badge priority: editors-choice (rank #1) > best-value (lowest
  // price_monthly among top 10). Only ONE badge per row.
  // Note: 'recently-tested' is in the spec but sites.ts has no
  // updatedAt field, so we skip it for now.
  const top10Monthly: number[] = top10.map((s) => parseMonthlyPrice(s.price_monthly) ?? Infinity);
  const bestValueIdx = top10Monthly.indexOf(Math.min(...top10Monthly));

  // Editor's Pick — same selection logic as the prior standalone section.
  const pick = getTopDealPick();
  const pickNote = pick && pick.slug === EDITOR_PICK_NOTE_SLUG ? EDITOR_PICK_NOTE : pick?.short_description;

  return (
    // Bottom padding reduced (lg:pb-12 = 48px desktop, pb-8 = 32px mobile)
    // so the sidecar height doesn't open up a ~200px dead space before
    // the Latest reviews H2. Top padding unchanged.
    <section className="border-t border-border/40 pt-12 pb-8 md:pt-16 md:pb-10 lg:pt-20 lg:pb-12">
      <div className="container max-w-6xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold">The Top 10</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ranked by overall score, updated monthly.</p>

        <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6 lg:items-start">

          {/* Editor's Pick sidecar — visible above the list on mobile/tablet
              (default order), positioned to the right on desktop via order utilities. */}
          {pick && (
            <aside className="order-first lg:order-2 lg:sticky lg:top-24">
              <div className="rounded-lg border border-secondary/30 bg-card/40 p-5 md:p-7 lg:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">
                  {currentMonthLong} {currentYear} — Editor's Pick
                </p>
                <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                  <h3 className="font-heading text-2xl md:text-3xl font-bold">{pick.name}</h3>
                  <span className="rounded-button bg-muted/60 px-2.5 py-0.5 text-sm font-semibold text-secondary tabular-nums">
                    {pick.overall_score}/5
                  </span>
                </div>
                <p className="mt-4 text-sm text-foreground/85 leading-relaxed">{pickNote}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
                  <Link
                    to={`/reviews/${pick.slug}`}
                    className="text-secondary hover:underline underline-offset-4 font-medium text-sm"
                  >
                    Read full review →
                  </Link>
                  {isAffiliated(pick) && (
                    <OutboundLink
                      site={pick}
                      ctaPosition="editor-pick"
                      sourceTypeOverride="homepage_editor_pick"
                      className="cta-btn gold-gradient inline-flex items-center justify-center gap-2 rounded-button px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
                    >
                      Visit {pick.name} →
                    </OutboundLink>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Top 10 list */}
          <div className="lg:order-1 min-w-0">
            <ul className="divide-y divide-border/60 border-y border-border/60">
              {top10.map((site, i) => {
                const heroImg = getSiteImagery(site.slug).hero_image_url;
                const isEditorsChoice = i === 0;
                const isBestValue = !isEditorsChoice && i === bestValueIdx;
                return (
                  <li
                    key={site.slug}
                    className="flex items-center gap-3 sm:gap-4 py-3.5 transition-colors hover:bg-muted/15"
                  >
                    <span className="font-mono text-xs text-muted-foreground tabular-nums w-7 sm:w-9 shrink-0 text-right">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="h-10 w-10 sm:h-14 sm:w-14 shrink-0">
                      <SmartImage
                        src={heroImg}
                        alt=""
                        aspectRatio="1:1"
                        fallbackLabel={site.name}
                        className="rounded-md"
                        objectPosition="center 25%"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/reviews/${site.slug}`}
                          className="font-medium hover:text-secondary transition-colors truncate"
                        >
                          {site.name}
                        </Link>
                        {isEditorsChoice && (
                          <span className="rounded-button gold-gradient px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-wider whitespace-nowrap">
                            Editor's Choice
                          </span>
                        )}
                        {isBestValue && (
                          <span className="rounded-button border border-emerald-500/40 bg-emerald-500/5 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider whitespace-nowrap">
                            Best Value
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground tabular-nums flex-wrap">
                        <span className="text-secondary font-semibold">{site.overall_score}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <LocalisedPrice usd={site.price_monthly} />
                        <span className="hidden sm:inline text-muted-foreground/40">·</span>
                        <span className="hidden sm:inline">{categoryTag(site)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/reviews/${site.slug}`}
                        className="hidden sm:inline-flex items-center rounded-button border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors min-h-[36px]"
                      >
                        Read
                      </Link>
                      {isAffiliated(site) ? (
                        <OutboundLink
                          site={site}
                          ctaPosition="top-10-row"
                          sourceTypeOverride="homepage_top_10"
                          className="cta-btn gold-gradient inline-flex items-center rounded-button px-4 py-2 text-xs font-semibold text-secondary-foreground min-h-[40px] sm:min-h-[36px]"
                        >
                          Visit
                        </OutboundLink>
                      ) : (
                        <Link
                          to={`/reviews/${site.slug}`}
                          className="sm:hidden inline-flex items-center rounded-button border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground min-h-[40px]"
                        >
                          Read
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6">
              <Link to="/reviews" className="text-sm text-secondary hover:underline underline-offset-4 font-medium">
                See all {sites.length} sites →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Single 9-tile niche grid. Replaces the prior "3 featured cards +
 * inline middot list of 6" split — every niche is a first-class
 * category and gets the same treatment: image, count, name, hook,
 * optional badge. Per spec: 3×3 desktop, 3×3 tablet, 2-col mobile
 * (last row contains the lone 9th tile, left-aligned).
 */
const FeaturedNiches = () => (
  <section className="py-8 md:py-12 lg:py-14">
    <div className="container max-w-6xl">
      <h2 className="font-heading text-2xl md:text-3xl font-bold">Browse by niche</h2>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 lg:gap-6">
        {ALL_NICHES.map((n) => (
          <Link
            key={n.slug}
            to={`/niche/${n.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card/30 transition-all hover:border-secondary/50 hover:scale-[1.02]"
          >
            {/* Cover image — 16:10 aspect. If image fails to render
                (file missing), the dark muted background underneath
                shows through with the niche name still readable. */}
            <div className="relative w-full">
              <SmartImage
                src={n.image}
                alt=""
                aspectRatio="16:10"
                fallbackLabel={n.name}
                objectPosition="center 30%"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
            </div>

            <div className="flex flex-1 flex-col p-4 md:p-5">
              {/* Eyebrow: count + optional badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-button bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
                  {n.siteCount} sites
                </span>
                {n.badge && (
                  <span className="hidden sm:inline-flex rounded-button bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                    {n.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-heading text-lg md:text-xl lg:text-2xl font-bold leading-tight">
                {n.name}
              </h3>
              <p className="mt-1.5 text-xs md:text-sm text-muted-foreground leading-snug line-clamp-2">
                {n.hook}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const LatestReviews = () => {
  // 6 cards now (was 3) — denser grid, more entry points. Selection
  // remains the freshest promotable sites (highest update_frequency
  // proxy until sites.ts gains a real updated_at field).
  const latest = getRecentlyUpdatedPromotable(6);
  if (latest.length === 0) return null;
  return (
    // Top padding matched to Top 10's bottom padding so the gap
    // between sections lands at ~96px desktop / ~64px mobile total.
    <section className="border-t border-border/40 pt-8 pb-12 md:pt-10 md:pb-16 lg:pt-12 lg:pb-20">
      <div className="container max-w-6xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold">Latest reviews</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {latest.map((site) => (
            <motion.div
              key={site.slug}
              className="glass-card rounded-lg p-5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {/* Fixed 16:10 aspect ratio — source image dimensions vary
                  across the catalog (some 16:10, some 1:1, some 16:9);
                  object-cover crops to consistent shape so the 6-card
                  grid renders uniformly. */}
              <SmartImage
                src={getSiteImagery(site.slug).hero_image_url}
                alt={getSiteImagery(site.slug).banner_alt || `${site.name} cover`}
                aspectRatio="16:10"
                fallbackLabel={site.name}
                className="mb-3 rounded-lg"
                objectPosition="center 25%"
              />

              <h3 className="font-heading text-lg font-semibold">{site.name}</h3>
              <div className="mt-1">
                <StarRating score={site.overall_score} size={13} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{site.short_description}</p>
              <p className="mt-2 text-[10px] text-muted-foreground/70">
                Updated {currentMonthShort} {currentYear}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to={`/reviews/${site.slug}`}
                  className="text-sm text-secondary hover:underline underline-offset-4 font-medium"
                >
                  Read review →
                </Link>
                {isAffiliated(site) && (
                  <OutboundLink
                    site={site}
                    ctaPosition="card"
                    className="ml-auto cta-btn gold-gradient inline-flex items-center rounded-button px-4 py-2 text-xs font-semibold text-secondary-foreground min-h-[40px] sm:min-h-[36px]"
                  >
                    Visit
                  </OutboundLink>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/reviews" className="text-sm text-secondary hover:underline underline-offset-4 font-medium">
            All reviews →
          </Link>
        </div>
      </div>
    </section>
  );
};

const UtilityRow = () => (
  <section className="border-t border-border/40 py-12">
    <div className="container max-w-3xl">
      <p className="text-sm text-muted-foreground">Not sure what you want?</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          to="/ask-ai"
          className="inline-flex items-center gap-2 rounded-button gold-gradient px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
        >
          Ask TwinkAI
        </Link>
        <Link
          to="/find-my-site"
          className="inline-flex items-center gap-2 rounded-button border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          Take the 30-second quiz
        </Link>
      </div>
    </div>
  </section>
);

const ManfinderRow = () => (
  <section className="border-t border-border/40 py-8">
    <div className="container max-w-3xl">
      <p className="text-sm text-muted-foreground">
        Looking for connections instead of content?{" "}
        <a
          href={MANFINDER_URL}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => trackManfinderClick("/")}
          className="text-secondary hover:underline underline-offset-4 font-medium"
        >
          Try Manfinder →
        </a>
      </p>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const Index = () => {
  // Defensive: scroll to top on mount. Some prior link patterns scrolled to
  // the old "Today's Top Pick" anchor and the new editorial flow shouldn't
  // start mid-page.
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>{`Independent gay porn site reviews — TwinkVault`}</title>
        <meta
          name="description"
          content={`Independent reviews of ${sites.length} gay porn sites. Every review built from a paid membership, scored on the same four-pillar rubric, updated monthly.`}
        />
        <link rel="canonical" href="https://twinkvault.com" />
        <meta property="og:image" content="https://twinkvault.com/site-banners/twinks-in-shorts-hero.jpg" />
      </Helmet>

      {/* JSON-LD in body (Helmet drops <script> server-side). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "TwinkVault",
        "url": "https://twinkvault.com",
        "description": "Independent rankings and reviews of gay porn sites.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": { "@type": "EntryPoint", "urlTemplate": "https://twinkvault.com/reviews?q={search_term_string}" },
          "query-input": "required name=search_term_string",
        },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Best Gay Twink Sites ${new Date().getFullYear()}`,
        "description": "The top-ranked twink sites, scored from paid memberships on content, value, updates, and mobile.",
        "itemListOrder": "https://schema.org/ItemListOrderDescending",
        "numberOfItems": 10,
        "itemListElement": [...sites]
          .filter((x) => x.editorial_status !== "editorial-only" && x.editorial_status !== "pending-review")
          .sort((a, b) => b.overall_score - a.overall_score)
          .slice(0, 10)
          .map((x, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": x.name,
            "url": `https://twinkvault.com/reviews/${x.slug}`,
          })),
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "TwinkVault",
        "url": "https://twinkvault.com",
        "logo": "https://twinkvault.com/pwa-512.png",
        "foundingDate": "2024",
        "description": "Independent gay site review project: paid memberships, transparent scoring, no commission-rigged rankings.",
        "sameAs": [],
      }) }} />

      <PageTransition>
        <Hero />
        {/* Browse by niche → full 9-tile grid, first visual content
            after the hero. The standalone Editor's Pick section is
            removed — it now lives inside the Top 10 sidecar (desktop)
            or above the Top 10 list (mobile/tablet). */}
        <FeaturedNiches />
        <TopTen />
        {/* Data-driven depth for the head term: unique stats + comparison
            table of the ranked commercial set (same proven block as niche
            pages). The #1 "best twink sites" SERP rewards ranking pages with
            real comparative substance — the homepage was 784 words. */}
        <LandingDataBlock
          sites={[...sites]
            .filter((x) => x.editorial_status !== "editorial-only" && x.editorial_status !== "pending-review")
            .sort((a, b) => b.overall_score - a.overall_score)
            .slice(0, 10)}
          label="top-ranked twink"
        />
        <FeaturedDealBanner placement="homepage" />
        <LatestReviews />
        <UtilityRow />
        <ManfinderRow />
        <InlineEmailCapture />
      </PageTransition>
    </Layout>
  );
};

export default Index;
