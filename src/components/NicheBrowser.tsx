import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { sites } from "@/data/sites";
import { FEATURED_NICHE_SLUGS, getNiche } from "@/data/niches";
import { siteNicheMap } from "@/data/site-niches";
import { trackEvent } from "@/lib/analytics";

const nicheBannerMap: Record<string, string> = {
  twink: "/site-banners/twinks-in-shorts-hero.jpg",
  bareback: "/site-banners/bareback-that-hole-hero.jpg",
  daddy: "/site-banners/daddy-on-twink-hero.jpg",
  bear: "/site-banners/bear-films-hero.jpg",
  asian: "/site-banners/peterfever-hero.jpg",
  latin: "/site-banners/latin-leche-hero.jpg",
  college: "/site-banners/boys-at-camp-hero.jpg",
  military: "/site-banners/military-dick-hero.jpg",
  british: "/site-banners/hard-brit-lads-hero.jpg",
  amateur: "/site-banners/southern-strokes-hero.jpg",
  muscle: "/site-banners/athletic-twinks-hero.jpg",
  alternative: "/site-banners/alternadudes-hero.jpg",
  "big-dick": "/site-banners/rawhole-hero.jpg",
  jock: "/site-banners/athletic-twinks-hero.jpg",
};

const MIN_SITES_FOR_MAIN_GRID = 3;

const NicheBrowser = () => {
  const [showMore, setShowMore] = useState(false);

  const allTiles = FEATURED_NICHE_SLUGS.map((slug) => {
    const niche = getNiche(slug);
    if (!niche) return null;
    const count = sites.filter((s) =>
      (siteNicheMap[s.slug] ?? []).includes(slug)
    ).length;
    return { niche, count };
  }).filter((t): t is NonNullable<typeof t> => Boolean(t));

  // Main grid: ≥3 sites. Sparse (1-2 sites) tucked into an expandable footer
  // so the homepage doesn't show "1 site" empty-looking tiles.
  const mainTiles = allTiles.filter((t) => t.count >= MIN_SITES_FOR_MAIN_GRID);
  const sparseTiles = allTiles.filter((t) => t.count > 0 && t.count < MIN_SITES_FOR_MAIN_GRID);

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
          {mainTiles.map(({ niche, count }, i) => {
            const banner = nicheBannerMap[niche.slug];
            return (
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
                  className="relative block overflow-hidden rounded-lg border border-border/60 bg-card p-5 min-h-[120px] transition-colors hover:border-primary/40 group"
                >
                  {banner ? (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          backgroundImage: `url(${banner})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          filter: "blur(2px)",
                          transform: "scale(1.05)",
                        }}
                        aria-hidden
                      />
                      <div className="pointer-events-none absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/40" />
                    </>
                  ) : (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-card to-muted/40" />
                  )}
                  <div className="relative flex flex-col h-full">
                    <h3 className="font-heading text-lg font-bold leading-tight text-white drop-shadow">
                      {niche.displayName}
                    </h3>
                    <span className="mt-auto text-xs text-white/80">
                      {count} {count === 1 ? "site" : "sites"}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {sparseTiles.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={showMore}
            >
              {showMore ? "Hide" : "Show"} {sparseTiles.length} more categories
              <ChevronDown size={12} className={`transition-transform ${showMore ? "rotate-180" : ""}`} />
            </button>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex flex-wrap justify-center gap-2"
              >
                {sparseTiles.map(({ niche, count }) => (
                  <Link
                    key={niche.slug}
                    to={`/niche/${niche.slug}`}
                    onClick={() => trackEvent("niche_click", { niche: niche.slug })}
                    className="rounded-button border border-border/60 bg-card px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {niche.displayName} <span className="text-muted-foreground">({count})</span>
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default NicheBrowser;
