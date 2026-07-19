import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";

const StickyDealBar = () => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("tv_deal_bar_dismissed") === "1"
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("tv_deal_bar_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="relative z-50 gold-gradient">
      {/* py-1 on the outer band; the dismiss button below grows the
          tap area to 44×44 (WCAG min) without inflating the bar height. */}
      <div className="container flex items-center justify-center gap-2 py-2 pr-12 text-xs font-semibold text-secondary-foreground sm:text-sm">
        <span className="hidden sm:inline">Active Deal: TwinkTrade, 67% off. Just $9.95/mo on annual</span>
        <span className="sm:hidden">TwinkTrade: 67% off, $9.95/mo</span>
        <Link
          to="/discount/twinktrade"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80"
        >
          View Deal <ArrowRight size={12} />
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded text-secondary-foreground/90 hover:bg-secondary-foreground/10 active:bg-secondary-foreground/20"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default StickyDealBar;
