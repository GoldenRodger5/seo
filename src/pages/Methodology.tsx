import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import { sites } from "../data/sites";
import { currentYear, currentMonthLong } from "../lib/dates";

const pillars = [
  {
    name: "Content Quality",
    weight: 35,
    out_of: 10,
    summary: "How good is the actual content — and is there enough of it?",
    checks: [
      "Total scene count (verified via member-area count, not marketing claim)",
      "Percentage exclusive to this site vs. licensed/recycled",
      "Default streaming resolution (4K / 1080p / 720p / SD)",
      "Performer roster size and turnover",
      "Variety of acts and scenarios covered",
    ],
  },
  {
    name: "Value For Money",
    weight: 25,
    out_of: 10,
    summary: "Are you getting fair content per dollar — and can you leave easily?",
    checks: [
      "Effective monthly cost on the cheapest legitimate plan",
      "Cost per video (library size ÷ annual price)",
      "Trial availability and trial-to-paid pricing transparency",
      "Cancellation experience (clicks-to-cancel)",
      "Upsells and cross-sells inside the member area",
    ],
  },
  {
    name: "Site Design",
    weight: 20,
    out_of: 10,
    summary: "How does the actual product feel to use?",
    checks: [
      "Search accuracy and usable filters",
      "Streaming reliability and load times",
      "Mobile experience (scrolling, controls, quality switching)",
      "Visual design and information density",
      "Account management UX (downloads, history, billing)",
    ],
  },
  {
    name: "Update Frequency",
    weight: 20,
    out_of: 10,
    summary: "Is the site still actively producing — or coasting on archives?",
    checks: [
      "New scenes per week, averaged over the last 90 days",
      "Consistency of upload schedule",
      "Newest scene date vs. site age",
      "Recycled vs. genuinely new content",
      "Network update spillover (for network memberships)",
    ],
  },
];

const overallFormula =
  "Overall = (Content × 0.35) + (Value × 0.25) + (Design × 0.20) + (Updates × 0.20), rescaled to a 0–5 score.";

const faqs = [
  { q: "Why these four pillars?", a: "They're the four things I actually care about as a paying subscriber. Content is what you're paying for. Value is whether the price feels fair. Design determines whether you'll keep the subscription. Updates determine whether the site is still alive. Everything else is a sub-factor inside one of these." },
  { q: "Why is content quality weighted highest?", a: "Because if the content's bad, nothing else saves the subscription. A beautifully designed site with a thin, recycled library still isn't worth paying for. Conversely, a great content library forgives a lot of UX sins." },
  { q: "Why is design only 20%?", a: "Most paying users adapt to a clunky UI within a week. Bad search is annoying, but it doesn't make the content worse. I weight what affects the actual value of the subscription more heavily than what affects the first-impression." },
  { q: "Do scores ever change after publishing?", a: "Yes. Pricing changes, library expansions, network rebrands, and update slowdowns all trigger a re-score. Every review page shows the last-updated date. If a site's score moves more than 0.3 in either direction, I leave a brief note explaining why." },
  { q: "Can I see the actual numbers behind a site's score?", a: "Each individual review page shows the four sub-scores out of 100 alongside the overall score. The score breakdown card on every review is exactly the data this methodology produces — nothing hidden." },
];

const Methodology = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>Review Methodology — How TwinkVault Scores Sites | TwinkVault</title>
        <meta name="description" content={`How TwinkVault scores ${sites.length} gay membership sites: four weighted pillars, transparent checks, monthly re-verification.`} />
        <link rel="canonical" href="https://twinkvault.com/methodology" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://twinkvault.com/" },
            { "@type": "ListItem", "position": 2, "name": "Methodology", "item": "https://twinkvault.com/methodology" },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map((f) => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
          })),
        })}</script>
      </Helmet>

      <section className="py-16">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span className="mx-2 text-muted-foreground/30">/</span>
              <span className="text-foreground">Methodology</span>
            </nav>

            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">Review Methodology</h1>
            <p className="mt-4 text-muted-foreground">
              How {sites.length} sites are scored, what gets checked, and how the overall score is calculated. Updated {currentMonthLong} {currentYear}.
            </p>

            <div className="mt-8 glass-card rounded-lg p-6 text-muted-foreground leading-relaxed">
              <p>Every TwinkVault review is built from a paid membership. I subscribe, I use the site for at least two billing cycles, then I score four pillars individually before combining them into a single overall score.</p>
              <p className="mt-3">The pillars and their weights are <strong className="text-foreground">fixed</strong> across all reviews — every site is scored against the same rubric, and that rubric doesn't shift based on affiliate relationships, niche, or how new the site is.</p>
            </div>
          </motion.div>

          <div className="mt-10 space-y-6">
            {pillars.map((p, i) => (
              <motion.div
                key={p.name}
                className="glass-card rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <h2 className="font-heading text-xl font-bold heading-gradient inline-block">
                    {p.name}
                  </h2>
                  <span className="text-sm font-semibold text-secondary">
                    Weight: {p.weight}% · Scored 0–{p.out_of}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">{p.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-6">
                  {p.checks.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div className="mt-10 glass-card rounded-lg p-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">The overall score</h2>
            <p className="mt-3 text-muted-foreground">{overallFormula}</p>
            <p className="mt-3 text-muted-foreground">A site needs to score consistently across all four to land above 4.5/5. A 95 in content can't carry a 60 in updates — the weighting is deliberately balanced so a single strong pillar doesn't whitewash weakness elsewhere.</p>
          </motion.div>

          <motion.div className="mt-10 glass-card rounded-lg p-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">What's not in the score</h2>
            <ul className="mt-4 space-y-2 text-muted-foreground list-disc pl-6">
              <li><strong className="text-foreground">Affiliate commission rate.</strong> Has zero weight. A site I don't earn a cent from can outrank a site paying 70%, and several do.</li>
              <li><strong className="text-foreground">Marketing claims.</strong> "4K HDR" only counts if scenes actually deliver it. "Weekly updates" only counts if the upload calendar actually shows weekly drops.</li>
              <li><strong className="text-foreground">My personal taste.</strong> A niche site I'm not into the content of can still score well if it executes the niche cleanly.</li>
              <li><strong className="text-foreground">Tour-page promises.</strong> Everything is verified inside the member area, on a paid login.</li>
            </ul>
          </motion.div>

          <motion.div className="mt-10" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">FAQ</h2>
            <Accordion type="single" collapsible className="mt-4 space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-lg border-none px-5">
                  <AccordionTrigger className="font-heading font-semibold text-left hover:no-underline">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
            >
              Browse all {sites.length} reviews →
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-button border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              About the reviewer
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default Methodology;
