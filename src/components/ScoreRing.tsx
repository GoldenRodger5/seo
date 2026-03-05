import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useInView } from "framer-motion";

interface ScoreRingProps {
  score: number;
  size?: number;
}

const ScoreRing = ({ score, size = 80 }: ScoreRingProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 5) * circumference;

  const dashOffset = useMotionValue(circumference);
  const springOffset = useSpring(dashOffset, { stiffness: 60, damping: 20, mass: 1 });

  const [count, setCount] = useState(0);

  const color = "hsl(142, 71%, 45%)";

  useEffect(() => {
    if (isInView) {
      dashOffset.set(targetOffset);

      // Animate counter
      const duration = 1500;
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        setCount(parseFloat((progress * score).toFixed(1)));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, score, targetOffset, dashOffset]);

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
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
      <span className="absolute font-heading text-lg font-bold">{count}</span>
    </div>
  );
};

export default ScoreRing;
