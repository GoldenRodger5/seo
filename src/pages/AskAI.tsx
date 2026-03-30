import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Send } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import StarRating from "../components/StarRating";
import VisitSiteButton from "../components/VisitSiteButton";
import { sites, SiteData } from "../data/sites";

interface Recommendation {
  slug: string;
  reason: string;
  match: string;
}

// Keyword → site scoring rules
const KEYWORD_MAP: Record<string, { slugs?: string[]; categories?: string[]; field?: keyof SiteData; reason: string }> = {
  cheap: { categories: ["best-value"], reason: "Great value pricing on the annual plan" },
  budget: { categories: ["best-value"], reason: "One of the most affordable options available" },
  affordable: { categories: ["best-value"], reason: "Strong value for the price" },
  value: { categories: ["best-value"], reason: "Best bang for your buck" },
  inexpensive: { categories: ["best-value"], reason: "Low-cost option with solid content" },
  free: { field: "has_free_trial", reason: "Offers a trial so you can test before committing" },
  trial: { field: "has_free_trial", reason: "Has a trial option available" },
  premium: { categories: ["premium-studios"], reason: "Premium production quality and exclusive content" },
  quality: { categories: ["premium-studios", "hd-quality"], reason: "High production standards" },
  cinematic: { slugs: ["helix-studios"], reason: "Cinema-quality production values" },
  hd: { categories: ["hd-quality"], reason: "HD and 4K streaming available" },
  "4k": { categories: ["hd-quality"], reason: "Supports up to 4K video quality" },
  mobile: { categories: ["mobile-friendly"], reason: "Excellent mobile streaming experience" },
  phone: { categories: ["mobile-friendly"], reason: "Optimized for phone viewing" },
  amateur: { categories: ["amateur-twinks"], reason: "Authentic amateur-style content" },
  natural: { categories: ["amateur-twinks"], reason: "Natural unscripted performer chemistry" },
  authentic: { categories: ["amateur-twinks"], reason: "Genuine authentic content" },
  real: { categories: ["amateur-twinks"], reason: "Real performers with natural chemistry" },
  raw: { slugs: ["breed-me-raw", "bareback-that-hole"], reason: "Dedicated raw/bareback content" },
  bareback: { slugs: ["breed-me-raw", "bareback-that-hole"], reason: "Focuses on bareback scenes" },
  british: { slugs: ["hard-brit-lads"], reason: "Exclusively British performers" },
  uk: { slugs: ["hard-brit-lads"], reason: "UK-based performers and content" },
  european: { slugs: ["hard-brit-lads", "helix-studios"], reason: "Strong European content library" },
  latin: { slugs: ["prideflame", "helix-studios"], reason: "Features Latino performers" },
  latino: { slugs: ["prideflame"], reason: "Celebrates Latino and diverse performers" },
  diverse: { slugs: ["prideflame"], reason: "Diverse and inclusive performer roster" },
  athletic: { slugs: ["athletic-twinks"], reason: "Toned athletic performers" },
  fit: { slugs: ["athletic-twinks"], reason: "Fit gym-body performers" },
  gym: { slugs: ["athletic-twinks"], reason: "Athletic physique focus" },
  jock: { slugs: ["athletic-twinks"], reason: "Sporty jock-type performers" },
  southern: { slugs: ["southern-strokes"], reason: "All-American Southern charm" },
  american: { slugs: ["southern-strokes", "next-door-twink"], reason: "All-American performers" },
  daddy: { slugs: ["daddy-on-twink"], reason: "Intergenerational content with strong chemistry" },
  older: { slugs: ["daddy-on-twink"], reason: "Features older/younger pairings" },
  intergenerational: { slugs: ["daddy-on-twink"], reason: "Specializes in age-gap dynamics" },
  intimate: { slugs: ["touch-that-boy"], reason: "Sensual intimate content focused on connection" },
  sensual: { slugs: ["touch-that-boy"], reason: "Slower-paced sensual scenes" },
  romantic: { slugs: ["touch-that-boy"], reason: "Emphasizes genuine attraction and connection" },
  gentle: { slugs: ["touch-that-boy"], reason: "Intimate and gentle approach" },
  network: { slugs: ["next-door-twink", "next-door-world"], reason: "Massive multi-channel network access" },
  variety: { slugs: ["next-door-world", "next-door-twink"], reason: "Huge variety across 45+ channels" },
  big: { slugs: ["next-door-world", "helix-studios"], reason: "One of the largest content libraries" },
  lots: { slugs: ["next-door-world", "next-door-twink"], reason: "12,500+ videos in the network" },
  massive: { slugs: ["next-door-world"], reason: "Massive 45+ channel network" },
};

