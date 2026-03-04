import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import AnimateOnScroll from "../components/AnimateOnScroll";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do you rank sites?",
    a: "We evaluate each site across four categories: Content Quality, Value for Money, Update Frequency, and Mobile Experience. Each category is scored out of 100, and the overall score is a weighted average. Our team personally tests each site before publishing a review.",
  },
  {
    q: "Do you get paid by the sites you review?",
    a: "No. We earn commissions when you sign up through our affiliate links, but this never influences our editorial rankings. We pay for memberships out of pocket and review sites independently.",
  },
  {
    q: "How often do you update reviews?",
    a: "We revisit every reviewed site at least once a month to ensure our scores and information are accurate. Major updates are noted with a freshness badge on each review.",
  },
  {
    q: "Are the prices accurate?",
    a: "We update pricing information weekly. However, sites may change their prices without notice. The prices shown are the best available at the time of our last check.",
  },
  {
    q: "How do I suggest a site for review?",
    a: "We're always looking for new sites to review! Send us the site URL via our contact page, and our team will evaluate it for inclusion in our rankings.",
  },
];

const About = () => (
  <Layout>
    <Helmet>
      <title>About TwinkVault — Independent Twink Site Reviews</title>
      <meta name="description" content="TwinkVault is an independent review site for gay twink content. Learn about our review process and editorial standards." />
      <link rel="canonical" href="https://twinkvault.com/about" />
    </Helmet>

    <section className="py-16">
      <div className="container max-w-3xl">
        <AnimateOnScroll>
          <div className="stagger-in">
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">About TwinkVault</h1>

            <div className="mt-8 glass-card rounded-lg p-8 space-y-6 text-muted-foreground leading-relaxed">
              <p>
                TwinkVault is an independent review site founded in 2024. We personally test and review gay twink content sites so you can make informed decisions before subscribing.
              </p>
              <p>
                Our team pays for memberships out of pocket — we are not paid by any site to rank them higher. We earn commissions when you sign up through our links, which funds our reviews. This never influences our editorial rankings.
              </p>
              <p>
                Every review is based on real testing: we evaluate content quality, site usability, mobile experience, update frequency, and value for money. Our goal is to save you time and money by helping you find the best sites without the guesswork.
              </p>
            </div>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll className="mt-12">
          <h2 className="font-heading text-2xl font-bold heading-gradient inline-block">Frequently Asked Questions</h2>
          <div className="mt-6">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-lg border-none px-5">
                  <AccordionTrigger className="font-heading font-semibold text-left hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  </Layout>
);

export default About;
