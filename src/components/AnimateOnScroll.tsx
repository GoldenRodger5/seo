import { useEffect, useRef, useState, ReactNode } from "react";

/**
 * LCP guard (same rationale as MotionWrappers): this component used to render
 * `opacity-0` INTO the prerendered HTML, so server-rendered sections arrived
 * invisible and only revealed after bundle exec + IntersectionObserver fired —
 * the direct cause of a 5.2s render delay / 5.3s LCP on review pages. On the
 * initial hydration pass the content now stays exactly as the server painted
 * it (visible, no animation); scroll-in animations apply only to client-side
 * navigations after hydration.
 */
let hasHydrated = false;

const AnimateOnScroll = ({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  // Decided at render time: false during SSR and the first client render
  // (identical markup → no hydration mismatch), true for SPA navigations.
  const animate = hasHydrated;
  // Reveal state must live in React state, not an imperatively-added class:
  // the old classList.add("animate-fade-up") was wiped by the next re-render
  // (React re-applies className), so any state change INSIDE the wrapper —
  // e.g. selecting quiz options — snapped the content back to opacity-0.
  const [inView, setInView] = useState(!animate);

  useEffect(() => {
    hasHydrated = true;
    if (!animate) return; // first load: content is already visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <div ref={ref} id={id} className={`${animate && !inView ? "opacity-0" : ""} ${animate && inView ? "animate-fade-up" : ""} ${className}`}>
      {children}
    </div>
  );
};

export default AnimateOnScroll;
