import { motion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";
import { TOTAL_SITES } from "@/lib/siteStats";

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
          <h3 className="font-heading text-lg font-bold">Sites Reviewed</h3>
          <div className="mt-2">
            <span className="font-heading text-5xl font-bold gold-gradient-text">
              {TOTAL_SITES}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Paid memberships only — no tour-page reviews</p>
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
          <ShieldCheck size={24} className="text-primary" />
          <h3 className="mt-2 font-heading text-lg font-bold">
            Affiliate Disclosed
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            We earn commissions on some links — but rankings are never for sale.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default BentoGrid;
