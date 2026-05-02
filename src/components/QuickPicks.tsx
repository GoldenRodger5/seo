import { Flame, DollarSign, Gift, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import OutboundLink from "./OutboundLink";
import { sites } from "@/data/sites";
import type { SiteData } from "@/data/sites";
import ScoreRing from "./ScoreRing";
import { trackEvent } from "@/lib/analytics";
import { getSiteImagery } from "@/data/site-imagery";

interface Pick {
  intent: string;
  emoji: string;
  icon: typeof Flame;
  tagline: string;
  gradient: string;
  watermarkColor: string;
  iconBg: string;
  ring: string;
  site: SiteData;
}

const findSite = (slug: string): SiteData | undefined => sites.find((s) => s.slug === slug);

const pickHottestPremium = (): SiteData =>
  findSite("helix-studios") ??
  [...sites].sort((a, b) => b.overall_score - a.overall_score)[0];

const pickBestValue = (): SiteData => {
  // Highest deal_discount among sites that have an affiliate URL wired,
  // falling back to the highest-discount site overall.
  const withAffiliate = sites.filter((s) => s.affiliate_url && s.deal_discount > 0);
  if (withAffiliate.length) {
    return [...withAffiliate].sort((a, b) => b.deal_discount - a.deal_discount)[0];
  }
  return findSite("next-door-twink") ?? sites[0];
};

const pickFreeTrialOrFlashDeal = (): SiteData => {
  // True free-trial sites first, then highest deal_discount with affiliate.
  const trial = sites.find((s) => s.has_free_trial);
  if (trial) return trial;
  const flash = sites
    .filter((s) => s.affiliate_url && s.deal_type === "flash" && s.deal_discount > 0)
    .sort((a, b) => b.deal_discount - a.deal_discount)[0];
  if (flash) return flash;
  return findSite("athletic-twinks") ?? findSite("twinks-in-shorts") ?? sites[2];
};

const QuickPicks = () => {
  const picks: Pick[] = [
    {
      intent: "Hottest Premium",
      emoji: "🔥",
      icon: Flame,
      tagline: "Polished American twinks, cinematic productions, two decades of exclusives.",
      gradient: "from-orange-500/30 via-red-500/10 to-transparent",
      watermarkColor: "text-orange-400/[0.08]",
      iconBg: "bg-orange-500/20 text-orange-400",
      ring: "hover:border-orange-400/40",
      site: pickHottestPremium(),
    },
    {
      intent: "Best Value",
      emoji: "💸",
      icon: DollarSign,
      tagline: "Massive volume, full network access, best price-per-scene of any site we tested.",
      gradient: "from-emerald-500/30 via-teal-500/10 to-transparent",
      watermarkColor: "text-emerald-400/[0.08]",
      iconBg: "bg-emerald-500/20 text-emerald-400",
      ring: "hover:border-emerald-400/40",
      site: pickBestValue(),
    },
    {
      intent: "Hottest Deal",
      emoji: "🎁",
      icon: Gift,
      tagline: "Steepest active discount on a site that's actually worth subscribing to.",
      gradient: "from-blue-500/30 via-indigo-500/10 to-transparent",
      watermarkColor: "text-blue-400/[0.08]",
      iconBg: "bg-blue-500/20 text-blue-400",
      ring: "hover:border-blue-400/40",
      site: pickFreeTrialOrFlashDeal(),
    },
  ];

  return (
    <section className="py-12">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center sm:text-left"
        >
          <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block">
            Skip the Reading. Here's What You Actually Want.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Three picks for three moods. One click to the goods.
          </p>
        </motion.div>
        <div className="grid gap-5 md:grid-cols-3">
          {picks.map((pick, i) => {
            const Icon = pick.icon;
            const watermarkLetter = pick.site.name.charAt(0).toUpperCase();
            const imagery = getSiteImagery(pick.site.slug);
            const heroImg = imagery.hero_image_url ?? imagery.thumbnail_url;
            return (
              <motion.div
                key={pick.intent}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={`relative overflow-hidden rounded-lg border border-border/60 bg-card p-6 transition-colors ${pick.ring} group`}
              >
                {heroImg ? (
                  <>
                    <img
                      src={heroImg}
                      alt={imagery.banner_alt}
                      loading="lazy"
                      decoding="async"
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-300 group-hover:opacity-40"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/40" />
                  </>
                ) : (
                  <>
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${pick.gradient} opacity-80`}
                    />
                    <span
                      className={`pointer-events-none absolute -right-4 -bottom-12 select-none font-heading text-[180px] font-black leading-none ${pick.watermarkColor}`}
                      aria-hidden
                    >
                      {watermarkLetter}
                    </span>
                  </>
                )}

                <div className="relative flex flex-col gap-3 min-h-[260px]">
                  {/* Top row: icon + score */}
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${pick.iconBg}`}>
                      <Icon size={20} />
                    </span>
                    <ScoreRing score={pick.site.overall_score} size={44} />
                  </div>

                  {/* Intent + site name */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {pick.intent}
                    </span>
                    <h3 className="mt-1 font-heading text-2xl font-bold leading-tight">
                      {pick.site.name}
                    </h3>
                  </div>

                  {/* Tagline */}
                  <p className="text-sm text-muted-foreground line-clamp-3">{pick.tagline}</p>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* CTA */}
                  <OutboundLink
                    site={pick.site}
                    onClick={() => trackEvent("quick_pick_click", { intent: pick.intent, site_slug: pick.site.slug })}
                    className="cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-5 py-3 text-sm font-semibold text-secondary-foreground"
                  >
                    Visit Site <ArrowRight size={15} />
                  </OutboundLink>
                  <Link
                    to={`/reviews/${pick.site.slug}`}
                    className="text-center text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Read review →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuickPicks;
