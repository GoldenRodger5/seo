import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { SiteData, getVisitUrl, isAffiliated } from "../data/sites";
import { trackOutbound } from "../lib/analytics";
import { logClick } from "../lib/tracking";

interface OutboundLinkProps {
  site: SiteData;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const OutboundLink = ({ site, className, children, onClick }: OutboundLinkProps) => {
  const affiliated = isAffiliated(site);
  if (!affiliated) return null;

  const url = getVisitUrl(site);

  const handleClick = () => {
    const sourcePage = window.location.pathname;
    // First-party log → Supabase clicks table (drives /admin dashboard).
    logClick({
      sourcePage,
      destinationSlug: site.slug,
      destinationUrl: site.affiliate_url ?? site.homepage_url,
    });
    // GA4 event (legacy — kept for cross-validation against first-party data).
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
