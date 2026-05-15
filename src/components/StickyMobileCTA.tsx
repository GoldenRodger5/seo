import { useEffect, useRef, useState } from "react";
import { ArrowRight, X as XIcon } from "lucide-react";
import OutboundLink from "./OutboundLink";
import type { SiteData } from "@/data/sites";
import { isAffiliated } from "@/data/sites";

interface StickyMobileCTAProps {
  site: SiteData;
  /** Px scrolled before bar first reveals. Default 400. */
  revealAfter?: number;
}

/**
 * Mobile-only sticky bar that surfaces a persistent affiliate CTA below
 * the fold without competing with the user's reading. Visible only when
 * scrolling DOWN past `revealAfter`. Hides when scrolling up so it
 * doesn't interrupt back-reading.
 *
 * Clicks log with source_type='sticky_mobile_cta' so the admin dashboard
 * can measure the bar's specific conversion contribution vs in-flow CTAs.
 */
const StickyMobileCTA = ({ site, revealAfter = 400 }: StickyMobileCTAProps) => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastYRef.current;
      lastYRef.current = y;
      if (y < revealAfter) {
        setShow(false);
        return;
      }
      setShow(goingDown);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealAfter]);

  if (!show || dismissed) return null;
  if (!isAffiliated(site)) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border glass-card lg:hidden animate-slide-up"
      style={{
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingTop: "12px",
        paddingLeft: "12px",
        paddingRight: "12px",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground shrink-0 p-2 -m-2"
          aria-label="Dismiss sticky CTA"
        >
          <XIcon size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{site.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary">{site.overall_score}/5</span>
            {site.deal_discount > 0 && (
              <span className="rounded-button bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                −{site.deal_discount}%
              </span>
            )}
          </div>
        </div>
        <OutboundLink
          site={site}
          sourceTypeOverride="sticky_mobile_cta"
          ctaPosition="sticky-mobile"
          className="cta-btn flex items-center gap-2 rounded-button gold-gradient px-5 py-2.5 text-sm font-semibold text-secondary-foreground whitespace-nowrap min-h-[44px]"
        >
          {site.deal_discount > 0 ? "Get Deal" : "Visit Site"} <ArrowRight size={14} />
        </OutboundLink>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
