import { Star, RefreshCw, Lock, Trophy } from "lucide-react";
import { sites } from "../data/sites";

const proofItems = [
  { icon: <Star size={14} className="text-secondary shrink-0" />, text: `${sites.length} Sites Reviewed` },
  { icon: <RefreshCw size={14} className="text-secondary shrink-0" />, text: "Updated Monthly" },
  { icon: <Trophy size={14} className="text-secondary shrink-0" />, text: "Real Scores, No Paid Placements" },
  { icon: <Lock size={14} className="text-secondary shrink-0" />, text: "Editorially Independent" },
];

const SocialProofStrip = () => (
  <div className="border-y border-primary/10 bg-muted/30">
    {/* Desktop: static */}
    <div className="container hidden py-3 md:flex items-center justify-center gap-6">
      {proofItems.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {item.icon}
          <span className="text-sm text-muted-foreground">{item.text}</span>
          {i < proofItems.length - 1 && <span className="text-muted-foreground/50">·</span>}
        </span>
      ))}
    </div>
    {/* Mobile: marquee */}
    <div className="overflow-hidden py-3 md:hidden">
      <div className="marquee-track">
        {[...proofItems, ...proofItems].map((item, i) => (
          <span key={i} className="mx-6 flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
            {item.icon} {item.text}
          </span>
        ))}
      </div>
    </div>
  </div>
);

export default SocialProofStrip;
