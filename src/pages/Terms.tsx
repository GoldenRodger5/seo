import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import { motion } from "framer-motion";

const Terms = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>Terms of Service — TwinkVault</title>
        <meta name="description" content="TwinkVault terms of service. Read our terms before using this site." />
        <link rel="canonical" href="https://twinkvault.com/terms" />
      </Helmet>

      <section className="py-16">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">Terms of Service</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2025</p>

            <div className="mt-8 glass-card rounded-lg p-8 space-y-8 text-muted-foreground leading-relaxed">

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
                <p className="mt-2">By accessing or using TwinkVault.com ("the Site"), you confirm that you are at least 18 years of age (or the age of majority in your jurisdiction, whichever is higher), and that you agree to be bound by these Terms of Service. If you do not agree, you must leave the Site immediately.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">2. Adult Content</h2>
                <p className="mt-2">This Site contains links to and reviews of adult content websites. All content linked from this Site is intended exclusively for adults aged 18 or older. By using this Site you confirm you are of legal age in your jurisdiction to view adult material. We do not host, produce, or distribute adult content directly — we provide editorial reviews and affiliate links only.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">3. Affiliate Relationships</h2>
                <p className="mt-2">TwinkVault participates in affiliate marketing programs. When you click links on this Site and make a purchase, we may earn a commission. This does not affect the price you pay. Our editorial rankings and review scores are independent of our affiliate relationships. See our <a href="/affiliate-disclosure" className="text-primary hover:underline">Affiliate Disclosure</a> for full details.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">4. Accuracy of Information</h2>
                <p className="mt-2">We make reasonable efforts to ensure the accuracy of pricing, availability, and site information. However, third-party sites may change their pricing, content, or availability at any time without notice. We do not guarantee the accuracy of information displayed and recommend verifying details directly with the respective sites before subscribing.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">5. Third-Party Sites</h2>
                <p className="mt-2">This Site contains links to third-party websites. We are not responsible for the content, policies, or practices of any third-party site. Accessing third-party sites through our links is at your own risk. We encourage you to review the terms and privacy policies of any site you visit.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">6. Intellectual Property</h2>
                <p className="mt-2">All original content on TwinkVault — including review text, scores, site design, and editorial content — is the intellectual property of TwinkVault. You may not reproduce, distribute, or republish our content without written permission. Site names and trademarks referenced in our reviews are the property of their respective owners.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">7. Disclaimer of Warranties</h2>
                <p className="mt-2">This Site is provided "as is" without warranties of any kind, express or implied. We do not warrant that the Site will be error-free, uninterrupted, or free of viruses. Use of this Site is entirely at your own risk.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">8. Limitation of Liability</h2>
                <p className="mt-2">To the maximum extent permitted by law, TwinkVault shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of this Site or any third-party sites accessed through it.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">9. Geographic Restrictions</h2>
                <p className="mt-2">Adult content is regulated differently across jurisdictions. It is your responsibility to ensure that accessing adult content review sites is legal in your location. We do not make representations about the legality of our content in any specific jurisdiction.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">10. Changes to Terms</h2>
                <p className="mt-2">We reserve the right to update these Terms at any time. Continued use of the Site following any changes constitutes your acceptance of the revised Terms. We will update the "Last updated" date at the top of this page when changes are made.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">11. Contact</h2>
                <p className="mt-2">For questions about these Terms, contact us at <a href="mailto:hello@twinkvault.com" className="text-primary hover:underline">hello@twinkvault.com</a> or via our <a href="/contact" className="text-primary hover:underline">contact page</a>.</p>
              </section>

            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default Terms;
