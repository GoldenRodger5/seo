import { motion } from "framer-motion";
import { ReactNode, useEffect } from "react";

/**
 * LCP guard: the prerendered HTML arrives fully visible. If entrance
 * animations start "hidden" on the FIRST client mount, hydration blanks the
 * already-painted page and re-reveals it only after bundle exec + animation —
 * Lighthouse measured 5.2s of pure render delay on a 104ms-TTFB review page
 * (LCP 5.3s, "poor"). Entrance animations therefore run ONLY for client-side
 * navigations (second mount onwards), never on the initial hydration pass:
 * `initial={false}` tells framer-motion to mount directly in the settled
 * state, which matches the server-rendered pixels exactly.
 */
let hasHydrated = false;
const useMarkHydrated = () => {
  useEffect(() => {
    hasHydrated = true;
  }, []);
};

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const cardSpring = { stiffness: 300, damping: 20 };
const btnSpring = { stiffness: 400, damping: 17 };

export const MotionCard = ({ children, className = "", delay = 0 }: MotionCardProps) => {
  useMarkHydrated();
  return (
    <motion.div
      className={className}
      initial={hasHydrated ? { opacity: 0, y: 24 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.025, y: -4, transition: { type: "spring", ...cardSpring } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
};

export const MotionButton = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.96 }}
    transition={{ type: "spring", ...btnSpring }}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  useMarkHydrated();
  return (
    <motion.div
      className={className}
      initial={hasHydrated ? "hidden" : false}
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerChild = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    }}
  >
    {children}
  </motion.div>
);

export const PageTransition = ({ children }: { children: ReactNode }) => {
  useMarkHydrated();
  return (
    <motion.div
      initial={hasHydrated ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};
