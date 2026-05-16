import type { SiteData } from "../data/sites";
import { currentMonthLong, currentYear } from "../lib/dates";

interface Props {
  site: SiteData;
  /** Number of billing cycles for the "Tested" copy. Defaults to 2. */
  cycles?: number;
}

/**
 * Honest disclosure banner that matches the methodology page's
 * subscription-tested vs research-based distinction. Sites flagged with
 * review_depth: 'subscription' show the paid-cycles language; everything
 * else (undefined or 'research') shows the publisher-materials language.
 */
const ReviewDisclosureBanner = ({ site, cycles = 2 }: Props) => {
  const tested = site.review_depth === "subscription";
  return (
    <div className="mb-4 flex items-start gap-2 rounded-button border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
      <span className="shrink-0">✓</span>
      {tested ? (
        <span>
          <strong>Tested from a paid subscription.</strong> Reviewed {cycles} billing cycles. Last updated {currentMonthLong} {currentYear}.
        </span>
      ) : (
        <span>
          <strong>Researched from publisher materials, scene samples, and user reports.</strong> Last updated {currentMonthLong} {currentYear}.
        </span>
      )}
    </div>
  );
};

export default ReviewDisclosureBanner;
