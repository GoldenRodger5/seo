import { Helmet } from "react-helmet-async";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import { motion } from "framer-motion";

const Compliance2257 = () => (
  <Layout>
    <PageTransition>
      <Helmet>
        <title>18 U.S.C. 2257 Compliance Statement — TwinkVault</title>
        <meta name="description" content="TwinkVault 18 U.S.C. 2257 record-keeping requirements compliance statement." />
        <link rel="canonical" href="https://twinkvault.com/2257" />
      </Helmet>

      <section className="py-16">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">18 U.S.C. 2257 Statement</h1>
            <p className="mt-2 text-sm text-muted-foreground">Exemption Statement</p>

            <div className="mt-8 glass-card rounded-lg p-8 space-y-6 text-muted-foreground leading-relaxed">

              <p>
                TwinkVault.com is a review and affiliate marketing website. We do not produce, create, host, or distribute any sexually explicit visual content. We do not employ, hire, or contract with any performers.
              </p>

              <p>
                This website contains editorial reviews of, and affiliate links to, third-party adult content websites. All visual content depicted or linked from this Site is produced by third-party operators. TwinkVault is not the producer — primary or secondary — of any such content within the meaning of 18 U.S.C. § 2257 and 28 C.F.R. § 75.
              </p>

              <p>
                All performers depicted in content on the third-party websites we review are represented by those operators to be 18 years of age or older at the time of production. Records required pursuant to 18 U.S.C. § 2257 are maintained by the respective operators of those third-party websites.
              </p>

              <p>
                For 2257 compliance inquiries regarding any specific content, please contact the operators of the respective third-party website directly.
              </p>

              <p className="text-sm">
                For questions regarding this statement, contact us at <a href="mailto:hello@twinkvault.com" className="text-primary hover:underline">hello@twinkvault.com</a>.
              </p>

            </div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default Compliance2257;
