import { useEffect, useRef, ReactNode } from "react";

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

  useEffect(() => {
    hasHydrated = true;
    if (!animate) return; // first load: content is already visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-up");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <div ref={ref} id={id} className={`${animate ? "opacity-0" : ""} ${className}`}>
      {children}
    </div>
  );
};

export default AnimateOnScroll;
