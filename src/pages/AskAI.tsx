import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import StarRating from "../components/StarRating";
import DualCTAButtons from "../components/DualCTAButtons";
import LocalisedPrice from "../components/LocalisedPrice";
import { sites } from "../data/sites";

interface Recommendation {
  slug: string;
  reason: string;
  match: string;
}

const AskAI = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setRecs([]);
    setHasSearched(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      setRecs(data.recommendations || []);
    } catch {
      setError("Something went wrong. Try rephrasing your question.");
    }
    setLoading(false);
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
                  <Sparkles size={14} /> Smart Recommendations
                </span>
              </div>
              <h1 className="mt-4 hero-heading font-heading font-bold heading-gradient inline-block">
                Tell Us What You Want
              </h1>
              <p className="mt-4 text-muted-foreground">
                Describe your budget, preferences, or what you're into — we'll match you to the best sites from our tested library of {sites.length}.
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
                      AI is thinking...
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
              {error && (
                <motion.p
                  key="error"
                  className="mt-6 text-center text-sm text-destructive"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}

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
                    const isTop = i === 0;
                    return (
                      <motion.div
                        key={rec.slug}
                        className={`glass-card rounded-lg ${
                          isTop
                            ? "p-6 border-t-2 border-t-secondary shadow-[0_4px_24px_hsl(48,96%,53%,0.12)]"
                            : "p-5"
                        }`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isTop && (
                                <span className="rounded-button gold-gradient px-2.5 py-0.5 text-[10px] font-bold text-secondary-foreground uppercase tracking-wide">
                                  ★ #1 Match
                                </span>
                              )}
                              <span className="rounded-button bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                {rec.match}
                              </span>
                            </div>
                            <h3 className={`mt-2 font-heading font-bold ${isTop ? "text-xl" : "text-lg"}`}>{site.name}</h3>
                            <StarRating score={site.overall_score} size={13} />
                            <p className="mt-2 text-sm text-muted-foreground">{rec.reason}</p>
                            <p className="mt-1 text-xs text-muted-foreground"><LocalisedPrice usd={site.price_monthly} /> · <LocalisedPrice usd={site.price_annual} /> annual</p>
                          </div>
                        </div>
                        <DualCTAButtons site={site} className="mt-4" />
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
