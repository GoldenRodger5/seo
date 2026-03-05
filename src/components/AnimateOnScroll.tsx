import { useEffect, useRef, ReactNode } from "react";

const AnimateOnScroll = ({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div ref={ref} id={id} className={`opacity-0 ${className}`}>
      {children}
    </div>
  );
};

export default AnimateOnScroll;
