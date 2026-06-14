import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import OutboundLink from "../components/OutboundLink";
import { ArrowRight, Check, X as XIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import Layout from "../components/Layout";
import ScoreRing from "../components/ScoreRing";
import StarRating from "../components/StarRating";
import { getSiteBySlug, sites, SiteData, getVisitUrl, isAffiliated } from "../data/sites";
import { getComparisonBody } from "../data/comparison-content";
import { isFeaturedComparePair } from "../data/featured-compare-pairs";
import StickyMobileCTA from "../components/StickyMobileCTA";
import { displayPillarScore } from "../lib/scoreFormatting";
import { generateCompareFaqs } from "../lib/compareFaqs";
import RelatedReading from "../components/RelatedReading";
import { PageTransition } from "../components/MotionWrappers";
import FeaturedDealBanner from "../components/common/FeaturedDealBanner";
import { currentYear } from "../lib/dates";
import { siteNicheMap } from "@/data/site-niches";
import { getNiche } from "@/data/niches";
import { stripMonthlyUnit } from "@/lib/dealMath";
import Breadcrumbs from "../components/Breadcrumbs";
import { comparisonPairs } from "@/data/comparisons";
import { trackEvent } from "@/lib/analytics";
import LocalisedPrice from "../components/LocalisedPrice";

const scoreColor = (val: number, max: number) => {
  const ratio = val / max;
  if (ratio >= 0.85) return "text-emerald-400";
  if (ratio >= 0.7) return "text-secondary";
  return "text-destructive";
};

const CompareColumn = ({ site }: { site: SiteData }) => (
  <div className="glass-card rounded-lg p-6 flex-1">
    <div className="flex justify-center">
      <ScoreRing score={site.overall_score} size={80} />
    </div>
    <h2 className="mt-4 text-center font-heading text-xl font-bold">{site.name}</h2>
    <div className="mt-2 flex justify-center">
      <StarRating score={site.overall_score} size={14} />
    </div>
    <p className="mt-3 text-center text-lg font-semibold"><LocalisedPrice usd={site.price_monthly} /></p>
    <div className="mt-4 space-y-1.5">
      {site.pros.map((p) => (
        <div key={p} className="flex items-start gap-2 text-sm">
          <Check size={12} className="mt-0.5 shrink-0 text-emerald-400" />
          <span className="text-muted-foreground text-xs">{p}</span>
        </div>
      ))}
      {site.cons.map((c) => (
        <div key={c} className="flex items-start gap-2 text-sm">
          <XIcon size={12} className="mt-0.5 shrink-0 text-muted-foreground/50" />
          <span className="text-muted-foreground/70 text-xs">{c}</span>
        </div>
      ))}
    </div>
    {/* Affiliated → Visit Site (live affiliate). Unaffiliated → Read Full
        Review (no affiliate URL exists, but readers still deserve a path
        forward; the previous OutboundLink-only render produced nothing
        at all for unaffiliated sites, including high-scored ones like
        Next Door Twink and Helix Studios). */}
    {isAffiliated(site) ? (
      <>
        <OutboundLink
          site={site}
          ctaPosition="compare-card"
          sourceTypeOverride="compare"
          className="cta-btn mt-4 flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
        >
          Visit Site <ArrowRight size={14} />
        </OutboundLink>
        <p className="mt-1 text-center text-[9px] text-muted-foreground">Opens in new tab · Partner link</p>
      </>
    ) : (
      <Link
        to={`/reviews/${site.slug}`}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-button border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        Read Full Review <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const criteria = [
  { label: "Content Quality", key: "content_quality" as const, max: 100 },
  { label: "Value for Money", key: "value_score" as const, max: 100 },
  { label: "Update Frequency", key: "update_frequency" as const, max: 100 },
  { label: "Mobile Experience", key: "mobile_score" as const, max: 100 },
  { label: "Overall Score", key: "overall_score" as const, max: 5 },
];

// ───────────────────────────────────────────────────────────────────────────
// Multi-site comparison builder (route: /compare)
// ───────────────────────────────────────────────────────────────────────────
const CompareIndex = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSlugs = (searchParams.get("sites") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => Boolean(getSiteBySlug(s)))
    .slice(0, 4);

  const [selected, setSelected] = useState<string[]>(initialSlugs);
  const [filter, setFilter] = useState("");
  const [savedFeedback, setSavedFeedback] = useState("");

  const selectedSites = useMemo(
    () => selected.map((s) => getSiteBySlug(s)).filter((s): s is SiteData => Boolean(s)),
    [selected]
  );

  const visibleSites = useMemo(() => {
    if (!filter) return sites.slice(0, 18);
    const f = filter.toLowerCase();
    return sites.filter((s) => s.name.toLowerCase().includes(f) || s.slug.includes(f)).slice(0, 18);
  }, [filter]);

  const toggleSite = (slug: string) => {
    setSelected((cur) => {
      if (cur.includes(slug)) {
        const next = cur.filter((s) => s !== slug);
        setSearchParams(next.length ? { sites: next.join(",") } : {});
        return next;
      }
      if (cur.length >= 4) return cur;
      const next = [...cur, slug];
      setSearchParams({ sites: next.join(",") });
      return next;
    });
  };

  const clearAll = () => {
    setSelected([]);
    setSearchParams({});
  };

  const goToTwoWay = () => {
    if (selected.length === 2) {
      navigate(`/compare/${selected[0]}-vs-${selected[1]}`);
    }
  };

  const nicheFilter = searchParams.get("niche");

  const featuredPairs = useMemo(() => {
    // If ?niche=X is present, surface comparison pairs from src/data/comparisons.ts
    // that share that niche — so "More {niche} comparisons →" lands on a real list.
    if (nicheFilter) {
      const matched = comparisonPairs.filter((p) => p.primaryNiche === nicheFilter);
      const expanded = matched
        .map((p) => {
          const a = getSiteBySlug(p.siteA);
          const b = getSiteBySlug(p.siteB);
          return a && b ? { a, b } : null;
        })
        .filter((x): x is { a: SiteData; b: SiteData } => x !== null);
      if (expanded.length) return expanded.slice(0, 18);
    }
    // Default: top-8 site cross-product
    return sites
      .slice(0, 8)
      .flatMap((a, i) =>
        sites.slice(i + 1, 8).map((b) => ({ a, b }))
      )
      .slice(0, 12);
  }, [nicheFilter]);

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>Compare Twink Sites — Side by Side | TwinkVault</title>
          <meta name="description" content="Compare 2-4 gay twink sites side by side. See scores, prices, niches, and features at a glance. Build your own comparison." />
          <link rel="canonical" href="https://twinkvault.com/compare" />
        </Helmet>

        <section className="py-12">
          <div className="container max-w-5xl">
            <Breadcrumbs
              className="mb-6"
              items={[{ label: "Home", to: "/" }, { label: "Compare" }]}
            />
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
              Compare gay porn sites side by side
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Same rubric, same scoring, just two sites at a time. Pick 2–4 below to build your own comparison, or jump to one of the most-asked head-to-heads.
            </p>
            <p className="mt-3 text-sm text-muted-foreground/80 max-w-2xl">
              Most comparisons here exist because they're the questions readers actually ask. Each comparison page shows both sites against the same four pillars and ends with a recommendation for who should pick which.
            </p>
          </div>
        </section>

        {/* Builder */}
        <section className="py-10 border-t border-border">
          <div className="container max-w-5xl">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-heading text-xl font-bold">
                  Selected: {selected.length}/4
                </h2>
                {selected.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Pick {selected.length < 2 ? `${2 - selected.length} more` : "more"} or compare now.
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {selected.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs px-3 py-1.5 rounded-button border border-border text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Clear
                  </button>
                )}
                {selected.length >= 2 && (
                  <button
                    onClick={() => {
                      try {
                        const stored = JSON.parse(localStorage.getItem("tv_saved_comparisons") || "[]");
                        const next = [
                          { slugs: selected, savedAt: new Date().toISOString() },
                          ...stored.filter((c: { slugs: string[] }) => c.slugs.join(",") !== selected.join(",")),
                        ].slice(0, 10);
                        localStorage.setItem("tv_saved_comparisons", JSON.stringify(next));
                        setSavedFeedback("✓ Saved");
                        setTimeout(() => setSavedFeedback(""), 1800);
                      } catch {
                        setSavedFeedback("Save failed");
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded-button border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {savedFeedback || "Save this comparison"}
                  </button>
                )}
                {selected.length === 2 && (
                  <button
                    onClick={goToTwoWay}
                    className="text-xs px-3 py-1.5 rounded-button gold-gradient text-secondary-foreground font-semibold"
                  >
                    Open Detailed Page →
                  </button>
                )}
              </div>
            </div>

            {/* Selected chips */}
            {selectedSites.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedSites.map((s) => (
                  <span
                    key={s.slug}
                    className="inline-flex items-center gap-2 rounded-button bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary"
                  >
                    {s.name}
                    <button
                      onClick={() => toggleSite(s.slug)}
                      className="hover:text-foreground"
                      aria-label={`Remove ${s.name}`}
                    >
                      <XIcon size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Picker */}
            <div className="mt-6 glass-card rounded-lg p-5">
              <input
                type="search"
                inputMode="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search sites by name…"
                className="w-full rounded-button bg-muted/30 border border-border px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:border-primary/50"
              />
              <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {visibleSites.map((s) => {
                  const isSelected = selected.includes(s.slug);
                  const atLimit = !isSelected && selected.length >= 4;
                  return (
                    <button
                      key={s.slug}
                      onClick={() => toggleSite(s.slug)}
                      disabled={atLimit}
                      className={`flex items-center justify-between gap-2 rounded-button px-3 py-2 text-sm text-left transition-colors ${
                        isSelected
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : atLimit
                          ? "bg-muted/20 text-muted-foreground/40 cursor-not-allowed border border-border/30"
                          : "bg-muted/30 hover:bg-muted/60 border border-border/40"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{s.overall_score}/5</span>
                    </button>
                  );
                })}
              </div>
              {!filter && sites.length > 18 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Showing top 18. Use search to find more of our {sites.length} reviewed sites.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        {selectedSites.length >= 2 && (
          <section className="py-10 border-t border-border">
            <div className="container max-w-6xl">
              <div className="glass-card rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-muted-foreground sticky left-0 bg-card">Criteria</th>
                      {selectedSites.map((s) => (
                        <th key={s.slug} className="px-4 py-3 text-center font-bold">
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/30">
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground">Score</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 text-center">
                          <div className="inline-flex"><ScoreRing score={s.overall_score} size={48} /></div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground">Monthly</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 text-center font-semibold"><LocalisedPrice usd={s.price_monthly} /></td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground">Annual (per mo)</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 text-center font-semibold"><LocalisedPrice usd={s.price_annual} /></td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground">Discount</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 text-center">
                          {s.deal_discount > 0 ? <span className="text-emerald-400 font-semibold">{s.deal_discount}% off</span> : <span className="text-muted-foreground/50">—</span>}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground">Free trial</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 text-center">
                          {s.has_free_trial ? <Check size={16} className="inline text-emerald-400" /> : <XIcon size={16} className="inline text-muted-foreground/30" />}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground">Niches</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 text-center text-xs text-muted-foreground">
                          {(siteNicheMap[s.slug] ?? []).slice(0, 3).map((n) => getNiche(n)?.displayName).filter(Boolean).join(", ") || "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground align-top">Top pros</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 align-top">
                          <ul className="space-y-1">
                            {s.pros.slice(0, 3).map((p) => (
                              <li key={p} className="flex items-start gap-1 text-xs text-muted-foreground">
                                <Check size={11} className="mt-0.5 shrink-0 text-emerald-400" /> {p}
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground align-top">Cons</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 align-top">
                          <ul className="space-y-1">
                            {s.cons.slice(0, 2).map((c) => (
                              <li key={c} className="flex items-start gap-1 text-xs text-muted-foreground">
                                <XIcon size={11} className="mt-0.5 shrink-0 text-muted-foreground/60" /> {c}
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 sticky left-0 bg-card text-muted-foreground">Verdict</td>
                      {selectedSites.map((s) => (
                        <td key={s.slug} className="px-4 py-3 text-center">
                          {isAffiliated(s) ? (
                            <OutboundLink
                              site={s}
                              ctaPosition="compare-card"
                              sourceTypeOverride="compare"
                              className="cta-btn inline-flex items-center justify-center gap-2 rounded-button gold-gradient px-4 py-2 text-xs font-semibold text-secondary-foreground"
                            >
                              Visit Site <ArrowRight size={12} />
                            </OutboundLink>
                          ) : (
                            <Link
                              to={`/reviews/${s.slug}`}
                              className="inline-flex items-center justify-center gap-2 rounded-button border border-primary px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                            >
                              Read Review <ArrowRight size={12} />
                            </Link>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <FeaturedDealBanner placement="compare" />

        {/* Featured pairs */}
        <section className="py-12 border-t border-border">
          <div className="container max-w-5xl">
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
              {nicheFilter ? `${nicheFilter.charAt(0).toUpperCase()}${nicheFilter.slice(1)} Comparisons` : "Popular Comparisons"}
            </h2>
            {nicheFilter && (
              <Link
                to="/compare"
                className="ml-3 text-xs text-muted-foreground hover:text-primary align-middle"
              >
                Clear niche filter ×
              </Link>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPairs.map(({ a, b }) => (
                <Link
                  key={`${a.slug}-${b.slug}`}
                  to={`/compare/${a.slug}-vs-${b.slug}`}
                  className="glass-card rounded-lg p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{a.name}</span>
                    <span className="text-xs font-bold text-primary mx-2">VS</span>
                    <span className="font-semibold truncate">{b.name}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{a.overall_score}/5</span>
                    <span>{b.overall_score}/5</span>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-10 text-xs text-muted-foreground">
              Don't see a comparison you want?{" "}
              <Link to="/reviews" className="text-secondary hover:underline underline-offset-4">
                Browse all reviews →
              </Link>{" "}
              and pick two to build your own.
            </p>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

const ComparePage = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !slug.includes("-vs-")) {
    return <CompareIndex />;
  }

  // Try every "-vs-" position until both slugs resolve to real sites
  let siteA: ReturnType<typeof getSiteBySlug> = undefined;
  let siteB: ReturnType<typeof getSiteBySlug> = undefined;
  let searchFrom = 0;
  while (searchFrom < slug.length) {
    const vsIdx = slug.indexOf("-vs-", searchFrom);
    if (vsIdx < 1) break;
    const a = getSiteBySlug(slug.substring(0, vsIdx));
    const b = getSiteBySlug(slug.substring(vsIdx + 4));
    if (a && b) { siteA = a; siteB = b; break; }
    searchFrom = vsIdx + 1;
  }

  if (!siteA || !siteB) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="font-heading text-2xl font-bold">Comparison not found</h1>
          <Link to="/compare" className="mt-4 inline-block text-secondary">View all comparisons →</Link>
        </div>
      </Layout>
    );
  }

  // Verdict logic. Three signals get composed:
  //   1. Score parity: tied → use neutral "TOP PICK" labels and "evenly matched" BLUF
  //   2. AI preference: when AI body exists, count site-name mentions in the
  //      verdict + who_should_choose fields. A clear lead overrides the
  //      score-based winner (resolves the contradiction where the AI body
  //      recommended Sean Cody but the cards declared Men.com the winner).
  //   3. Score-based fallback: higher overall_score wins; tiebreaker = siteA.
  const aiBody = getComparisonBody(slug);
  const tied = siteA.overall_score === siteB.overall_score;
  const aiPreferred: SiteData | null = (() => {
    if (!aiBody) return null;
    const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Recommendation-phrase detection. Raw mention counts are unreliable
    // because both sites get described positively in `who_should_choose_a/b`.
    // Instead, split the verdict into sentences and find ones that contain
    // explicit recommendation phrases ("X is the safer pick", "X is the
    // more satisfying spend", etc.). Whichever site is named exclusively
    // in those sentences wins — falls through to score-based otherwise.
    const RECO_RE = /\bis the (?:safer|better|smarter|stronger|cleaner|wiser|more (?:recommended|trustworthy|satisfying|consistent|reliable|valuable|sensible))\b/i;
    const sentences = `${aiBody.verdict} ${aiBody.who_should_choose_a} ${aiBody.who_should_choose_b}`
      .split(/(?<=[.!?])\s+/);
    const aRe = new RegExp(escapeRe(siteA.name), "i");
    const bRe = new RegExp(escapeRe(siteB.name), "i");
    let aHits = 0;
    let bHits = 0;
    for (const s of sentences) {
      if (!RECO_RE.test(s)) continue;
      const inA = aRe.test(s);
      const inB = bRe.test(s);
      if (inA && !inB) aHits++;
      else if (inB && !inA) bHits++;
    }
    if (aHits > bHits) return siteA;
    if (bHits > aHits) return siteB;
    return null;
  })();
  const winner = aiPreferred ?? (siteA.overall_score >= siteB.overall_score ? siteA : siteB);
  const runnerUp = winner.id === siteA.id ? siteB : siteA;
  const budgetPick = parseFloat(siteA.price_annual.replace(/[^0-9.]/g, "")) <= parseFloat(siteB.price_annual.replace(/[^0-9.]/g, "")) ? siteA : siteB;

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>{`${siteA.name} vs ${siteB.name} — Which Is Worth It? (${currentYear}) | TwinkVault`}</title>
          <meta name="description" content={`Compare ${siteA.name} vs ${siteB.name} side by side. Scores, pricing, pros and cons to help you decide.`} />
          <link rel="canonical" href={`https://twinkvault.com/compare/${slug}`} />
          <meta property="og:title" content={`${siteA.name} vs ${siteB.name} — TwinkVault`} />
          <meta property="og:description" content={`Compare ${siteA.name} vs ${siteB.name} side by side. Scores, pricing, pros and cons to help you decide.`} />
          <meta property="og:url" content={`https://twinkvault.com/compare/${slug}`} />
          {/* Robots: featured pairs get full indexing; non-featured pairs are
              noindex'd to prevent near-duplicate flagging across the 1,891-
              pair combinatorial space. follow stays on so the internal
              links to review/discount pages still pass equity. */}
          <meta
            name="robots"
            content={isFeaturedComparePair(slug) ? "index, follow" : "noindex, follow"}
          />
        </Helmet>

        {/* JSON-LD schemas — emitted in the body (not inside Helmet) so they
            land in the prerendered HTML where crawlers can read them.
            Only featured pairs get schema; non-featured pairs are noindex'd. */}
        {isFeaturedComparePair(slug) && (() => {
          const parseMo = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
          const today = new Date().toISOString().split("T")[0];

          // Build the Product's aggregateRating + offers ONCE per site and
          // share them between the standalone Product schema and the Review
          // schema's nested itemReviewed. Google validates the nested Product
          // against the same Product spec — without these fields the nested
          // Product fails the same "must include offers/review/aggregateRating"
          // check that triggered the GSC warning. Sharing eliminates drift
          // between the two emissions.
          const aggregateRatingFor = (s: typeof siteA) => s.overall_score > 0 ? {
            "@type": "AggregateRating",
            ratingValue: s.overall_score,
            bestRating: 5,
            worstRating: 1,
            reviewCount: 1,
            ratingCount: 1,
          } : null;
          const offersFor = (s: typeof siteA) => parseMo(s.price_annual) > 0 ? {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: parseMo(s.price_annual).toFixed(2),
            highPrice: parseMo(s.price_monthly).toFixed(2),
            offerCount: 2,
            availability: "https://schema.org/InStock",
          } : null;

          // Skip Product emission entirely for pending-review sites (TLA Gay
          // Unlimited, VisionX Flix). They have no real score yet so any
          // Product object would be incomplete — better to omit than ship
          // schema Google will reject.
          const productSchema = (s: typeof siteA) => {
            if (s.editorial_status === "pending-review") return null;
            const ar = aggregateRatingFor(s);
            const of = offersFor(s);
            // A Product without offers/review/aggregateRating violates
            // Google's spec. If a regular site somehow has no score AND no
            // parseable price (shouldn't happen, but defensively), skip it.
            if (!ar && !of) return null;
            return {
              "@context": "https://schema.org",
              "@type": "Product",
              "@id": `https://twinkvault.com/reviews/${s.slug}#product`,
              name: s.name,
              description: s.short_description,
              brand: { "@type": "Brand", name: s.name },
              url: `https://twinkvault.com/reviews/${s.slug}`,
              ...(ar ? { aggregateRating: ar } : {}),
              ...(of ? { offers: of } : {}),
            };
          };

          // Review.itemReviewed must itself be a complete Product (Google
          // validates it independently). Inline the same aggregateRating
          // + offers so the nested Product passes the same spec — fixes the
          // GSC "Product must include offers/review/aggregateRating" issue.
          const reviewSchema = (s: typeof siteA) => {
            if (s.editorial_status === "pending-review" || s.overall_score === 0) return null;
            const ar = aggregateRatingFor(s);
            const of = offersFor(s);
            if (!ar && !of) return null;
            return {
              "@context": "https://schema.org",
              "@type": "Review",
              itemReviewed: {
                "@type": "Product",
                "@id": `https://twinkvault.com/reviews/${s.slug}#product`,
                name: s.name,
                url: `https://twinkvault.com/reviews/${s.slug}`,
                ...(ar ? { aggregateRating: ar } : {}),
                ...(of ? { offers: of } : {}),
              },
              reviewRating: { "@type": "Rating", ratingValue: s.overall_score, bestRating: 5, worstRating: 1 },
              author: { "@type": "Organization", name: "TwinkVault" },
              datePublished: `${currentYear}-01-01`,
              dateModified: today,
              url: `https://twinkvault.com/compare/${slug}`,
            };
          };

          const breadcrumb = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
              { "@type": "ListItem", position: 2, name: "Compare", item: "https://twinkvault.com/compare" },
              { "@type": "ListItem", position: 3, name: `${siteA.name} vs ${siteB.name}`, item: `https://twinkvault.com/compare/${slug}` },
            ],
          };
          const itemList = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${siteA.name} vs ${siteB.name}`,
            description: `Side-by-side comparison of ${siteA.name} and ${siteB.name}.`,
            numberOfItems: 2,
            itemListElement: [
              { "@type": "ListItem", position: 1, name: siteA.name, url: `https://twinkvault.com/reviews/${siteA.slug}` },
              { "@type": "ListItem", position: 2, name: siteB.name, url: `https://twinkvault.com/reviews/${siteB.slug}` },
            ],
          };
          const faqPage = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: generateCompareFaqs(siteA, siteB).map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          };

          return (
            <>
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
              {productSchema(siteA) && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema(siteA)) }} />
              )}
              {productSchema(siteB) && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema(siteB)) }} />
              )}
              {reviewSchema(siteA) && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema(siteA)) }} />
              )}
              {reviewSchema(siteB) && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema(siteB)) }} />
              )}
            </>
          );
        })()}
        <section className="py-16">
          <div className="container max-w-4xl">
            <Breadcrumbs
              className="mb-6"
              items={[
                { label: "Home", to: "/" },
                { label: "Compare", to: "/compare" },
                { label: `${siteA.name} vs ${siteB.name}` },
              ]}
            />
            <h1 className="text-center font-heading text-2xl font-bold md:text-4xl heading-gradient inline-block w-full">
              {siteA.name} vs {siteB.name}
            </h1>
            <p className="mt-2 text-center text-muted-foreground">
              Two sites scored on the same four pillars. Here's how they stack up.
            </p>

            {/* AI-generated body (head-to-head deep dive) — renders above the
                deterministic template when comparison-content.ts has an entry
                for this slug. Falls through to the template below otherwise. */}
            {(() => {
              const ai = getComparisonBody(slug);
              if (!ai) return null;
              return (
                <article className="mt-8 space-y-6 text-sm text-foreground/90 leading-relaxed">
                  <p className="text-base">{ai.intro}</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="glass-card rounded-lg p-5">
                      <h3 className="font-heading text-base font-bold">{siteA.name} — Strengths</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{ai.site_a_summary}</p>
                    </div>
                    <div className="glass-card rounded-lg p-5">
                      <h3 className="font-heading text-base font-bold">{siteB.name} — Strengths</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{ai.site_b_summary}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {ai.comparison_categories.map((row) => (
                      <div key={row.category} className="glass-card rounded-lg p-5">
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="font-heading text-sm font-semibold">{row.category}</h4>
                          <span className="text-xs text-muted-foreground">
                            {siteA.name} {row.site_a_score}/10 · {siteB.name} {row.site_b_score}/10
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground"><strong className="text-foreground">{siteA.name}:</strong> {row.site_a_detail}</p>
                        <p className="mt-1 text-xs text-muted-foreground"><strong className="text-foreground">{siteB.name}:</strong> {row.site_b_detail}</p>
                      </div>
                    ))}
                  </div>
                  <div className="glass-card rounded-lg p-6 border-l-4 border-l-secondary">
                    <h3 className="font-heading text-lg font-bold">Verdict</h3>
                    <p className="mt-2 text-sm text-foreground/90">{ai.verdict}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 text-xs">
                      <p><strong className="text-foreground">Choose {siteA.name} if:</strong> {ai.who_should_choose_a}</p>
                      <p><strong className="text-foreground">Choose {siteB.name} if:</strong> {ai.who_should_choose_b}</p>
                    </div>
                  </div>
                </article>
              );
            })()}

            {/* BLUF Summary */}
            {/* TODO_VOICE: rewrite this paragraph in first-person methodology voice. Drop "Bottom Line Up Front" framing; the heading itself is enough. Cite specific differences (numbers, niches, networks), not score-as-prose. */}
            <div className="mt-8 glass-card rounded-lg p-6 border-l-4 border-l-secondary">
              <h2 className="font-heading text-lg font-bold text-secondary">Bottom Line Up Front</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {tied && !aiPreferred
                  ? `${siteA.name} and ${siteB.name} are evenly matched at ${siteA.overall_score}/5 — here's how to choose between them. ${budgetPick.name} at ${stripMonthlyUnit(budgetPick.price_annual)}/mo (annual) is the cheaper of the two if budget is the deciding factor.`
                  : (
                    <>
                      {winner.name} takes the overall {tied ? "edge" : "win"}{tied ? "" : ` with a ${winner.overall_score}/5 score`}, excelling in {winner.content_quality >= winner.value_score ? "content quality" : "value for money"}.
                      {budgetPick.id !== winner.id
                        ? ` However, ${budgetPick.name} at ${stripMonthlyUnit(budgetPick.price_annual)}/mo (annual) is the smarter pick if you're watching your budget.`
                        : ` It also happens to be the more affordable option at ${stripMonthlyUnit(winner.price_annual)}/mo on the annual plan.`}
                    </>
                  )}
              </p>
            </div>

            {/* Side by side cards */}
            <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-start">
              <CompareColumn site={siteA} />
              <div className="flex items-center justify-center md:mt-24">
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-full glass-card text-primary font-heading font-bold text-lg"
                  style={{ boxShadow: "0 0 20px hsl(263, 70%, 58%, 0.3)" }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  VS
                </motion.div>
              </div>
              <CompareColumn site={siteB} />
            </div>

            {/* Comparison table */}
            <div className="mt-12 glass-card rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">Criteria</th>
                    <th className="px-4 py-3 text-center font-semibold">{siteA.name}</th>
                    <th className="px-4 py-3 text-center font-semibold">{siteB.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((c) => {
                    // Pillar scores (max 100) smoothed to nearest 5 for display.
                    // Overall (max 5) keeps decimal precision.
                    const aDisplay = c.max === 100 ? displayPillarScore(siteA[c.key] as number) : siteA[c.key];
                    const bDisplay = c.max === 100 ? displayPillarScore(siteB[c.key] as number) : siteB[c.key];
                    return (
                      <tr key={c.key} className="border-b border-border/30">
                        <td className="px-4 py-3 text-muted-foreground">{c.label}</td>
                        <td className={`px-4 py-3 text-center font-semibold ${scoreColor(siteA[c.key], c.max)}`}>
                          {aDisplay}{c.max === 100 ? "/100" : "/5"}
                        </td>
                        <td className={`px-4 py-3 text-center font-semibold ${scoreColor(siteB[c.key], c.max)}`}>
                          {bDisplay}{c.max === 100 ? "/100" : "/5"}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3 text-muted-foreground">Price</td>
                    <td className="px-4 py-3 text-center font-semibold">{siteA.price_monthly}</td>
                    <td className="px-4 py-3 text-center font-semibold">{siteB.price_monthly}</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3 text-muted-foreground">Free Trial</td>
                    <td className="px-4 py-3 text-center">
                      {siteA.has_free_trial ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {siteB.has_free_trial ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground">HD Quality</td>
                    <td className="px-4 py-3 text-center">
                      {siteA.has_hd ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {siteB.has_hd ? <Check size={14} className="inline text-emerald-400" /> : <XIcon size={14} className="inline text-muted-foreground/30" />}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Verdict with CTAs */}
            <div className="mt-10 glass-card rounded-lg p-8">
              <h2 className="text-center font-heading text-2xl font-bold heading-gradient inline-block w-full">Our Verdict</h2>
              {(() => {
                // When scores are genuinely tied (and AI doesn't break the
                // tie), use neutral "TOP PICK" / "ALTERNATIVE PICK" labels
                // instead of declaring an arbitrary winner.
                const useNeutralLabels = tied && !aiPreferred;
                const primaryLabel = useNeutralLabels ? "TOP PICK" : "OVERALL WINNER";
                const secondaryIsBudget = budgetPick.id !== winner.id;
                const secondaryLabel = useNeutralLabels
                  ? "ALTERNATIVE PICK"
                  : secondaryIsBudget ? "💸 BUDGET PICK" : "💸 RUNNER-UP";
                const secondarySite = secondaryIsBudget ? budgetPick : runnerUp;
                const secondaryDesc = useNeutralLabels
                  ? "Equally strong on the scorecard — a different fit for different priorities."
                  : secondaryIsBudget
                    ? "Best if budget matters."
                    : "Solid alternative if winner doesn't fit.";
                return (
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div className="rounded-lg border-2 border-secondary/40 bg-secondary/5 p-5 flex flex-col">
                      <span className="rounded-button gold-gradient px-2.5 py-1 text-[10px] font-bold text-secondary-foreground self-start">
                        {primaryLabel}
                      </span>
                      <p className="mt-3 font-heading text-2xl font-bold">{winner.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground flex-1">
                        Best for {winner.content_quality >= winner.value_score ? "premium production value" : "overall quality"}.
                      </p>
                      <OutboundLink
                        site={winner}
                        onClick={() => trackEvent("verdict_click", { site: winner.slug, comparison: slug, role: "winner" })}
                        className={`cta-btn mt-4 inline-flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground ${!isAffiliated(winner) ? "opacity-85" : ""}`}
                      >
                        Visit {winner.name} <ArrowRight size={14} />
                      </OutboundLink>
                    </div>
                    <div className="rounded-lg border-2 border-primary/30 p-5 flex flex-col">
                      <span className="rounded-button bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary self-start">
                        {secondaryLabel}
                      </span>
                      <p className="mt-3 font-heading text-2xl font-bold">{secondarySite.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground flex-1">{secondaryDesc}</p>
                      <OutboundLink
                        site={secondarySite}
                        onClick={() => trackEvent("verdict_click", { site: secondarySite.slug, comparison: slug, role: "runner_up" })}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-button border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        Try {secondarySite.name} Instead <ArrowRight size={14} />
                      </OutboundLink>
                    </div>
                  </div>
                );
              })()}
            </div>

            <FeaturedDealBanner
              placement="compare"
              context={{ compareSlugs: [siteA.slug, siteB.slug] }}
            />

            {/* FAQ */}
            <div className="mt-10">
              <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">
                {siteA.name} vs {siteB.name} — FAQ
              </h2>
              <div className="mt-6 space-y-3">
                {generateCompareFaqs(siteA, siteB).map((item) => (
                  <details key={item.q} className="glass-card group rounded-lg p-4">
                    <summary className="cursor-pointer list-none font-semibold flex items-center justify-between text-sm">
                      {item.q}
                      <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Other comparisons in primary niche.
                Picks the strongest shared niche from a curated list of
                category-defining tags. Body-type tags like muscle/smooth/
                hairy/jock are excluded as section headings — they read as
                minor descriptors rather than primary site identities,
                which made "Other muscle comparisons" misleading on pairs
                like Men.com vs Sean Cody. Falls back to a generic
                "Similar comparisons" header when no strong shared niche
                exists. */}
            {(() => {
              const PRIMARY_NICHES = new Set([
                "twink", "bareback", "asian", "japanese", "latin",
                "bear", "daddy", "amateur", "college", "fetish",
                "interracial", "str8-curious", "group",
              ]);
              const aNiches = siteNicheMap[siteA.slug] ?? [];
              const bNiches = siteNicheMap[siteB.slug] ?? [];
              const allShared = aNiches.filter((n) => bNiches.includes(n));
              // Prefer category-defining niches over body-type tags. Among
              // those, pick the one with the lowest combined index (most
              // prominent in both sites' niche arrays).
              const primaryShared = allShared
                .filter((n) => PRIMARY_NICHES.has(n))
                .sort((a, b) => (aNiches.indexOf(a) + bNiches.indexOf(a)) - (aNiches.indexOf(b) + bNiches.indexOf(b)))[0];
              const sharedNiche = primaryShared ?? allShared[0];

              const otherSites = sharedNiche
                ? sites
                    .filter(
                      (s) =>
                        s.slug !== siteA.slug &&
                        s.slug !== siteB.slug &&
                        (siteNicheMap[s.slug] ?? []).includes(sharedNiche)
                    )
                    .sort((a, b) => b.overall_score - a.overall_score)
                    .slice(0, 3)
                : sites
                    .filter((s) => s.slug !== siteA.slug && s.slug !== siteB.slug)
                    .sort((a, b) => b.overall_score - a.overall_score)
                    .slice(0, 3);
              if (otherSites.length === 0) return null;

              const niche = primaryShared ? getNiche(primaryShared) : null;
              const heading = niche
                ? `Other ${niche.displayName.toLowerCase()} comparisons`
                : "Similar comparisons";
              return (
                <div className="mt-10">
                  <h3 className="font-heading text-lg font-bold">
                    {heading}
                  </h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {otherSites.map((s) => (
                      <Link
                        key={s.slug}
                        to={`/compare/${siteA.slug}-vs-${s.slug}`}
                        className="glass-card rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold truncate">{siteA.name}</span>
                          <span className="text-xs text-primary font-bold">VS</span>
                          <span className="font-semibold truncate">{s.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {niche && primaryShared && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <Link
                        to={`/compare?niche=${primaryShared}`}
                        className="text-primary hover:underline"
                      >
                        More {niche.displayName.toLowerCase()} comparisons →
                      </Link>
                      <span className="text-muted-foreground/40">·</span>
                      <Link
                        to={`/niche/${primaryShared}`}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        All {niche.displayName.toLowerCase()} sites →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-8 text-center">
              <Link to="/compare" className="text-sm text-secondary hover:underline">
                See more comparisons →
              </Link>
            </div>
          </div>
        </section>
        {isFeaturedComparePair(slug) && (
          <RelatedReading sourceType="compare" siteA={siteA} siteB={siteB} slug={slug} />
        )}
      </PageTransition>
      {/* Sticky mobile CTA on featured compare pairs only — pick the
          higher-scoring affiliated site as the conversion target. */}
      {isFeaturedComparePair(slug) && (() => {
        const target = [siteA, siteB]
          .filter((s): s is SiteData => Boolean(s && isAffiliated(s)))
          .sort((a, b) => b.overall_score - a.overall_score)[0];
        return target ? <StickyMobileCTA site={target} /> : null;
      })()}
    </Layout>
  );
};

export default ComparePage;
