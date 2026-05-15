import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OutboundLink from "./OutboundLink";
import { isAffiliated, type SiteData } from "../data/sites";
import type { CtaPosition } from "../lib/tracking";

interface DualCTAButtonsProps {
  site: SiteData;
  /** Override the Visit button label. Default "Visit Site". */
  visitLabel?: string;
  /** Optional source_type override for click tracking. */
  sourceTypeOverride?: string;
  /** Where on the page this CTA lives — populates clicks.cta_position. */
  ctaPosition?: CtaPosition;
  /** Stretch buttons to fill container. Default true. */
  fill?: boolean;
  className?: string;
}

/**
 * Always renders BOTH a "Read Review" link and a "Visit Site" button.
 * For affiliated sites the Visit Site button routes through OutboundLink
 * → /go/{slug} (logged in clicks/impressions). For non-affiliated sites
 * it falls back to a plain external link to the site's homepage_url so
 * users still have a way out — without faking an affiliate relationship.
 *
 * Used by /reviews and /ask-ai recommendation cards to ensure every
 * high-intent surface has both an exploration and a conversion path.
 */
const DualCTAButtons = ({ site, visitLabel = "Visit Site", sourceTypeOverride, ctaPosition, fill = true, className = "" }: DualCTAButtonsProps) => {
  const affiliated = isAffiliated(site);
  const flexClass = fill ? "flex-1" : "";

  return (
    <div className={`flex gap-2 ${className}`}>
      <Link
        to={`/reviews/${site.slug}`}
        className={`${flexClass} rounded-button border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors`}
      >
        Read Review
      </Link>
      {affiliated ? (
        <OutboundLink
          site={site}
          sourceTypeOverride={sourceTypeOverride}
          ctaPosition={ctaPosition}
          className={`${flexClass} cta-btn gold-gradient inline-flex items-center justify-center gap-2 rounded-button px-4 py-2 text-sm font-semibold text-secondary-foreground`}
        >
          {visitLabel} <ArrowRight size={13} />
        </OutboundLink>
      ) : (
        <a
          href={site.homepage_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${flexClass} cta-btn gold-gradient inline-flex items-center justify-center gap-2 rounded-button px-4 py-2 text-sm font-semibold text-secondary-foreground`}
        >
          {visitLabel} <ArrowRight size={13} />
        </a>
      )}
    </div>
  );
};

export default DualCTAButtons;
