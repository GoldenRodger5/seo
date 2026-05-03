import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import BrandStory from "../components/BrandStory";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageTransition } from "../components/MotionWrappers";
import { sites } from "../data/sites";
import { currentYear } from "../lib/dates";

const FOUNDED_YEAR = 2024;
const CONTACT_EMAIL = "isaac.m.builds@gmail.com";

const faqs = [
  { q: "Who actually writes these reviews?", a: "Me — Isaac, an out gay guy in my mid-twenties who's been a paying member of gay sites for years. I started TwinkVault because every \"top 10\" list I found ranked whichever site paid the highest commission rather than the one I actually enjoyed using. Every score on this site comes from a paid membership I've used personally." },
  { q: "How do you score sites?", a: "Four pillars, each scored 0–100, then weighted into the overall score: content quality (scene count, exclusivity, resolution, performer roster), value for money (price-to-content ratio, trial options, ease of cancellation), site design (UI, search, streaming, mobile experience), and update frequency (how often new content actually drops). The full methodology is on our /methodology page if you want the granular breakdown." },
  { q: "Do sites pay you to rank them higher?", a: "No. Affiliate commissions fund the memberships and keep the lights on, but they don't move scores. A site offering 70% commission stays at whatever score the testing produces. If a network paying us 30% beats a network paying 70% on actual content, the lower-commission site ranks higher. Period." },
  { q: "How often do you update reviews?", a: "Pricing and trial availability get re-checked monthly. Full reviews get rewritten when something material changes — a network rebrand, a meaningful library expansion, a price hike, or a noticeable drop in update cadence. Every page shows the last-updated date so you can see how fresh it is." },
  { q: "Can I trust the prices listed?", a: "Prices are checked weekly. If a site changes their rates without warning (it happens), email me at " + CONTACT_EMAIL + " and I'll verify within 24 hours. Annual pricing is what you'll actually pay if you take the annual plan — not promo-only rates that disappear at checkout." },
  { q: "How do I suggest a site for review?", a: "Send the URL to " + CONTACT_EMAIL + " or via the contact page. I'll subscribe, test it the same way I test everything else, and add it to the next review cycle if it has enough content to evaluate properly." },
  { q: "Why should I trust an independent reviewer over a big affiliate hub?", a: "Big hubs run hundreds of reviews written by freelancers who've never logged in. I run " + sites.length + " reviews from a single perspective — actually paid for, actually used. You get one consistent voice that knows the difference between a genuine 4.5 and a marketing-inflated 4.5. The trade-off is fewer sites covered. The upside is every score is honest." },
];

const About = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>About TwinkVault — Independent Gay Site Reviews</title>
        <meta name="description" content={`TwinkVault is an independent gay site review project, founded ${FOUNDED_YEAR}. Currently ${sites.length} reviewed sites — scored from real, paid memberships.`} />
        <link rel="canonical" href="https://twinkvault.com/about" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About TwinkVault",
          "url": "https://twinkvault.com/about",
          "mainEntity": {
            "@type": "Organization",
            "name": "TwinkVault",
            "url": "https://twinkvault.com",
            "foundingDate": String(FOUNDED_YEAR),
            "email": CONTACT_EMAIL,
            "description": `Independent gay site review project, currently covering ${sites.length} membership sites with first-hand testing.`,
          },
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
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">About TwinkVault</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Founded {FOUNDED_YEAR} · {sites.length} sites reviewed · Updated monthly
            </p>

            <div className="mt-8 glass-card rounded-lg p-8 space-y-6 text-muted-foreground leading-relaxed">
              <p>I started TwinkVault because I got tired of "top 10 gay sites" lists that ranked whichever site paid the highest affiliate commission rather than the one anyone actually wanted to subscribe to. The same names showed up everywhere, in the same order, with the same vague compliments. None of it told you whether a site was worth $9.95 a month, let alone $34.95.</p>
              <p>So I started paying for memberships myself and writing scores I'd actually trust. That's the whole pitch. There are <Link to="/reviews" className="text-secondary hover:underline">{sites.length} reviews on this site</Link>, every one of them written from a paid login. No freelancer farm, no AI-generated review mills, no commission-rigged rankings. One person, real subscriptions, honest scores.</p>
              <p>I'm a gay guy in my mid-twenties. I built this because the existing "best gay sites" lists were obviously written by people who'd never logged in — same five names, same vague compliments, no real opinions about whether anything was worth the price. I do log in. I know the difference between a site that genuinely updates weekly and one that recycles archives. I know which networks share content across "different" brands. I know which sites cancel cleanly and which ones make you fight to leave. That's the lens these reviews are written through.</p>
            </div>
          </motion.div>

          <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">How sites are scored</h2>
            <div className="mt-4 glass-card rounded-lg p-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>Every site is scored on four pillars, each out of 100, then weighted into a single overall score out of 5:</p>
              <ul className="space-y-3 list-disc pl-6">
                <li><strong className="text-foreground">Content Quality</strong> — scene count, exclusivity, video resolution, performer roster, variety of acts covered.</li>
                <li><strong className="text-foreground">Value for Money</strong> — pricing vs. content volume, trial options, cancellation experience, hidden upsells.</li>
                <li><strong className="text-foreground">Site Design</strong> — UI, search and filtering, streaming reliability, mobile experience.</li>
                <li><strong className="text-foreground">Update Frequency</strong> — how often new scenes actually drop, how consistent the schedule is, archive vs. fresh ratio.</li>
              </ul>
              <p>For the granular breakdown — including how each pillar is weighted and what specifically I check — see the <Link to="/methodology" className="text-secondary hover:underline">full methodology page</Link>.</p>
            </div>
          </motion.div>

          <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">How affiliate links work</h2>
            <div className="mt-4 glass-card rounded-lg p-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>Some "Visit Site" buttons go through affiliate tracking. When you sign up via one of those links, the network pays me a commission — that's how the memberships are funded. Pages with affiliate tracking carry the disclosure banner at the top.</p>
              <p>What this <em>doesn't</em> do: change scores, change rankings, or shape coverage. A site I have no affiliate relationship with can outrank a site that pays me 70%, and several do. The scores come from testing; the affiliate status is metadata.</p>
              <p>Full disclosure document: <Link to="/affiliate-disclosure" className="text-secondary hover:underline">/affiliate-disclosure</Link>.</p>
            </div>
          </motion.div>

          <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Contact</h2>
            <div className="mt-4 glass-card rounded-lg p-6 text-muted-foreground leading-relaxed">
              <p>Questions, corrections, suggested sites, or pricing tips: <a href={`mailto:${CONTACT_EMAIL}`} className="text-secondary hover:underline">{CONTACT_EMAIL}</a></p>
              <p className="mt-2">Or use the <Link to="/contact" className="text-secondary hover:underline">contact page</Link>.</p>
            </div>
          </motion.div>

          <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <BrandStory />
          </motion.div>

          <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">FAQ</h2>
            <div className="mt-6">
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-lg border-none px-5">
                    <AccordionTrigger className="font-heading font-semibold text-left hover:no-underline">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>

          <p className="mt-10 text-center text-xs text-muted-foreground/60">
            Last updated {currentYear}. All scores reflect first-hand testing on paid memberships.
          </p>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default About;
