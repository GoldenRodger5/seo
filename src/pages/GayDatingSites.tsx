import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Layout from "../components/Layout";
import { PageTransition, MotionCard, StaggerContainer, StaggerChild } from "../components/MotionWrappers";
import { CRAK_URL, trackCrakClick, MANFINDER_URL, trackManfinderClick } from "@/lib/crak";
import { currentYear } from "../lib/dates";

const GayDatingSites = () => (
  <Layout>
    <Helmet>
      <title>{`Best Gay Dating Sites ${currentYear} — Find Men Near You | TwinkVault`}</title>
      <meta
        name="description"
        content={`Find the best gay dating and hookup sites in ${currentYear}. Meet gay men near you — compare options, read reviews, and connect.`}
      />
      <link rel="canonical" href="https://twinkvault.com/gay-dating-sites" />
      <meta property="og:title" content={`Best Gay Dating Sites ${currentYear} — Find Men Near You | TwinkVault`} />
      <meta property="og:description" content={`Find the best gay dating and hookup sites in ${currentYear}. Meet gay men near you — compare options and connect.`} />
      <meta property="og:url" content="https://twinkvault.com/gay-dating-sites" />
    </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://twinkvault.com/" },
          { "@type": "ListItem", position: 2, name: "Gay Dating Sites", item: "https://twinkvault.com/gay-dating-sites" },
        ]
      }) }} />

    <PageTransition>
      {/* Hero */}
      <section className="hero-mesh py-16">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="font-heading text-4xl font-bold md:text-5xl heading-gradient inline-block">
              Best Gay Dating Sites {currentYear}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Content memberships are one thing. Actually meeting gay men near you is another. These are the best gay dating and hookup sites right now.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Offers */}
      <section className="py-12">
        <div className="container">
          <StaggerContainer className="grid gap-6 md:grid-cols-2">

            {/* Manfinder — featured, free angle */}
            <StaggerChild>
              <MotionCard className="glass-card rounded-lg p-8 flex flex-col h-full border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">💚</span>
                  <div>
                    <span className="rounded-button bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                      Free to Join
                    </span>
                  </div>
                </div>
                <h2 className="mt-4 font-heading text-2xl font-bold">Manfinder</h2>
                <p className="mt-2 text-muted-foreground">
                  Manfinder is one of the most popular gay dating and hookup platforms — and it's free to join. Create a profile, browse gay men in your area, send messages, and connect without a subscription.
                </p>
                <ul className="mt-4 space-y-2 flex-1">
                  {[
                    "Free to create a profile",
                    "Browse gay men near you",
                    "No credit card required to start",
                    "Active community across major cities",
                    "Hookups, dates, and relationships",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="shrink-0 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={MANFINDER_URL}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => trackManfinderClick("/gay-dating-sites")}
                  className="cta-btn gold-gradient mt-6 inline-flex items-center justify-center gap-2 rounded-button px-8 py-3 text-sm font-semibold text-secondary-foreground"
                >
                  Join Manfinder Free <ArrowRight size={15} />
                </a>
                <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
                  Free to join · Partner link · Adult content
                </p>
              </MotionCard>
            </StaggerChild>

            {/* CrakRevenue Gay Smartlink */}
            <StaggerChild>
              <MotionCard className="glass-card rounded-lg p-8 flex flex-col h-full">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🔍</span>
                  <div>
                    <span className="rounded-button bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                      Compare Options
                    </span>
                  </div>
                </div>
                <h2 className="mt-4 font-heading text-2xl font-bold">Gay Dating & Hookup Sites</h2>
                <p className="mt-2 text-muted-foreground">
                  Not sure which gay dating site is right for you? Browse a hand-picked lineup of the top gay hookup and dating platforms. Filter by location, what you're looking for, and how fast you want to connect.
                </p>
                <ul className="mt-4 space-y-2 flex-1">
                  {[
                    "Compare multiple platforms at once",
                    "Filter by location and preference",
                    "Options for hookups and serious dating",
                    "Verified active communities",
                    "No commitment — see all options first",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={CRAK_URL}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => trackCrakClick("/gay-dating-sites")}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-button border border-primary px-8 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  Find Local Guys <ArrowRight size={15} />
                </a>
                <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
                  Sponsored · Partner link · Adult content
                </p>
              </MotionCard>
            </StaggerChild>
          </StaggerContainer>
        </div>
      </section>

      {/* Body copy — SEO */}
      <section className="py-12 border-t border-border">
        <div className="container max-w-3xl">
          <motion.div
            className="prose prose-invert max-w-none space-y-6 text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-2xl font-bold text-foreground heading-gradient inline-block">
              Gay Dating Sites vs. Content Memberships — What's the Difference?
            </h2>
            <p>
              Gay content sites like Helix Studios or NakedSword are built for watching. Gay dating sites are built for connecting. Both serve real needs, but they're not the same product.
            </p>
            <p>
              If you want to meet gay men near you — for hookups, dates, or something more — a dating platform is the right tool. The best ones let you browse profiles by location, message directly, and filter by what you're looking for. Manfinder is free to join and one of the most active in this space.
            </p>
            <h2 className="font-heading text-2xl font-bold text-foreground heading-gradient inline-block">
              What Makes a Good Gay Dating Site in {currentYear}?
            </h2>
            <p>
              The best gay dating sites share a few key traits: a large active user base in your area, genuine privacy controls, and matching tools that don't bury you in noise. Free-to-join platforms like Manfinder lower the barrier to entry — you can browse before committing to anything.
            </p>
            <p>
              For hookups specifically, look for platforms with real-time activity signals, proximity-based browsing, and direct messaging. For dating, prioritise profile depth and filtering by relationship intent.
            </p>
            <h2 className="font-heading text-2xl font-bold text-foreground heading-gradient inline-block">
              Are Gay Dating Sites Safe?
            </h2>
            <p>
              Reputable gay dating platforms use email verification, moderation teams, and reporting tools to keep communities safe. As with any online platform, use common sense: don't share personal details until you're comfortable, and meet in public first. The sites listed above are established platforms with active user communities and standard safety infrastructure.
            </p>
            <p className="text-xs text-muted-foreground/70">
              TwinkVault earns commissions from some links on this page. This does not affect our recommendations. All links are to 18+ adult platforms — you must be of legal age in your jurisdiction to use these services.
            </p>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  </Layout>
);

export default GayDatingSites;
