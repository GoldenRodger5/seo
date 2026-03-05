import { motion, AnimatePresence } from "framer-motion";

const BrandStory = ({ collapsible = false }: { collapsible?: boolean }) => {
  const content = (
    <div className="glass-card rounded-lg border-l-4 border-l-primary p-8 max-w-[680px] mx-auto">
      <h3 className="font-heading text-2xl font-bold heading-gradient inline-block">Why We Built This</h3>
      <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed" style={{ fontSize: "1.125rem" }}>
        <p className="italic">
          Tired of subscribing to sites based on misleading previews and fake review blogs that rank whatever pays them the most? Same. TwinkVault exists because we got burned one too many times.
        </p>
        <p>
          We're a small independent team. We pay for every membership ourselves. We write every review from real experience. And we update them when things change — because a great site from 2022 might be a disappointment today.
        </p>
        <p className="font-medium text-foreground">
          No sponsorships. No paid placements. Just honest rankings from people who actually care about this content.
        </p>
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <details className="group">
        <summary className="cursor-pointer text-center text-sm font-medium text-secondary hover:underline list-none">
          Why We Built This ↓
        </summary>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4"
        >
          {content}
        </motion.div>
      </details>
    );
  }

  return content;
};

export default BrandStory;
