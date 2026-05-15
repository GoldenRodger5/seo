import { Link } from "react-router-dom";
import { ReactNode, useEffect } from "react";
import { SiteData, getVisitUrl, isAffiliated } from "../data/sites";
import { trackOutbound } from "../lib/analytics";
import { logClick, logImpression } from "../lib/tracking";

interface OutboundLinkProps {
  site: SiteData;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const OutboundLink = ({ site, className, children, onClick }: OutboundLinkProps) => {
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
