import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import ScoreRing from "../components/ScoreRing";
import VisitSiteButton from "../components/VisitSiteButton";
import AnimateOnScroll from "../components/AnimateOnScroll";
import { sites, SiteData } from "../data/sites";

type Step = 1 | 2 | 3 | "result";

const step1Options = [
  { value: "value", label: "Best value for money" },
  { value: "quality", label: "Highest quality video" },
  { value: "niche", label: "Specific niche content" },
  { value: "mobile", label: "Works great on mobile" },
  { value: "trial", label: "Free trial first" },
];

const step2Options = [
  { value: "amateur-twinks", label: "Amateur / Real guys" },
  { value: "premium-studios", label: "Professional studio" },
  { value: "bareback", label: "Bareback" },
  { value: "daddy-twink", label: "Daddy/Twink" },
  { value: "athletic", label: "Athletic / Sporty" },
  { value: "hd-quality", label: "HD / Cinematic" },
];

const step3Options = [
  { value: "low", label: "Under $8/month" },
  { value: "mid", label: "$8–$15/month" },
  { value: "high", label: "$15+ (best quality)" },
];

function getRecommendations(priority: string, contentTypes: string[], budget: string): SiteData[] {
  let scored = sites.map((site) => {
    let score = 0;
    if (priority === "value") score += site.value_score;
    else if (priority === "quality") score += site.content_quality;
    else if (priority === "mobile") score += site.mobile_score;
    else if (priority === "trial" && site.categories.includes("free-trials")) score += 50;
    else if (priority === "niche") score += 20;

    contentTypes.forEach((ct) => {
      if (site.categories.includes(ct)) score += 30;
      if (ct === "bareback" && site.slug.includes("bareback")) score += 30;
      if (ct === "daddy-twink" && site.slug.includes("daddy")) score += 30;
      if (ct === "athletic" && site.slug.includes("athletic")) score += 30;
    });

    const price = parseFloat(site.price_from.replace(/[^0-9.]/g, ""));
    if (budget === "low" && price < 8) score += 25;
    else if (budget === "mid" && price >= 8 && price <= 15) score += 25;
    else if (budget === "high" && price > 15) score += 25;

    return { site, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.site);
}

const FindMySite = () => {
  const [step, setStep] = useState<Step>(1);
  const [priority, setPriority] = useState("");
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [budget, setBudget] = useState("");

  const toggleContent = (val: string) => {
    setContentTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const results = step === "result" ? getRecommendations(priority, contentTypes, budget) : [];

  return (
    <Layout>
      <Helmet>
        <title>Find Your Perfect Twink Site — Quiz | TwinkVault</title>
        <meta name="description" content="Take our 30-second quiz and we'll recommend the best twink content site for you." />
      </Helmet>

      <section className="hero-mesh py-16 min-h-[70vh] flex items-center">
        <div className="container max-w-2xl">
          {step === 1 && (
            <AnimateOnScroll>
              <div className="text-center stagger-in">
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Step 1 of 3</span>
                <h1 className="mt-2 font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">
                  What matters most to you?
                </h1>
                <div className="mt-8 grid gap-3">
                  {step1Options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setPriority(opt.value); setStep(2); }}
                      className={`glass-card card-glow rounded-lg p-4 text-left flex items-center gap-4 transition-all ${
                        priority === opt.value ? "border-primary" : ""
                      }`}
                    >
                      <span className="font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          )}

          {step === 2 && (
            <AnimateOnScroll>
              <div className="text-center stagger-in">
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Step 2 of 3</span>
                <h2 className="mt-2 font-heading text-3xl font-bold heading-gradient inline-block">
                  What type of content?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">Select all that apply</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {step2Options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleContent(opt.value)}
                      className={`glass-card rounded-lg p-4 text-left font-semibold transition-all ${
                        contentTypes.includes(opt.value)
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={contentTypes.length === 0}
                    className="cta-btn gold-gradient rounded-button px-6 py-2.5 text-sm font-semibold text-secondary-foreground disabled:opacity-50"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </AnimateOnScroll>
          )}

          {step === 3 && (
            <AnimateOnScroll>
              <div className="text-center stagger-in">
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Step 3 of 3</span>
                <h2 className="mt-2 font-heading text-3xl font-bold heading-gradient inline-block">
                  What's your budget?
                </h2>
                <div className="mt-8 grid gap-3">
                  {step3Options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setBudget(opt.value); setStep("result"); }}
                      className="glass-card card-glow rounded-lg p-4 text-left font-semibold"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(2)} className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={14} /> Back
                </button>
              </div>
            </AnimateOnScroll>
          )}

          {step === "result" && (
            <AnimateOnScroll>
              <div className="text-center stagger-in">
                <h2 className="font-heading text-3xl font-bold heading-gradient inline-block">
                  Based on your answers, we recommend:
                </h2>
                <div className="mt-8 space-y-4">
                  {results.map((site) => (
                    <div key={site.id} className="glass-card card-glow rounded-lg p-6 text-left">
                      <div className="flex items-start gap-4">
                        <ScoreRing score={site.overall_score} size={60} />
                        <div className="flex-1">
                          <h3 className="font-heading text-xl font-bold">{site.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{site.short_description}</p>
                          <p className="mt-2 text-sm font-semibold">{site.price_from}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <VisitSiteButton site={site} className="flex-1" />
                        <Link
                          to={`/reviews/${site.slug}`}
                          className="rounded-button border border-primary px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                        >
                          Read Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col items-center gap-3">
                  <Link to="/top-sites" className="flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
                    See all our rankings <ArrowRight size={14} />
                  </Link>
                  <button
                    onClick={() => { setStep(1); setPriority(""); setContentTypes([]); setBudget(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Retake quiz
                  </button>
                </div>
              </div>
            </AnimateOnScroll>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default FindMySite;
