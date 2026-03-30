import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Send } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import StarRating from "../components/StarRating";
import VisitSiteButton from "../components/VisitSiteButton";
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

  const siteContext = sites.map(s =>
    `${s.name} (slug: ${s.slug}): Score ${s.overall_score}/5. ${s.short_description} Categories: ${s.categories.join(", ")}. Price: ${s.price_monthly} monthly or ${s.price_annual}/mo annual. Has free trial: ${s.has_free_trial}. Pros: ${s.pros.slice(0,3).join(", ")}. Cons: ${s.cons.slice(0,2).join(", ")}.`
  ).join("\n");

  const handleSubmit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setRecs([]);
    setHasSearched(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are TwinkVault's recommendation engine. A user will describe what they want from a gay twink content site. Based on their preferences, recommend the top 2-3 best matches from our site database.

Available sites:
${siteContext}

Respond ONLY with valid JSON in this exact format, nothing else:
{
  "recommendations": [
    {
      "slug": "site-slug-here",
      "match": "95% match",
      "reason": "One sentence explaining why this is perfect for what they described."
    }
  ]
}

Rules:
- Return 2-3 recommendations maximum
- Use exact slugs from the database
- Keep reasons concise, specific, and reference the user's actual words
- Order by best match first`,
          messages: [{ role: "user", content: query }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setRecs(parsed.recommendations || []);
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
