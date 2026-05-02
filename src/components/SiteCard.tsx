import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import OutboundLink from "./OutboundLink";
import ScoreRing from "./ScoreRing";
import LocalisedPrice from "./LocalisedPrice";
import type { SiteData } from "@/data/sites";
import { getBrandPalette } from "@/data/site-brands";
import { siteNicheMap } from "@/data/site-niches";
import { getNiche } from "@/data/niches";
import { getSiteImagery } from "@/data/site-imagery";

interface SiteCardProps {
  site: SiteData;
  variant?: "default" | "compact";
  showNiches?: boolean;
  rankBadge?: number | null;
  className?: string;
}

const updateLabel = (score: number): string => {
  if (score >= 85) return "Weekly updates";
  if (score >= 75) return "Bi-weekly updates";
  if (score >= 60) return "Monthly updates";
  return "Slow update pace";
};

const qualityLabel = (site: SiteData): string => {
  if (site.content_quality >= 90 && site.has_hd) return "HD/4K · Premium";
  if (site.has_hd) return "HD streaming";
  return "SD streaming";
};

const valueLabel = (site: SiteData): string => {
  if (site.deal_discount >= 50) return `${site.deal_discount}% off annual`;
  if (site.has_free_trial) return "Free trial available";
  if (site.value_score >= 85) return "Strong value pick";
  return `From ${site.price_annual}`;
};

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
  const imagery = getSiteImagery(site.slug);
  const heroImg = imagery.hero_image_url ?? imagery.thumbnail_url;

  // Hover tooltip (desktop) + long-press tooltip (mobile, 1.5s timeout)
  const [showTip, setShowTip] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 1500);
    }, 400);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
  useEffect(() => () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const tip = (
    <div
      className={`pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-button glass-card px-3 py-2 text-[11px] text-foreground shadow-lg transition-opacity duration-200 ${
        showTip ? "opacity-100" : "opacity-0"
      }`}
      role="tooltip"
    >
      <div className="whitespace-nowrap">
        {updateLabel(site.update_frequency)} · {qualityLabel(site)} · {valueLabel(site)}
      </div>
    </div>
  );

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ y: -3 }}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative overflow-hidden rounded-lg border border-border/60 bg-card p-4 transition-colors ${palette.accent} group ${className}`}
      >
        {tip}
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
      whileHover={{ y: -4, boxShadow: "0 8px 30px hsl(263, 70%, 58%, 0.15)" }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-hidden rounded-lg border border-border/60 bg-card transition-colors ${palette.accent} group flex flex-col h-full ${className}`}
    >
      {tip}
      {/* Hero image (when sourced from affiliate creative) — falls back to brand-color bar + watermark */}
      {heroImg ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/40">
          <img
            src={heroImg}
            alt={imagery.banner_alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${palette.gradient}`} />
        </div>
      ) : (
        <>
          <div className={`h-2 w-full bg-gradient-to-r ${palette.gradient}`} />
          <span
            className={`pointer-events-none absolute -right-6 -bottom-16 select-none font-heading text-[180px] font-black leading-none ${palette.watermark}`}
            aria-hidden
          >
            {watermarkLetter}
          </span>
        </>
      )}

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
          <LocalisedPrice usd={site.price_monthly} className="text-base font-bold" />
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
