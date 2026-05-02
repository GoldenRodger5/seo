import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { SiteData, getVisitUrl, isAffiliated } from "../data/sites";
import { trackOutbound } from "../lib/analytics";

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
    trackOutbound(site.slug, true, window.location.pathname);
    onClick?.();
  };

  return (
    <Link to={url} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

export default OutboundLink;
