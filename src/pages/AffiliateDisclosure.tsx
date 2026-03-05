import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import AnimateOnScroll from "../components/AnimateOnScroll";

const AffiliateDisclosure = () => (
  <Layout>
    <Helmet>
      <title>Affiliate Disclosure — TwinkVault</title>
      <meta name="description" content="TwinkVault affiliate disclosure. Learn how we earn commissions and how it affects our reviews." />
      <link rel="canonical" href="https://twinkvault.com/affiliate-disclosure" />
    </Helmet>

    <section className="py-16">
      <div className="container max-w-3xl">
        <AnimateOnScroll>
          <div className="stagger-in">
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">Affiliate Disclosure</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

            <div className="mt-8 glass-card rounded-lg p-8 space-y-6 text-muted-foreground leading-relaxed">
              <p className="text-foreground font-semibold text-lg">
                TwinkVault.com participates in affiliate programs.
              </p>

              <p>
                When you click our links and purchase a membership, we may earn a commission at no extra cost to you. Our rankings are based solely on content quality, value, and user experience — not on commission rates.
              </p>

              <p>
                We believe in full transparency. Here's how our affiliate relationships work:
              </p>

              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>We earn a commission when you sign up for a site through our links.</li>
                <li>The commission comes from the site, not from you — you pay the same price regardless.</li>
                <li>Commission rates vary by site but never influence our rankings or scores.</li>
                <li>We pay for our own memberships to test and review each site independently.</li>
                <li>Affiliate revenue funds our operations, allowing us to continue providing free, honest reviews.</li>
              </ul>

              <p>
                All "Visit Site" buttons and affiliate links on TwinkVault.com are clearly marked. We label these links transparently throughout the site.
              </p>

              <p>
                If you have any questions about our affiliate relationships, please don't hesitate to contact us.
              </p>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  </Layout>
);

export default AffiliateDisclosure;
