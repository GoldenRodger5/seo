import { Star } from "lucide-react";

interface StarRatingProps {
  score: number;
  size?: number;
  showNumber?: boolean;
}

const StarRating = ({ score, size = 16, showNumber = true }: StarRatingProps) => {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.25;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`f${i}`} size={size} className="fill-secondary text-secondary" />
        ))}
        {hasHalf && <Star size={size} className="fill-secondary/50 text-secondary" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`e${i}`} size={size} className="text-muted-foreground/30" />
        ))}
      </div>
      {showNumber && <span className="text-sm font-semibold text-foreground">{score.toFixed(1)}</span>}
    </div>
  );
};

export default StarRating;
