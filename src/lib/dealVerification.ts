/**
 * Verification-date display logic for /best-deals.
 *
 * Trust on a deals page comes from being honest about when something
 * was last checked, not from a static "verified deal" pill. This helper
 * turns an ISO date into a display strategy:
 *
 *   • Fresh    (≤14 days): "Verified MMM DD"
 *   • Stale    (15-30):    "Verified MMM DD — may have changed"
 *   • Expired  (>30 or missing): don't render the line at all
 */

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_MS = 86_400_000;

export interface VerificationDisplay {
  show: boolean;
  text: string;
  caveat: boolean;
}

export function getVerificationDisplay(isoDate?: string): VerificationDisplay {
  if (!isoDate) return { show: false, text: "", caveat: false };
  const t = new Date(isoDate).getTime();
  if (!Number.isFinite(t)) return { show: false, text: "", caveat: false };
  const ageDays = (Date.now() - t) / DAY_MS;
  if (ageDays > 30) return { show: false, text: "", caveat: false };
  const d = new Date(t);
  const label = `Verified ${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  if (ageDays > 14) {
    return { show: true, text: `${label} — may have changed`, caveat: true };
  }
  return { show: true, text: label, caveat: false };
}