function matchSites(query: string): Recommendation[] {
  const words = query.toLowerCase().split(/\s+/);
  const scores = new Map<string, { score: number; reasons: string[] }>();

  // Initialize all sites
  for (const site of sites) {
    scores.set(site.slug, { score: 0, reasons: [] });
  }

  // Score by keyword matches
  for (const word of words) {
    for (const [keyword, rule] of Object.entries(KEYWORD_MAP)) {
      if (!word.includes(keyword) && !keyword.includes(word)) continue;

      if (rule.slugs) {
        for (const slug of rule.slugs) {
          const s = scores.get(slug);
          if (s) { s.score += 3; s.reasons.push(rule.reason); }
        }
      }
      if (rule.categories) {
        for (const site of sites) {
          if (site.categories.some(c => rule.categories!.includes(c))) {
            const s = scores.get(site.slug);
            if (s) { s.score += 2; s.reasons.push(rule.reason); }
          }
        }
      }
      if (rule.field === "has_free_trial") {
        for (const site of sites) {
          if (site.has_free_trial) {
            const s = scores.get(site.slug);
            if (s) { s.score += 3; s.reasons.push(rule.reason); }
          }
        }
        // Also boost ASGmax $2.95 trial
        const ndt = scores.get("next-door-twink");
        const ndw = scores.get("next-door-world");
        if (ndt) { ndt.score += 2; ndt.reasons.push("$2.95 three-day trial available"); }
        if (ndw) { ndw.score += 2; ndw.reasons.push("$2.95 three-day trial available"); }
      }
    }

    // Also check if the word appears in site descriptions/pros
    for (const site of sites) {
      const text = `${site.short_description} ${site.description} ${site.pros.join(" ")} ${site.best_for}`.toLowerCase();
      if (text.includes(word) && word.length > 3) {
        const s = scores.get(site.slug);
        if (s) s.score += 1;
      }
    }
  }

  // Price sensitivity detection
  const wantsCheap = words.some(w => ["cheap", "budget", "affordable", "inexpensive", "low", "save", "deal", "discount"].includes(w));
  const wantsPremium = words.some(w => ["premium", "best", "top", "cinematic", "quality", "expensive"].includes(w));

  if (wantsCheap) {
    for (const site of sites) {
      const annual = parseFloat(site.price_annual.replace(/[^0-9.]/g, ""));
      if (annual <= 10) {
        const s = scores.get(site.slug);
        if (s) { s.score += 2; s.reasons.push(`Just ${site.price_annual}/mo on the annual plan`); }
      }
    }
  }
  if (wantsPremium) {
    for (const site of sites) {
      if (site.overall_score >= 4.5) {
        const s = scores.get(site.slug);
        if (s) { s.score += 2; s.reasons.push(`Top-rated at ${site.overall_score}/5`); }
      }
    }
  }

  // Sort by score, take top 3
  const ranked = [...scores.entries()]
    .filter(([, v]) => v.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3);

  // If no keyword matches, fall back to top-rated sites
  if (ranked.length === 0) {
    const top = [...sites].sort((a, b) => b.overall_score - a.overall_score).slice(0, 3);
    return top.map((site, i) => ({
      slug: site.slug,
      match: `${95 - i * 5}% match`,
      reason: `Top-rated at ${site.overall_score}/5 — ${site.best_for.toLowerCase()}.`,
    }));
  }

  const maxScore = ranked[0][1].score;
  return ranked.map(([slug, data]) => {
    const pct = Math.round((data.score / maxScore) * 97);
    const uniqueReasons = [...new Set(data.reasons)];
    return {
      slug,
      match: `${Math.min(pct, 97)}% match`,
      reason: uniqueReasons.slice(0, 2).join(". ") + ".",
    };
  });
}

