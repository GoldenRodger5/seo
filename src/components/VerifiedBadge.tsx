import { Check } from "lucide-react";
import { DEAL_VERIFIED_DATE } from "../lib/dates";

interface VerifiedBadgeProps {
  className?: string;
}

const VerifiedBadge = ({ className = "" }: VerifiedBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}
  >
    <Check size={12} className="text-emerald-400" aria-hidden />
    <span>Deal verified {DEAL_VERIFIED_DATE}</span>
  </span>
);

export default VerifiedBadge;
