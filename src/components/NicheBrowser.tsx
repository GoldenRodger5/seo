import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { sites } from "@/data/sites";
import { FEATURED_NICHE_SLUGS, getNiche } from "@/data/niches";
import { siteNicheMap } from "@/data/site-niches";
import { trackEvent } from "@/lib/analytics";

const tileGradients = [
  "from-orange-500/30 to-red-500/10",
  "from-rose-500/30 to-pink-500/10",
  "from-amber-500/30 to-yellow-500/10",
  "from-emerald-500/30 to-teal-500/10",
  "from-purple-500/30 to-fuchsia-500/10",
  "from-blue-500/30 to-indigo-500/10",
  "from-cyan-500/30 to-sky-500/10",
  "from-lime-500/30 to-green-500/10",
  "from-pink-500/30 to-rose-500/10",
  "from-violet-500/30 to-purple-500/10",
  "from-yellow-500/30 to-amber-500/10",
  "from-red-500/30 to-orange-500/10",
];

const NicheBrowser = () => {
  const tiles = FEATURED_NICHE_SLUGS.map((slug) => {
    const niche = getNiche(slug);
    if (!niche) return null;
    const count = sites.filter((s) =>
      (siteNicheMap[s.slug] ?? []).includes(slug)
    ).length;
    return { niche, count };
  }).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <section className="py-16">
      <div className="container">
        <motion.div
          className="mb-8 text-center sm:text-left"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">
            Browse by What You're Into
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a niche. We'll show you every site we've tested in it.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map(({ niche, count }, i) => (
            <motion.div
              key={niche.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
            >
              <Link
                to={`/niche/${niche.slug}`}
                onClick={() => trackEvent("niche_click", { niche: niche.slug })}
                className={`relative block overflow-hidden rounded-lg border border-border/60 bg-card p-5 min-h-[120px] transition-colors hover:border-primary/40 group`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tileGradients[i % tileGradients.length]} opacity-80`}
                />
                <div className="relative flex flex-col h-full">
                  <span className="text-3xl">{niche.emoji}</span>
                  <h3 className="mt-2 font-heading text-lg font-bold leading-tight">
                    {niche.displayName}
                  </h3>
                  <span className="mt-auto text-xs text-muted-foreground">
                    {count} {count === 1 ? "site" : "sites"}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NicheBrowser;
