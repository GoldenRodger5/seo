import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import BrandStory from "../components/BrandStory";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageTransition } from "../components/MotionWrappers";

const faqs = [
  { q: "How do you rank sites?", a: "We log in, browse the member area, stream on mobile, test search, and check if the \"weekly updates\" claim is actually true. Then we score four things: content quality, value for money, update frequency, and mobile experience — each out of 100. The overall score is a weighted average. No algorithm, no automation — just people testing sites and writing scores." },
  { q: "Do sites pay you to rank them?", a: "No. We earn affiliate commissions when someone signs up through one of our links — that's how we fund the memberships and keep the lights on. But the scores are 100% ours. A site paying us a higher commission doesn't move its ranking. If a 3.7 site offers us 70% commission, it stays at 3.7." },
  { q: "How often do reviews get updated?", a: "At least once a month. We re-check pricing, trial availability, and whether the site has added new content. If something changes — prices go up, a trial disappears, updates slow down — we adjust the score that same cycle." },
  { q: "Can I trust the prices listed?", a: "We check pricing weekly, but sites can change rates without warning. If you see a price that looks off, let us know via the contact page and we'll verify it within 24 hours." },
  { q: "How do I suggest a site for review?", a: "Send us the URL through our contact page. We'll check it out — if it fits the niche and has enough content to properly evaluate, we'll add it to the next review cycle." },
];

const About = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>About TwinkVault — Independent Twink Site Reviews</title>
        <meta name="description" content="TwinkVault is an independent review site for gay twink content. Learn about our review process and editorial standards." />
        <link rel="canonical" href="https://twinkvault.com/about" />
      </Helmet>

      <section className="py-16">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">About TwinkVault</h1>
            <div className="mt-8 glass-card rounded-lg p-8 space-y-6 text-muted-foreground leading-relaxed">
              <p>TwinkVault exists because we got tired of subscribing to sites based on misleading tour pages and fake "top 10" lists that ranked whoever paid the most. So we started paying for memberships ourselves and writing honest scores.</p>
              <p>We earn affiliate commissions on some links — that's how we pay for the 12+ memberships and keep the site running. But commissions don't affect scores. If a site is mediocre, it gets a mediocre score regardless of what they offer us.</p>
              <p>Every review comes from actual member-area testing: we stream content, try the search, check mobile, count how often they actually upload, and compare pricing across plans. The goal is simple — help you avoid wasting money on sites that aren't worth it.</p>
            </div>
          </motion.div>

          <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <BrandStory />
          </motion.div>

          <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Frequently Asked Questions</h2>
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
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default About;
