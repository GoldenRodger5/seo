import { Link } from "react-router-dom";
import { ReactNode } from "react";
import { SiteData, getVisitUrl, isAffiliated } from "../data/sites";

interface OutboundLinkProps {
  site: SiteData;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

/**
 * Smart link component that routes correctly:
 * - Affiliated sites → internal /go/slug (opens in same tab, GoRedirect handles new-tab)
 * - Non-affiliated sites → external URL via <a> with target="_blank"
 */
const OutboundLink = ({ site, className, children, onClick }: OutboundLinkProps) => {
  const url = getVisitUrl(site);
  const affiliated = isAffiliated(site);

  if (affiliated) {
    return (
      <Link to={url} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
      {children}
    </a>
  );
};

export default OutboundLink;
