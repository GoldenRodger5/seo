const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const now = new Date();
const YEAR = now.getFullYear();
const MONTH = now.getMonth(); // 0-indexed

export const currentYear = YEAR;
export const currentMonthShort = SHORT_MONTHS[MONTH];
export const currentMonthLong = MONTH_NAMES[MONTH];
export const lastCheckedDate = `${MONTH_NAMES[MONTH]} ${now.getDate()}, ${YEAR}`;

/**
 * Manually-curated verification stamp shown on deal cards.
 * Update this string once a month after the deals sweep — single source of truth.
 */
export const DEAL_VERIFIED_DATE = "May 2026";
