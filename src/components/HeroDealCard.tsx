import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OutboundLink from "./OutboundLink";
import LocalisedPrice from "./LocalisedPrice";
import type { SiteData } from "../data/sites";
import { getVerificationDisplay } from "../lib/dealVerification";

export type HeroBadge = "editor" | "savings" | "popular";

const BADGE_LABEL: Record<HeroBadge, string> = {
  editor: "Editor's Pick",
  savings: "Biggest Savings",
  popular: "Most Popular",
};

const BADGE_BORDER: Record<HeroBadge, string> = {
  editor: "border-t-secondary",
  savings: "border-t-emerald-500",
  popular: "border-t-primary",
};

interface HeroDealCardProps {
  site: SiteData;
  badge: HeroBadge;
  /** Tag derived from the site's primary category (Premium / Network / Amateur / etc.) */
  categoryTag?: string;
}

/**
 * Hero-tier card for /best-deals. Discount is the headline (visual anchor),
 * site name secondary, score + category tag in the metadata row, single
 * Visit CTA, and an honest verification-date line below.
 */
const HeroDealCard = ({ site, badge, categoryTag = "Site" }: HeroDealCardProps) => {
  const verification = getVerificationDisplay(site.deal_last_verified);
  return (
    <div className={`glass-card rounded-lg p-6 flex flex-col border-t-2 ${BADGE_BORDER[badge]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
        {BADGE_LABEL[badge]}
      </p>
      <p className="mt-3 font-heading text-4xl md:text-5xl font-bold text-emerald-400 tabular-nums">
        −{site.deal_discount}% OFF
      </p>
      <h3 className="mt-2 font-heading text-xl font-bold">{site.name}</h3>
      <p className="mt-2 text-sm">
        <LocalisedPrice usd={site.price_annual} className="font-semibold text-foreground" />{" "}
        <span className="text-muted-foreground">·</span>{" "}
        <LocalisedPrice usd={site.price_monthly} className="text-xs text-muted-foreground line-through" />
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Score: <span className="text-secondary font-semibold">{site.overall_score}/5</span>
        <span className="mx-2 text-muted-foreground/40">·</span>
        {categoryTag}
      </p>
      <div className="flex-1" />
      <OutboundLink
        site={site}
        ctaPosition="card"
        sourceTypeOverride="best_deals_hero_card"
        className="mt-5 cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-5 py-3 text-sm font-semibold text-secondary-foreground"
      >
        Visit {site.name} <ArrowRight size={14} />
      </OutboundLink>
      {verification.show && (
        <p className={`mt-3 text-[11px] ${verification.caveat ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
          {verification.text}
        </p>
      )}
      <Link
        to={`/discount/${site.slug}`}
        className="mt-2 text-[11px] font-medium text-secondary hover:underline underline-offset-4"
      >
        Full deal details →
      </Link>
    </div>
  );
};

export default HeroDealCard;
