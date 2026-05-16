import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import OutboundLink from "../components/OutboundLink";
import InlineEmailCapture from "../components/InlineEmailCapture";
import SitePlaceholderImage from "../components/SitePlaceholderImage";
import StarRating from "../components/StarRating";
import LocalisedPrice from "../components/LocalisedPrice";
import { sites, isAffiliated, getTopDealPick, getRecentlyUpdatedPromotable } from "../data/sites";
import type { SiteData } from "../data/sites";
import { getSiteImagery } from "../data/site-imagery";
import { currentYear, currentMonthLong, currentMonthShort } from "../lib/dates";
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
  "NakedSword is the closest thing this category has to a default. The library is the largest I've personally subscribed to — 50,000+ scenes spanning Falcon, Hot House, Raging Stallion, and NakedSword Originals — and new scenes land daily. At $9.99/mo annual with the current 67% off, it undercuts Sean Cody's $7.49 and Men.com's $8.33 on per-scene math by a wider margin than either's headline discount suggests. If you only subscribe to one site, this is the one.";

// EDITOR_NOTE: niche intros + site counts hand-curated. Verify against
// siteNicheMap once a month and rewrite copy when counts shift materially.
const FEATURED_NICHES: { slug: string; name: string; siteCount: string; intro: string; image: string }[] = [
  {
    slug: "twink",
    name: "Twink",
    siteCount: "41 sites",
    intro: "The core of TwinkVault — premium studios down to amateur networks.",
    image: "/site-banners/twinks-in-shorts-hero.jpg",
  },
  {
    slug: "bareback",
    name: "Bareback",
    siteCount: "47 sites",
    intro: "The largest category here, all explicitly bareback-focused.",
    image: "/site-banners/bareback-that-hole-hero.jpg",
  },
  {
    slug: "amateur",
    name: "Amateur",
    siteCount: "40 sites",
    intro: "Real performers, no studio polish. Casting feels found, not cast.",
    image: "/site-banners/southern-strokes-hero.jpg",
  },
];

const OTHER_NICHES = [
  { slug: "daddy", name: "Daddy" },
  { slug: "bear", name: "Bear" },
  { slug: "asian", name: "Asian" },
  { slug: "college", name: "College" },
  { slug: "muscle", name: "Muscle" },
  { slug: "jock", name: "Jock" },
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
  <section className="py-10 md:py-12">
    {/* Compressed masthead, not magazine cover. Container widened to
        max-w-5xl + headline scale reduced (text-4xl ≈ 36px at lg) so
        "Independent reviews of 62 gay porn sites." fits on ONE line at
        desktop (≥1280px). Total hero height ≈ 220-260px, leaving room
        for the niche grid to enter the first viewport. */}
    <div className="container max-w-5xl">
      <motion.h1
        className="font-heading font-bold heading-gradient inline-block text-2xl leading-tight md:text-3xl lg:text-4xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Independent reviews of {sites.length} gay porn sites.
      </motion.h1>
      <motion.p
        className="mt-3 text-sm text-muted-foreground leading-snug md:text-base"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Every review is built from a paid membership and scored on the same four-pillar rubric. Updated monthly. No paid placements, ever.
      </motion.p>
      <motion.div
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Link
          to="/methodology"
          className="text-secondary hover:underline underline-offset-4 font-medium"
        >
          See how we score →
        </Link>
        <Link
          to="/reviews"
          className="text-secondary hover:underline underline-offset-4 font-medium"
        >
          Browse all {sites.length} sites →
        </Link>
      </motion.div>
    </div>
  </section>
);

const EditorsPick = () => {
  const pick = getTopDealPick();
  if (!pick) return null;
  const note = pick.slug === EDITOR_PICK_NOTE_SLUG ? EDITOR_PICK_NOTE : pick.short_description;
  return (
    <section className="border-t border-border/40 py-10 md:py-14">
      <div className="container max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">
          {currentMonthLong} {currentYear} — Editor's Pick
        </p>
        <motion.div
          className="mt-3 flex items-baseline gap-3 flex-wrap"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold">{pick.name}</h2>
          <span className="rounded-button bg-muted/60 px-2.5 py-0.5 text-sm font-semibold text-secondary tabular-nums">
            {pick.overall_score}/5
          </span>
        </motion.div>
        <p className="mt-5 text-base text-foreground/85 leading-relaxed">{note}</p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
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
              className="cta-btn gold-gradient inline-flex items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground"
            >
              Visit {pick.name} →
            </OutboundLink>
          )}
        </div>
      </div>
    </section>
  );
};

