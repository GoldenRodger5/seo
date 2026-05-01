import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import OutboundLink from "./OutboundLink";
import ScoreRing from "./ScoreRing";
import type { SiteData } from "@/data/sites";
import { getBrandPalette } from "@/data/site-brands";
import { siteNicheMap } from "@/data/site-niches";
import { getNiche } from "@/data/niches";

interface SiteCardProps {
  site: SiteData;
  variant?: "default" | "compact";
  showNiches?: boolean;
  rankBadge?: number | null;
  className?: string;
}

const SiteCard = ({
  site,
  variant = "default",
  showNiches = true,
  rankBadge = null,
  className = "",
}: SiteCardProps) => {
  const palette = getBrandPalette(site.slug);
  const watermarkLetter = site.name.charAt(0).toUpperCase();
  const niches = (siteNicheMap[site.slug] ?? []).slice(0, 3);

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ y: -3 }}
        className={`relative overflow-hidden rounded-lg border border-border/60 bg-card p-4 transition-colors ${palette.accent} group ${className}`}
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${palette.gradient}`} />
        <span className={`pointer-events-none absolute -right-3 -bottom-8 select-none font-heading text-[120px] font-black leading-none ${palette.watermark}`} aria-hidden>
          {watermarkLetter}
        </span>
        <div className="relative flex items-start gap-3">
          <ScoreRing score={site.overall_score} size={48} />
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-semibold truncate">{site.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{site.short_description}</p>
            <OutboundLink site={site} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Visit Site <ArrowRight size={12} />
            </OutboundLink>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-lg border border-border/60 bg-card transition-colors ${palette.accent} group flex flex-col h-full ${className}`}
    >
      {/* Brand color header bar */}
      <div className={`h-2 w-full bg-gradient-to-r ${palette.gradient}`} />

      {/* Watermark */}
      <span
        className={`pointer-events-none absolute -right-6 -bottom-16 select-none font-heading text-[180px] font-black leading-none ${palette.watermark}`}
        aria-hidden
      >
        {watermarkLetter}
      </span>

      {rankBadge !== null && (
        <span className="absolute top-3 right-3 rounded-button gold-gradient px-2.5 py-1 text-[10px] font-bold text-secondary-foreground z-10">
          #{rankBadge}
        </span>
      )}

      <div className="relative flex flex-col flex-1 p-5 gap-3">
        {/* Top row: name + score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-bold leading-tight truncate">{site.name}</h3>
            {site.badge && (
              <span className="mt-1 inline-block rounded-button bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {site.badge}
              </span>
            )}
          </div>
          <ScoreRing score={site.overall_score} size={52} />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">{site.short_description}</p>

        {/* Niches */}
        {showNiches && niches.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {niches.map((nslug) => {
              const n = getNiche(nslug);
              if (!n) return null;
              return (
                <Link
                  key={nslug}
                  to={`/niche/${nslug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-button bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                >
                  {n.displayName}
                </Link>
              );
            })}
          </div>
        )}

        {/* Pricing strip */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base font-bold">{site.price_monthly}</span>
          {site.deal_discount > 0 && (
            <span className="rounded-button bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
              Save {site.deal_discount}%
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <OutboundLink
          site={site}
          className="cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-4 py-2.5 text-sm font-semibold text-secondary-foreground"
        >
          Visit Site <ArrowRight size={14} />
        </OutboundLink>
        <Link
          to={`/reviews/${site.slug}`}
          className="text-center text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          Read review →
        </Link>
      </div>
    </motion.div>
  );
};

export default SiteCard;
