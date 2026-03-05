import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const cardSpring = { stiffness: 300, damping: 20 };
const btnSpring = { stiffness: 400, damping: 17 };

export const MotionCard = ({ children, className = "", delay = 0 }: MotionCardProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, duration: 0.4, ease: "easeOut" }}
    whileHover={{ scale: 1.025, y: -4, transition: { type: "spring", ...cardSpring } }}
    whileTap={{ scale: 0.98 }}
  >
    {children}
  </motion.div>
);

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

export const StaggerContainer = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    initial="hidden"
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

export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{
      enter: { duration: 0.3, ease: "easeOut" },
      exit: { duration: 0.15, ease: "easeIn" },
    }}
  >
    {children}
  </motion.div>
);
