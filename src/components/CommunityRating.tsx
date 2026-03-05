import { useState } from "react";
import { motion } from "framer-motion";

interface CommunityRatingProps {
  siteSlug: string;
}

const CommunityRating = ({ siteSlug }: CommunityRatingProps) => {
  const storageKey = `tv_community_${siteSlug}`;
  const reactionsKey = `tv_reactions_${siteSlug}`;

  const [userRating, setUserRating] = useState<number>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored) : 0;
  });
  const [hoverRating, setHoverRating] = useState(0);

  // Seeded pseudo-random based on slug
  const seed = siteSlug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const baseAvg = 3.8 + (seed % 12) / 10;
  const baseCount = 140 + (seed % 200);

  const [avgRating] = useState(() => {
    if (userRating > 0) {
      return parseFloat(((baseAvg * baseCount + userRating) / (baseCount + 1)).toFixed(1));
    }
    return parseFloat(baseAvg.toFixed(1));
  });
  const ratingCount = baseCount + (userRating > 0 ? 1 : 0);

  const handleRate = (star: number) => {
    if (userRating > 0) return;
    setUserRating(star);
    localStorage.setItem(storageKey, String(star));
  };

  // Emoji reactions
  const reactions = [
    { emoji: "🔥", label: "Hot" },
    { emoji: "💯", label: "Worth It" },
    { emoji: "👎", label: "Skip" },
    { emoji: "💰", label: "Great Value" },
  ];

  const [selectedReaction, setSelectedReaction] = useState<string | null>(() => {
    return localStorage.getItem(`${reactionsKey}_selected`);
  });

  const getReactionCount = (label: string) => {
    const base = 20 + ((seed + label.length * 7) % 80);
    const stored = localStorage.getItem(`${reactionsKey}_${label}`);
    return stored ? parseInt(stored) : base;
  };

  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    reactions.forEach((r) => {
      counts[r.label] = getReactionCount(r.label);
    });
    return counts;
  });

  const handleReaction = (label: string) => {
    if (selectedReaction) return;
    setSelectedReaction(label);
    const newCount = reactionCounts[label] + 1;
    setReactionCounts((prev) => ({ ...prev, [label]: newCount }));
    localStorage.setItem(`${reactionsKey}_selected`, label);
    localStorage.setItem(`${reactionsKey}_${label}`, String(newCount));
  };

  const displayRating = hoverRating || userRating;

  return (
    <div className="space-y-6">
      {/* Star Rating */}
      <div className="glass-card rounded-lg p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              Community Score: {avgRating} ★
              <span className="ml-1 text-muted-foreground font-normal">({ratingCount} ratings)</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Rate this site:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => !userRating && setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                whileTap={!userRating ? { scale: 1.4 } : {}}
                className={`text-xl transition-colors ${
                  star <= displayRating
                    ? "text-secondary"
                    : "text-muted-foreground/30"
                } ${userRating ? "cursor-default" : "cursor-pointer"}`}
                disabled={userRating > 0}
              >
                ★
              </motion.button>
            ))}
          </div>
        </div>
        {userRating > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Thanks for rating!</p>
        )}
      </div>

      {/* Emoji Reactions */}
      <div className="glass-card rounded-lg p-5">
        <p className="text-sm font-semibold mb-3">How do you feel about this site?</p>
        <div className="flex flex-wrap gap-2">
          {reactions.map((r) => (
            <motion.button
              key={r.label}
              onClick={() => handleReaction(r.label)}
              whileTap={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`inline-flex items-center gap-1.5 rounded-button px-3 py-2 text-sm font-medium transition-colors ${
                selectedReaction === r.label
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              } ${selectedReaction && selectedReaction !== r.label ? "opacity-60" : ""}`}
              disabled={!!selectedReaction}
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
              <span className="ml-1 text-xs text-muted-foreground">{reactionCounts[r.label]}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityRating;
