import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import StarRating from "../components/StarRating";
import OutboundLink from "../components/OutboundLink";
import SitePlaceholderImage from "../components/SitePlaceholderImage";
import LocalisedPrice from "../components/LocalisedPrice";
import { sites, isAffiliated } from "../data/sites";

interface Recommendation {
  slug: string;
  reason: string;
  match: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form options — kept tight per spec ("3 questions max").
// ─────────────────────────────────────────────────────────────────────────────

type BudgetKey = "under15" | "mid" | "premium";
const BUDGET_OPTIONS: { key: BudgetKey; label: string; phrase: string }[] = [
  { key: "under15", label: "Under $15/mo", phrase: "I want something under $15/month" },
  { key: "mid",     label: "$15–25/mo",    phrase: "My budget is $15-25/month" },
  { key: "premium", label: "Over $25/mo",  phrase: "I'm fine paying over $25/month for premium" },
];

const NICHE_OPTIONS: { slug: string; label: string }[] = [
  { slug: "twink", label: "Twink" },
  { slug: "bareback", label: "Bareback" },
  { slug: "amateur", label: "Amateur" },
  { slug: "muscle", label: "Muscle" },
  { slug: "daddy", label: "Daddy" },
  { slug: "asian", label: "Asian" },
  { slug: "college", label: "College" },
  { slug: "jock", label: "Jock" },
];

type PriorityKey = "library" | "fresh" | "value" | "niche";
const PRIORITY_OPTIONS: { key: PriorityKey; label: string; phrase: string }[] = [
  { key: "library", label: "Huge library",        phrase: "I want the biggest scene library possible" },
  { key: "fresh",   label: "Latest content",      phrase: "I prioritize frequent new releases" },
  { key: "value",   label: "Best value",          phrase: "Value matters more than premium production" },
  { key: "niche",   label: "Specific niche",      phrase: "I want a site that nails one specific niche" },
];

const AskAI = () => {
  const [budget, setBudget] = useState<BudgetKey | null>(null);
  const [niches, setNiches] = useState<string[]>([]);
  const [priority, setPriority] = useState<PriorityKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const canSubmit = budget !== null && niches.length > 0 && priority !== null;

  const toggleNiche = (slug: string) => {
    setNiches((cur) => cur.includes(slug) ? cur.filter((n) => n !== slug) : [...cur, slug]);
  };

  const resetForm = () => {
    // Preserves last inputs per spec — only clears results.
    setRecs([]);
    setHasSearched(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;

    // Compose a query string from the selections so /api/recommend's
    // existing free-text interface stays unchanged.
    const budgetPhrase = BUDGET_OPTIONS.find((b) => b.key === budget)!.phrase;
    const nichePhrase = `Into: ${niches.map((s) => NICHE_OPTIONS.find((n) => n.slug === s)?.label).filter(Boolean).join(", ")}`;
    const priorityPhrase = PRIORITY_OPTIONS.find((p) => p.key === priority)!.phrase;
    const query = `${budgetPhrase}. ${nichePhrase}. ${priorityPhrase}.`;

    setLoading(true);
    setError("");
    setRecs([]);
    setHasSearched(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setRecs(data.recommendations || []);
    } catch {
      setError("Something went wrong. Try different answers.");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>Find your site — TwinkVault</title>
          <meta name="description" content="Three questions. One recommendation from the 62 sites I've tested." />
          <link rel="canonical" href="https://twinkvault.com/ask-ai" />
        </Helmet>

        <section className="py-16">
          <div className="container max-w-2xl">

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">
                Find your site in 30 seconds
              </h1>
              <p className="mt-4 text-muted-foreground">
                Tell me your budget and what you're into. I'll match you to a site from the {sites.length} I've tested.
              </p>
            </motion.div>

            {/* Form */}
            <motion.div
              className="mt-10 glass-card rounded-lg p-6 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Budget */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Budget per month</p>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setBudget(opt.key)}
                      className={`rounded-button px-4 py-2 text-sm font-medium transition-colors ${
                        budget === opt.key
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Niche multi-select */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">What you're into</p>
                <div className="flex flex-wrap gap-2">
                  {NICHE_OPTIONS.map((n) => (
                    <button
                      key={n.slug}
                      onClick={() => toggleNiche(n.slug)}
                      className={`rounded-button px-3 py-1.5 text-xs font-medium transition-colors ${
                        niches.includes(n.slug)
                          ? "bg-secondary/20 text-secondary border border-secondary/40"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
                {niches.length > 0 && (
                  <p className="mt-2 text-[11px] text-muted-foreground">{niches.length} selected</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">What matters most</p>
                <div className="flex flex-wrap gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setPriority(opt.key)}
                      className={`rounded-button px-4 py-2 text-sm font-medium transition-colors ${
                        priority === opt.key
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-transparent"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                    Matching…
                  </>
                ) : (
                  <>Find my site <ArrowRight size={14} /></>
                )}
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  className="mt-6 text-center text-sm text-destructive"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}

              {hasSearched && !loading && !error && recs.length === 0 && (
                <motion.p
                  key="empty"
                  className="mt-6 text-center text-sm text-muted-foreground"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  No clean match for that combination. Try fewer filters or a different priority.
                </motion.p>
              )}

              {recs.length > 0 && (() => {
                const primaryRec = recs[0];
                const primarySite = sites.find((s) => s.slug === primaryRec.slug);
                const secondaryRecs = recs.slice(1, 3);
                return (
                  <motion.div
                    key="results"
                    className="mt-10 space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Primary recommendation — prominent card */}
                    {primarySite && (
                      <div className="glass-card rounded-lg overflow-hidden border-t-2 border-t-secondary">
                        <SitePlaceholderImage site={primarySite} />
                        <div className="p-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-button gold-gradient px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-wide">
                              ★ Recommended
                            </span>
                            <span className="rounded-button bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              {primaryRec.match}
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                            <h2 className="font-heading text-2xl font-bold">{primarySite.name}</h2>
                            <span className="text-sm font-semibold text-secondary tabular-nums">{primarySite.overall_score}/5</span>
                          </div>
                          <StarRating score={primarySite.overall_score} size={14} />
                          <p className="mt-4 text-sm text-foreground/85 leading-relaxed">{primaryRec.reason}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            <LocalisedPrice usd={primarySite.price_monthly} /> monthly ·{" "}
                            <LocalisedPrice usd={primarySite.price_annual} /> annual
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            {isAffiliated(primarySite) && (
                              <OutboundLink
                                site={primarySite}
                                ctaPosition="hero"
                                sourceTypeOverride="ask_ai_primary"
                                className="cta-btn gold-gradient inline-flex items-center gap-2 rounded-button px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
                              >
                                Visit {primarySite.name} <ArrowRight size={13} />
                              </OutboundLink>
                            )}
                            {primarySite.deal_discount > 0 && (
                              <Link
                                to={`/discount/${primarySite.slug}`}
                                className="inline-flex items-center gap-1.5 rounded-button border border-emerald-400/50 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                              >
                                Get {primarySite.deal_discount}% off <ArrowRight size={13} />
                              </Link>
                            )}
                            <Link
                              to={`/reviews/${primarySite.slug}`}
                              className="inline-flex items-center gap-1 rounded-button border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                            >
                              Read full review →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Secondary recommendations — compact */}
                    {secondaryRecs.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                          Also consider
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {secondaryRecs.map((rec) => {
                            const site = sites.find((s) => s.slug === rec.slug);
                            if (!site) return null;
                            return (
                              <Link
                                key={rec.slug}
                                to={`/reviews/${site.slug}`}
                                className="block rounded-lg border border-border/60 bg-card/40 p-4 hover:border-primary/40 transition-colors"
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <h3 className="font-heading text-base font-bold">{site.name}</h3>
                                  <span className="text-xs font-semibold text-secondary tabular-nums shrink-0">{site.overall_score}/5</span>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{rec.reason}</p>
                                <span className="mt-3 inline-flex items-center gap-1 text-xs text-secondary">
                                  Read review →
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-center text-xs text-muted-foreground pt-2">
                      <button
                        onClick={resetForm}
                        className="text-primary hover:underline"
                      >
                        Try different answers →
                      </button>
                    </p>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {!hasSearched && !loading && (
              <p className="mt-8 text-center text-xs text-muted-foreground/70">
                Three questions. One recommendation. No newsletter signup, no email required.
              </p>
            )}
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default AskAI;