const TopTen = () => {
  const top10 = [...sites].sort((a, b) => b.overall_score - a.overall_score).slice(0, 10);
  return (
    <section className="border-t border-border/40 py-16 md:py-20">
      <div className="container max-w-3xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold">The Top 10</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ranked by overall score, updated monthly.</p>

        <ul className="mt-8 divide-y divide-border/60 border-y border-border/60">
          {top10.map((site, i) => {
            const heroImg = getSiteImagery(site.slug).hero_image_url;
            return (
            <li
              key={site.slug}
              className="flex items-center gap-3 sm:gap-4 py-3.5 transition-transform hover:-translate-y-px"
            >
              <span className="font-mono text-xs text-muted-foreground tabular-nums w-6 sm:w-7 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              {/* Small square thumbnail — image when available, brand-letter
                  fallback otherwise. Subtle, list-density (not card-density). */}
              {heroImg ? (
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded overflow-hidden bg-muted/40 shrink-0">
                  <img
                    src={heroImg}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "center 20%" }}
                  />
                </div>
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded bg-muted shrink-0 flex items-center justify-center font-heading text-sm font-bold text-foreground/40">
                  {site.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/reviews/${site.slug}`}
                  className="font-medium hover:text-secondary transition-colors truncate block"
                >
                  {site.name}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                  <span className="text-secondary font-semibold">{site.overall_score}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <LocalisedPrice usd={site.price_annual} />
                  <span className="hidden sm:inline text-muted-foreground/40">·</span>
                  <span className="hidden sm:inline">{categoryTag(site)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/reviews/${site.slug}`}
                  className="hidden sm:inline-flex items-center rounded-button border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  Read
                </Link>
                {isAffiliated(site) ? (
                  <OutboundLink
                    site={site}
                    ctaPosition="top-10-row"
                    sourceTypeOverride="homepage_top_10"
                    className="cta-btn gold-gradient inline-flex items-center rounded-button px-3.5 py-1 text-xs font-semibold text-secondary-foreground"
                  >
                    Visit
                  </OutboundLink>
                ) : (
                  <Link
                    to={`/reviews/${site.slug}`}
                    className="sm:hidden inline-flex items-center rounded-button border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
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
    </section>
  );
};

const FeaturedNiches = () => (
  // Tight top padding so the niche cards land in the first viewport
  // immediately after the compressed hero — image-led content as the
  // second section per the rebalance spec.
  <section className="py-8 md:py-10">
    <div className="container max-w-5xl">
      <h2 className="font-heading text-2xl md:text-3xl font-bold">Browse by niche</h2>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {FEATURED_NICHES.map((n) => (
          <Link
            key={n.slug}
            to={`/niche/${n.slug}`}
            className="group relative block overflow-hidden rounded-lg border border-border/60 transition-colors hover:border-primary/40"
            style={{ aspectRatio: "4 / 3" }}
          >
            <div
              className="pointer-events-none absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
              style={{
                backgroundImage: `url(${n.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
            <div className="relative flex h-full flex-col justify-end p-5">
              <p className="text-[11px] uppercase tracking-wider text-white/75">{n.siteCount}</p>
              <h3 className="mt-1 font-heading text-2xl font-bold text-white drop-shadow">{n.name}</h3>
              <p className="mt-2 text-sm text-white/85 leading-snug">{n.intro}</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        More:{" "}
        {OTHER_NICHES.map((n, i) => (
          <span key={n.slug}>
            <Link
              to={`/niche/${n.slug}`}
              className="text-secondary hover:underline underline-offset-4"
            >
              {n.name}
            </Link>
            {i < OTHER_NICHES.length - 1 && (
              <span className="mx-2 text-muted-foreground/40">·</span>
            )}
          </span>
        ))}
      </p>
    </div>
  </section>
);

const LatestReviews = () => {
  const latest = getRecentlyUpdatedPromotable(3);
  if (latest.length === 0) return null;
  return (
    <section className="border-t border-border/40 py-16 md:py-20">
      <div className="container max-w-5xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold">Latest reviews</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {latest.map((site) => (
            <motion.div
              key={site.slug}
              className="glass-card rounded-lg p-5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <SitePlaceholderImage site={site} className="mb-3" />
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
                    className="ml-auto cta-btn gold-gradient inline-flex items-center rounded-button px-3 py-1 text-xs font-semibold text-secondary-foreground"
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
        <script type="application/ld+json">{JSON.stringify({
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
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "TwinkVault",
          "url": "https://twinkvault.com",
          "logo": "https://twinkvault.com/pwa-512.png",
          "foundingDate": "2024",
          "description": "Independent gay site review project — paid memberships, transparent scoring, no commission-rigged rankings.",
          "sameAs": [],
        })}</script>
      </Helmet>

      <PageTransition>
        <Hero />
        {/* Browse by niche promoted to the second section — image-led
            cover cards become the first visual content immediately
            after the compressed hero. Editorial credibility (Editor's
            Pick + methodology link in hero) still loads first; the
            visual product surface follows without scrolling far. */}
        <FeaturedNiches />
        <EditorsPick />
        <TopTen />
        <LatestReviews />
        <UtilityRow />
        <ManfinderRow />
        <InlineEmailCapture />
      </PageTransition>
    </Layout>
  );
};

export default Index;
