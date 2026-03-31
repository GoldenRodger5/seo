import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { requestOverlay, releaseOverlay, useOverlaySlot } from "../hooks/useOverlayQueue";

// Simple HMAC-like token so the flag can't be set from the console with a plain string.
// This is NOT cryptographic security — it's a speed bump against casual bypass.
const SALT = "tv_ag3_2024";
function ageToken(): string {
  const day = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const str = SALT + day;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `v:${Math.abs(hash).toString(36)}`;
}

function isAgeVerified(): boolean {
  const stored = localStorage.getItem("age_verified");
  if (!stored) return false;
  // Accept legacy "true" value for existing users
  if (stored === "true") return true;
  // Accept today's token or yesterday's (covers midnight edge)
  const today = ageToken();
  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    let h = 0; const s = SALT + d.toISOString().slice(0, 10);
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return `v:${Math.abs(h).toString(36)}`;
  })();
  return stored === today || stored === yesterday;
}

const AgeVerification = () => {
  const [needed, setNeeded] = useState(false);
  const canShow = useOverlaySlot("age");

  useEffect(() => {
    if (!isAgeVerified()) {
      setNeeded(true);
      requestOverlay("age");
    }
  }, []);

  const handleYes = () => {
    localStorage.setItem("age_verified", ageToken());
    setNeeded(false);
    releaseOverlay("age");
  };

  const handleNo = () => {
    window.location.href = "https://www.google.com";
  };

  useEffect(() => {
    if (!needed || !canShow) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleNo();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [needed, canShow]);

  const show = needed && canShow;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-title"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 w-full max-w-md rounded-lg border border-card-border bg-card p-8 text-center shadow-2xl"
          >
            <h2 id="age-title" className="font-heading text-2xl font-bold">Age Verification</h2>
            <p className="mt-3 text-muted-foreground">
              This website contains adult content. You must be 18 years or older to enter.
            </p>
            <p className="mt-4 text-lg font-medium">Are you 18 or older?</p>
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleYes}
                autoFocus
                className="flex-1 rounded-button gold-gradient py-3 text-sm font-semibold text-secondary-foreground transition-opacity hover:opacity-90"
              >
                Yes, I'm 18+
              </button>
              <button
                onClick={handleNo}
                className="flex-1 rounded-button border border-border bg-muted py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-border"
              >
                No, Leave
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgeVerification;
