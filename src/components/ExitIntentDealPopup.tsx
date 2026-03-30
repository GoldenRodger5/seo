import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSiteBySlug } from "../data/sites";

const ExitIntentDealPopup = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("tv_exit_popup_shown")) return;

    // Desktop: mouse leaves top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem("tv_exit_popup_shown")) {
        sessionStorage.setItem("tv_exit_popup_shown", "1");
        setShow(true);
      }
    };

    // Mobile: 45 second timer
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem("tv_exit_popup_shown")) {
        sessionStorage.setItem("tv_exit_popup_shown", "1");
        setShow(true);
      }
    }, 45000);

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShow(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [show]);

  const deal = getSiteBySlug("next-door-twink");
  if (!show || !deal) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9997] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
        >
          <motion.div
            className="glass-card relative w-full max-w-md rounded-lg p-8 text-center"
            style={{ boxShadow: "0 0 40px hsl(263, 70%, 58%, 0.3)" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-4xl">👀</span>
            <h3 className="mt-4 font-heading text-2xl font-bold">Wait — This Week's Best Deal</h3>
            <p className="mt-3 text-muted-foreground">
              <span className="font-semibold text-foreground">{deal.name}</span> — 3-day trial, then access to 15 sites
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">$2.95 trial</p>
            <p className="text-sm text-muted-foreground">Then {deal.price_monthly} — cancel anytime</p>

            <MotionButtonWrap>
              <Link
                to="/go/next-door-twink"
                className="cta-btn mt-6 flex w-full items-center justify-center gap-2 rounded-button gold-gradient px-6 py-3 text-sm font-semibold text-secondary-foreground"
                onClick={() => setShow(false)}
              >
                Claim This Deal <ArrowRight size={14} />
              </Link>
            </MotionButtonWrap>
            <p className="mt-2 text-[10px] text-muted-foreground">Opens in new tab · Affiliate link</p>

            <button
              onClick={() => setShow(false)}
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

const MotionButtonWrap = ({ children }: { children: React.ReactNode }) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
    {children}
  </motion.div>
);

export default ExitIntentDealPopup;