const AskAI = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setRecs([]);
    setHasSearched(true);

    // Small delay for perceived "thinking"
    setTimeout(() => {
      setRecs(matchSites(query));
      setLoading(false);
    }, 600);
  };

  const examplePrompts = [
    "I want something cheap with bareback content",
    "Best site for athletic guys, I don't care about price",
    "I want to try before I pay — free trial",
    "European twinks, good HD quality",
    "All-American natural guys, not too expensive",
  ];

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>AI Site Recommender — Find Your Perfect Match | TwinkVault</title>
          <meta name="description" content="Describe what you want and our AI will recommend the best twink content sites for you. Powered by Claude." />
          <link rel="canonical" href="https://twinkvault.com/ask-ai" />
        </Helmet>

        <section className="py-16">
          <div className="container max-w-2xl">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-button bg-primary/15 px-4 py-2 text-sm font-medium text-primary">
                  <Sparkles size={14} /> Powered by Claude AI
                </span>
              </div>
              <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
                Find Your Perfect Site
              </h1>
              <p className="mt-4 text-muted-foreground">
                Describe exactly what you want in plain English. Our AI reads all 12 site profiles and picks the best matches for you.
              </p>
            </motion.div>

            <motion.div
              className="mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="glass-card rounded-lg p-6">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="e.g. I want high quality content with athletic guys, I don't mind paying more for better production..."
                  rows={3}
                  className="w-full rounded-button border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading || !query.trim()}
                  className="cta-btn mt-3 gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                      Finding matches...
                    </>
                  ) : (
                    <><Send size={14} /> Find My Sites</>
                  )}
                </button>
              </div>

              {!hasSearched && (
                <div className="mt-6">
                  <p className="mb-3 text-center text-xs text-muted-foreground">Try an example:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {examplePrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => setQuery(p)}
                        className="rounded-button border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <AnimatePresence mode="wait">
              {recs.length > 0 && (
                <motion.div
                  key="results"
                  className="mt-10 space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="font-heading text-xl font-bold heading-gradient inline-block">
                    Your Top Matches
                  </h2>
                  {recs.map((rec, i) => {
                    const site = sites.find(s => s.slug === rec.slug);
                    if (!site) return null;
                    return (
                      <motion.div
                        key={rec.slug}
                        className="glass-card rounded-lg p-5"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {i === 0 && (
                                <span className="rounded-button bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                  #1 Match
                                </span>
                              )}
                              <span className="rounded-button bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                {rec.match}
                              </span>
                            </div>
                            <h3 className="mt-2 font-heading text-lg font-bold">{site.name}</h3>
                            <StarRating score={site.overall_score} size={13} />
                            <p className="mt-2 text-sm text-muted-foreground">{rec.reason}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{site.price_monthly} · {site.price_annual}/mo annual</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <Link
                            to={`/reviews/${site.slug}`}
                            className="flex-1 rounded-button border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                          >
                            Read Review
                          </Link>
                          <VisitSiteButton site={site} className="flex-1" showDisclosure={false} />
                        </div>
                      </motion.div>
                    );
                  })}

                  <p className="text-center text-xs text-muted-foreground pt-2">
                    Not what you expected?{" "}
                    <button onClick={() => { setRecs([]); setHasSearched(false); setQuery(""); }} className="text-primary hover:underline">
                      Try a different description
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default AskAI;
