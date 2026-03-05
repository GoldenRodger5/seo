import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteData, getVisitUrl } from "../data/sites";
import { MotionButton } from "./MotionWrappers";

interface VisitSiteButtonProps {
  site: SiteData;
  label?: string;
  className?: string;
  showDisclosure?: boolean;
}

const VisitSiteButton = ({ site, label = "Visit Site", className = "", showDisclosure = true }: VisitSiteButtonProps) => {
  const url = getVisitUrl(site);
  const affiliated = site.affiliate_url !== null;

  return (
    <div className={className}>
      <MotionButton className="w-full">
        <Link
          to={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`cta-btn inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground gold-gradient ${
            !affiliated ? "opacity-85" : ""
          }`}
        >
          {label} <ArrowRight size={14} />
        </Link>
      </MotionButton>
      {showDisclosure && (
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          Opens in new tab{affiliated ? " · Affiliate link" : ""}
        </p>
      )}
    </div>
  );
};

export default VisitSiteButton;
