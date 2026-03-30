import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { requestOverlay, releaseOverlay, useOverlaySlot } from "../hooks/useOverlayQueue";

const CookieConsent = () => {
  const [needed, setNeeded] = useState(false);
  const canShow = useOverlaySlot("cookie");

  useEffect(() => {
    const consent = localStorage.getItem("tv_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => {
        setNeeded(true);
        requestOverlay("cookie");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!needed || !canShow) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") decline();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [needed, canShow]);

  const accept = () => {
    localStorage.setItem("tv_cookie_consent", "accepted");
    setNeeded(false);
    releaseOverlay("cookie");
  };

  const decline = () => {
    localStorage.setItem("tv_cookie_consent", "declined");
    setNeeded(false);
    releaseOverlay("cookie");
  };

  const show = needed && canShow;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 z-[9996] sm:left-auto sm:right-6 sm:max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="glass-card rounded-lg p-5 shadow-2xl border border-primary/20">
            <div className="flex items-start gap-3">
              <Cookie size={20} className="text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">We use cookies</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  We use analytics cookies to understand traffic and affiliate cookies for link tracking. No personal data is sold.{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={accept}
                    className="flex-1 rounded-button gold-gradient px-4 py-2 text-xs font-semibold text-secondary-foreground"
                  >
                    Accept
                  </button>
                  <button
                    onClick={decline}
                    className="flex-1 rounded-button border border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
