import { sites } from "@/data/sites";
import { reviewBodies } from "@/hooks/useAIReview";

export const TOTAL_SITES = sites.length;

export const REVIEWED_SITES = sites.filter((s) => {
  const body = reviewBodies[s.slug];
  return Boolean(body && body.length > 0);
}).length;

export const DEAL_SITES = sites.filter((s) => s.deal_discount > 0).length;

export const TRIAL_SITES = sites.filter((s) => s.has_free_trial).length;

export const formatSiteCount = (n: number): string => {
  if (n >= 50) return `${Math.floor(n / 10) * 10}+`;
  if (n >= 20) return `${n}+`;
  return String(n);
};

export const sitesCountLabel = formatSiteCount(TOTAL_SITES);
