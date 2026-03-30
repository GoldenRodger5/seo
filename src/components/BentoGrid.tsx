import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Lock, Users } from "lucide-react";

const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const BentoGrid = () => (
  <section className="py-16">
    <div className="container">
      <h2 className="font-heading text-3xl font-bold md:text-4xl heading-gradient inline-block mb-8">Why TwinkVault?</h2>
      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
        {/* Large tile - spans 2 cols */}
        <motion.div
          className="md:col-span-2 md:row-span-2 glass-card rounded-lg p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(263 30% 12%) 0%, hsl(240 30% 8%) 100%)" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ borderColor: "hsl(263, 70%, 58%, 0.5)", boxShadow: "0 8px 40px hsl(263, 70%, 58%, 0.2)" }}
        >
          <span className="pointer-events-none absolute right-4 bottom-4 font-heading text-[120px] font-bold text-foreground/[0.05] leading-none">0</span>
          <h3 className="font-heading text-2xl font-bold">Zero Sponsored Rankings</h3>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We rank by quality. Period. No site has ever paid us to rank higher. That's why you can actually trust this.
          </p>
        </motion.div>

        {/* Medium tile - 50+ Sites */}
        <motion.div
          className="glass-card rounded-lg p-6 flex flex-col justify-between"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          whileHover={{ borderColor: "hsl(263, 70%, 58%, 0.5)", boxShadow: "0 8px 40px hsl(263, 70%, 58%, 0.2)" }}
        >
          <h3 className="font-heading text-lg font-bold">Hours Tested</h3>
          <div className="mt-2">
            <span className="font-heading text-5xl font-bold gold-gradient-text">
              <AnimatedCounter target={100} suffix="+" />
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">hours of hands-on testing</p>
        </motion.div>

        {/* Medium tile - Updated */}
        <motion.div
          className="glass-card rounded-lg p-6 flex flex-col justify-between relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(240 20% 7%) 0%, hsl(38 30% 10%) 100%)" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          whileHover={{ borderColor: "hsl(263, 70%, 58%, 0.5)", boxShadow: "0 8px 40px hsl(263, 70%, 58%, 0.2)" }}
        >
          <h3 className="font-heading text-lg font-bold">Updated Every 30 Days</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-heading text-3xl font-bold text-secondary">30</span>
            <span className="text-xs text-muted-foreground">day review cycle</span>
          </div>
        </motion.div>

        {/* Small tile - Privacy */}
        <motion.div
          className="glass-card rounded-lg p-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          whileHover={{ borderColor: "hsl(263, 70%, 58%, 0.5)", boxShadow: "0 8px 40px hsl(263, 70%, 58%, 0.2)" }}
        >
          <Lock size={24} className="text-primary" />
          <h3 className="mt-2 font-heading text-lg font-bold">Your privacy matters</h3>
          <p className="mt-1 text-xs text-muted-foreground">We never track what you watch or where you click beyond basic analytics.</p>
        </motion.div>

        {/* Small tile - Readers */}
        <motion.div
          className="glass-card rounded-lg p-6"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          whileHover={{ borderColor: "hsl(263, 70%, 58%, 0.5)", boxShadow: "0 8px 40px hsl(263, 70%, 58%, 0.2)" }}
        >
          <Users size={24} className="text-primary" />
          <h3 className="mt-2 font-heading text-lg font-bold">
            Growing Community
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">of readers trust our reviews</p>
          <div className="mt-3 flex -space-x-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default BentoGrid;
