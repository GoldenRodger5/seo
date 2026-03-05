import { motion, useScroll, useSpring } from "framer-motion";
import { useLocation } from "react-router-dom";

const scrollPages = ["/top-sites", "/best-deals", "/reviews", "/compare"];

const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const location = useLocation();

  const shouldShow = scrollPages.some((p) => location.pathname.startsWith(p)) || location.pathname.startsWith("/reviews/");

  if (!shouldShow) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, hsl(38, 92%, 50%), hsl(32, 95%, 44%))",
      }}
    />
  );
};

export default ScrollProgressBar;
