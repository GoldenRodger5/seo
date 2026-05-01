/**
 * Helpers for parsing prices like "$11.99/mo" and computing totals.
 */

export const parseMonthlyPrice = (priceStr: string): number | null => {
  const m = priceStr.match(/\$?([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
};

export const formatTotalAnnual = (annualMonthly: string): string | null => {
  const n = parseMonthlyPrice(annualMonthly);
  if (n === null) return null;
  const total = n * 12;
  return `$${total.toFixed(2).replace(/\.00$/, "")}`;
};

/**
 * Strip the trailing /mo (and similar unit markers) so we can append our own
 * suffix without getting "$9.95/mo/mo".
 */
export const stripMonthlyUnit = (priceStr: string): string =>
  priceStr.replace(/\s*\/\s*(mo|month)\s*$/i, "");

export const computeSavings = (originalMonthly: string, dealMonthly: string): number | null => {
  const o = parseMonthlyPrice(originalMonthly);
  const d = parseMonthlyPrice(dealMonthly);
  if (o === null || d === null) return null;
  const monthlyDiff = o - d;
  const annual = monthlyDiff * 12;
  return Math.round(annual);
};
