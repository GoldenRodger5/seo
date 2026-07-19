import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSiteBySlug, sites, type SiteData } from "../data/sites";
import { requestOverlay, releaseOverlay, useOverlaySlot } from "../hooks/useOverlayQueue";
import { supabase } from "../integrations/supabase/client";
import LocalisedPrice from "./LocalisedPrice";

const trackEvent = (eventType: string, payload: Record<string, unknown> = {}): void => {
  // Fire-and-forget — never block UI on telemetry.
  supabase
    .from("clicks")
    .insert({
      site_slug: `exit_intent:${eventType}`,
      referrer_page: window.location.pathname,
      clicked_at: new Date().toISOString(),
      ...payload,
    } as never)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    .then(() => {}, () => {});
};

/** Pick a contextually relevant deal site based on the current route. */
const pickDealForPath = (pathname: string): SiteData => {
  const reviewMatch = pathname.match(/^\/reviews\/([^/?#]+)/);
  if (reviewMatch) {
    const s = getSiteBySlug(reviewMatch[1]);
    if (s && s.deal_discount > 0) return s;
  }
  const discountMatch = pathname.match(/^\/discount\/([^/?#]+)/);
  if (discountMatch) {
    const s = getSiteBySlug(discountMatch[1]);
    if (s) return s;
  }
  const compareMatch = pathname.match(/^\/compare\/([^/?#]+)-vs-([^/?#]+)/);
  if (compareMatch) {
    const a = getSiteBySlug(compareMatch[1]);
    const b = getSiteBySlug(compareMatch[2]);
    if (a && b) return a.overall_score >= b.overall_score ? a : b;
  }
  // Default: highest-scored monetized site with an active deal.
  const ranked = sites
    .filter((s) => s.affiliate_url && s.deal_discount > 0)
    .sort((a, b) => b.overall_score - a.overall_score);
  return ranked[0] ?? getSiteBySlug("next-door-twink") ?? sites[0];
};

const ExitIntentDealPopup = () => {
  const [needed, setNeeded] = useState(false);
  const canShow = useOverlaySlot("exitIntent");
  const location = useLocation();
  const deal = useMemo(() => pickDealForPath(location.pathname), [location.pathname]);

  useEffect(() => {
    // True exit-intent only, at most once a week. The old behavior (45s timer
    // + once per session) interrupted people mid-read and re-fired every
    // visit — the exact popup pattern review sites get roasted for.
    const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
    const last = Number(localStorage.getItem("tv_exit_popup_last") || 0);
    if (Date.now() - last < COOLDOWN_MS) return;
    if (location.pathname === "/best-deals") return; // page already pushes deal-alert email

    const trigger = () => {
      const lastNow = Number(localStorage.getItem("tv_exit_popup_last") || 0);
      if (Date.now() - lastNow < COOLDOWN_MS) return;
      localStorage.setItem("tv_exit_popup_last", String(Date.now()));
      setNeeded(true);
      requestOverlay("exitIntent");
      trackEvent("shown", { dealSlug: deal.slug });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    let lastTouchY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? 0;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      // Rapid scroll-up while at top of viewport → mobile exit intent
      if (window.scrollY < 50 && y - lastTouchY > 60) {
        trigger();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [location.pathname, deal.slug]);

  useEffect(() => {
    if (!needed || !canShow) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close("dismissed");
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [needed, canShow]);

  const close = (reason: "dismissed" | "converted" = "dismissed") => {
    trackEvent(reason, { dealSlug: deal.slug });
    setNeeded(false);
    releaseOverlay("exitIntent");
  };

  const show = needed && canShow;
  if (!show || !deal) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9997] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => close("dismissed")}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-deal-title"
        >
          <motion.div
            className="glass-card relative w-full max-w-md rounded-lg p-8 text-center"
            style={{ boxShadow: "0 0 40px hsl(263, 70%, 58%, 0.3)" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="exit-deal-title" className="font-heading text-2xl font-bold">Before You Go</h3>
            <p className="mt-3 text-muted-foreground">
              <span className="font-semibold text-foreground">{deal.name}</span>
              {deal.deal_discount > 0 ? ` is currently ${deal.deal_discount}% off.` : " is one of our top-rated picks."}
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400"><LocalisedPrice usd={deal.price_annual} /> annual</p>
            <p className="text-sm text-muted-foreground">{deal.short_description.split(".")[0]}</p>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to={`/discount/${deal.slug}`}
                className="cta-btn mt-6 flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
                onClick={() => close("converted")}
              >
                View This Deal <ArrowRight size={14} />
              </Link>
            </motion.div>
            <p className="mt-2 text-[10px] text-muted-foreground">Links to discount page</p>

            <button
              onClick={() => close("dismissed")}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              No thanks, I'll pay full price
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentDealPopup;
