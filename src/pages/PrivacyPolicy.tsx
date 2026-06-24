import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import AnimateOnScroll from "../components/AnimateOnScroll";

const PrivacyPolicy = () => (
  <Layout>
    <Helmet>
      <title>Privacy Policy &amp; Data Practices — TwinkVault</title>
      <meta name="description" content="TwinkVault privacy policy. Learn how we collect, use, and protect your data." />
      <link rel="canonical" href="https://twinkvault.com/privacy-policy" />
    </Helmet>

    <section className="py-16">
      <div className="container max-w-3xl">
        <AnimateOnScroll>
          <div className="stagger-in">
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">Privacy Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: March 2025</p>

            <div className="mt-8 glass-card rounded-lg p-8 space-y-8 text-muted-foreground leading-relaxed">

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">1. Information We Collect</h2>
                <p className="mt-2">We collect minimal personal information. Specifically:</p>
                <ul className="mt-2 list-disc list-inside space-y-1 pl-2">
                  <li><strong className="text-foreground">Email address</strong> — only if you voluntarily subscribe to our newsletter or contact us</li>
                  <li><strong className="text-foreground">Analytics data</strong> — anonymous usage data (pages visited, time on site) via analytics cookies</li>
                  <li><strong className="text-foreground">Click data</strong> — which affiliate links you click, stored without personal identifiers</li>
                  <li><strong className="text-foreground">Contact form data</strong> — name, email, and message if you submit a contact form</li>
                </ul>
                <p className="mt-2">We do not collect payment information, location data, or any sensitive personal data. We do not use tracking pixels or cross-site trackers.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">2. How We Use Your Information</h2>
                <ul className="mt-2 list-disc list-inside space-y-1 pl-2">
                  <li>Email addresses are used solely to send our monthly deals newsletter and to respond to contact requests</li>
                  <li>Analytics data is used to improve our site content and understand which reviews are most useful</li>
                  <li>Click data is used to measure which affiliate links perform well — this data is aggregated and not linked to individuals</li>
                </ul>
                <p className="mt-2">We never sell, rent, or share your personal data with third parties for marketing purposes.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">3. Cookies & Tracking</h2>
                <p className="mt-2">We use the following cookies:</p>
                <ul className="mt-2 list-disc list-inside space-y-1 pl-2">
                  <li><strong className="text-foreground">Essential cookies</strong> — age verification consent, cookie consent preference, email popup state. Required for site functionality.</li>
                  <li><strong className="text-foreground">Analytics cookies</strong> — anonymous traffic analytics. You can decline these via our cookie banner.</li>
                  <li><strong className="text-foreground">Affiliate tracking cookies</strong> — set by third-party affiliate networks when you click our links. These are set by the destination site, not by us.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">4. Third-Party Sites</h2>
                <p className="mt-2">Our site contains affiliate links to third-party adult content websites. When you click these links, you leave TwinkVault and enter the third party's site. We are not responsible for their privacy practices. We encourage you to review the privacy policy of any site you visit before providing personal information or payment details.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">5. Data Retention</h2>
                <p className="mt-2">Email addresses are retained until you unsubscribe. Contact form submissions are retained for 12 months. Analytics data is retained for 26 months. You can request deletion of your data at any time by contacting us.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">6. Your Rights (GDPR — EU/UK Users)</h2>
                <p className="mt-2">If you are located in the European Union or United Kingdom, you have the following rights under GDPR:</p>
                <ul className="mt-2 list-disc list-inside space-y-1 pl-2">
                  <li><strong className="text-foreground">Right of access</strong> — request a copy of the personal data we hold about you</li>
                  <li><strong className="text-foreground">Right to rectification</strong> — request correction of inaccurate data</li>
                  <li><strong className="text-foreground">Right to erasure</strong> — request deletion of your data ("right to be forgotten")</li>
                  <li><strong className="text-foreground">Right to restrict processing</strong> — request we limit how we use your data</li>
                  <li><strong className="text-foreground">Right to data portability</strong> — request your data in a machine-readable format</li>
                  <li><strong className="text-foreground">Right to object</strong> — object to processing based on legitimate interests</li>
                </ul>
                <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:privacy@twinkvault.com" className="text-primary hover:underline">privacy@twinkvault.com</a>. We will respond within 30 days.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">7. Your Rights (CCPA — California Users)</h2>
                <p className="mt-2">If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):</p>
                <ul className="mt-2 list-disc list-inside space-y-1 pl-2">
                  <li>The right to know what personal information we collect and how it is used</li>
                  <li>The right to delete personal information we have collected</li>
                  <li>The right to opt-out of the sale of personal information — <strong className="text-foreground">we do not sell personal information</strong></li>
                  <li>The right to non-discrimination for exercising your privacy rights</li>
                </ul>
                <p className="mt-2">To submit a CCPA request, contact us at <a href="mailto:privacy@twinkvault.com" className="text-primary hover:underline">privacy@twinkvault.com</a>.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">8. Children's Privacy</h2>
                <p className="mt-2">This site is intended for adults aged 18 and over. We do not knowingly collect personal information from anyone under 18. If we become aware that a minor has submitted personal data, we will delete it immediately.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">9. Security</h2>
                <p className="mt-2">We take reasonable technical measures to protect your personal information, including HTTPS encryption for all data in transit and secure storage via Supabase. No method of internet transmission is 100% secure, and we cannot guarantee absolute security.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">10. Changes to This Policy</h2>
                <p className="mt-2">We may update this Privacy Policy from time to time. We will update the "Last updated" date at the top. Continued use of the site after changes constitutes acceptance of the updated policy.</p>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-foreground">11. Contact</h2>
                <p className="mt-2">For all privacy-related requests: <a href="mailto:privacy@twinkvault.com" className="text-primary hover:underline">privacy@twinkvault.com</a></p>
              </section>

            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  </Layout>
);

export default PrivacyPolicy;
