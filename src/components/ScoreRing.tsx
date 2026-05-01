import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useInView } from "framer-motion";

interface ScoreRingProps {
  score: number;
  size?: number;
}

const formatScore = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  // Always show one decimal so 4.0/4.3/4.6 render uniformly and never get
  // truncated to a single integer mid-animation.
  return n.toFixed(1);
};

const ScoreRing = ({ score, size = 80 }: ScoreRingProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 5) * circumference;

  const dashOffset = useMotionValue(circumference);
  const springOffset = useSpring(dashOffset, { stiffness: 60, damping: 20, mass: 1 });

  const color = "hsl(142, 71%, 45%)";

  useEffect(() => {
    if (isInView) dashOffset.set(targetOffset);
  }, [isInView, targetOffset, dashOffset]);

  // Scale the displayed text size with the ring size so a single source of
  // truth covers all callsites (small badge, summary card, sidebar).
  const fontSize = Math.max(12, Math.round(size * 0.28));

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={4}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: springOffset }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-heading font-bold tabular-nums leading-none"
        style={{ fontSize }}
      >
        {formatScore(score)}
      </span>
    </div>
  );
};

export default ScoreRing;
