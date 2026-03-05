import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import AnimateOnScroll from "../components/AnimateOnScroll";

const PrivacyPolicy = () => (
  <Layout>
    <Helmet>
      <title>Privacy Policy — TwinkVault</title>
      <meta name="description" content="TwinkVault privacy policy. Learn how we collect, use, and protect your data." />
      <link rel="canonical" href="https://twinkvault.com/privacy-policy" />
    </Helmet>

    <section className="py-16">
      <div className="container max-w-3xl">
        <AnimateOnScroll>
          <div className="stagger-in">
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">Privacy Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2026</p>

            <div className="mt-8 glass-card rounded-lg p-8 space-y-6 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Information We Collect</h2>
                <p className="mt-2">We collect minimal personal information. When you subscribe to our newsletter, we collect your email address. We use analytics cookies to understand how visitors use our site.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">How We Use Your Information</h2>
                <p className="mt-2">Your email address is used solely to send our monthly deals newsletter. Analytics data is used to improve our site and content. We never sell your personal information to third parties.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Cookies & Tracking</h2>
                <p className="mt-2">We use essential cookies for site functionality (e.g., age verification, newsletter preferences). We use analytics cookies to understand site usage. Affiliate links may use tracking cookies set by third-party sites.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Third-Party Links</h2>
                <p className="mt-2">Our site contains affiliate links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to review their privacy policies.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Your Rights</h2>
                <p className="mt-2">You can unsubscribe from our newsletter at any time. You can request deletion of your data by contacting us. We comply with applicable data protection regulations.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">Contact</h2>
                <p className="mt-2">For privacy-related inquiries, please contact us at privacy@twinkvault.com.</p>
              </section>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  </Layout>
);

export default PrivacyPolicy;
