import { Link } from "react-router-dom";
import { ReactNode, useEffect } from "react";
import { SiteData, getVisitUrl, isAffiliated } from "../data/sites";
import { trackOutbound } from "../lib/analytics";
import { logClick, logImpression, type CtaPosition } from "../lib/tracking";

interface OutboundLinkProps {
  site: SiteData;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  /**
   * Optional source_type override for the click row — used by
   * surface-specific CTAs (e.g. "sticky_mobile_cta", "mid_review_cta")
   * to distinguish clicks by UI affordance, not just page path.
   * @deprecated prefer ctaPosition for new code.
   */
  sourceTypeOverride?: string;
  /** Where on the page this CTA lives — populates clicks.cta_position. */
  ctaPosition?: CtaPosition;
}

const OutboundLink = ({ site, className, children, onClick, sourceTypeOverride, ctaPosition }: OutboundLinkProps) => {
  const affiliated = isAffiliated(site);

  // Log an impression on mount. Deduped per (session, page, destination)
  // inside logImpression — same link rendered twice in one session only
  // counts once. This is the denominator for CTR-per-destination.
  useEffect(() => {
    if (!affiliated || typeof window === "undefined") return;
    logImpression({
      sourcePage: window.location.pathname,
      destinationSlug: site.slug,
    });
  }, [site.slug, affiliated]);

  if (!affiliated) return null;

  const url = getVisitUrl(site);

  const handleClick = () => {
    const sourcePage = window.location.pathname;
    logClick({
      sourcePage,
      destinationSlug: site.slug,
      destinationUrl: site.affiliate_url ?? site.homepage_url,
      sourceTypeOverride,
      ctaPosition,
    });
    trackOutbound(site.slug, true, sourcePage);
    onClick?.();
  };

  return (
    <Link to={url} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

export default OutboundLink;
