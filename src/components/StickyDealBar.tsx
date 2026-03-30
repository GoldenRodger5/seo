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
    <div className="relative z-50 gold-gradient py-2">
      <div className="container flex items-center justify-center gap-2 text-xs font-semibold text-secondary-foreground sm:text-sm">
        <span className="hidden sm:inline">🔥 This Week's Best Deal: Next Door Twink — 3-Day Trial for $2.95</span>
        <span className="sm:hidden">🔥 Next Door Twink — Trial $2.95</span>
        <Link
          to="/go/next-door-twink"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80"
        >
          Claim Now <ArrowRight size={12} />
        </Link>
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-secondary-foreground/10"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default StickyDealBar;
