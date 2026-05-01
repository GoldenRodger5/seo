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
  const url = getVisitUrl(site);
  const affiliated = isAffiliated(site);

  const handleClick = () => {
    trackOutbound(site.slug, affiliated, window.location.pathname);
    onClick?.();
  };

  if (affiliated) {
    return (
      <Link to={url} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick}>
      {children}
    </a>
  );
};

export default OutboundLink;
