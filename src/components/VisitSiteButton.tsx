import { ArrowRight } from "lucide-react";
import { SiteData, isAffiliated } from "../data/sites";
import { MotionButton } from "./MotionWrappers";
import OutboundLink from "./OutboundLink";

interface VisitSiteButtonProps {
  site: SiteData;
  label?: string;
  className?: string;
  showDisclosure?: boolean;
}

const VisitSiteButton = ({ site, label = "Visit Site", className = "", showDisclosure = true }: VisitSiteButtonProps) => {
  if (!isAffiliated(site)) return null;

  return (
    <div className={className}>
      <MotionButton className="w-full">
        <OutboundLink
          site={site}
          className="cta-btn inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground gold-gradient"
        >
          {label} <ArrowRight size={14} />
        </OutboundLink>
      </MotionButton>
      {showDisclosure && (
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          Opens in new tab · Partner link
        </p>
      )}
    </div>
  );
};

export default VisitSiteButton;
