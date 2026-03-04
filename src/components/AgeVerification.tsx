import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AgeVerification = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem("age_verified");
    if (!verified) setShow(true);
  }, []);

  const handleYes = () => {
    localStorage.setItem("age_verified", "true");
    setShow(false);
  };

  const handleNo = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 w-full max-w-md rounded-lg border border-card-border bg-card p-8 text-center shadow-2xl"
          >
            <h2 className="font-heading text-2xl font-bold">Age Verification</h2>
            <p className="mt-3 text-muted-foreground">
              This website contains adult content. You must be 18 years or older to enter.
            </p>
            <p className="mt-4 text-lg font-medium">Are you 18 or older?</p>
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleYes}
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
