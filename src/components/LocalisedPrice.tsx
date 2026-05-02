import { useMemo } from "react";
import { detectLocale, formatLocalisedPrice } from "@/lib/locale";

interface LocalisedPriceProps {
  /** USD price string, e.g. "$9.95/mo" */
  usd: string;
  /** Optional className passthrough */
  className?: string;
  /** Strip "/mo" / "/month" suffix before localising (for cases where caller appends its own unit) */
  stripUnit?: boolean;
}

const stripMonthly = (s: string): string =>
  s.replace(/\s*\/\s*(mo|month)\s*$/i, "");

/**
 * Render a price in the user's detected currency. When the detected currency
 * is USD, this is a no-op — we just render the input string unchanged.
 *
 * For non-USD locales we render the converted figure with a `title` tooltip
 * carrying the original USD string and the "approximate, charged in USD"
 * disclaimer for honesty.
 */
const LocalisedPrice = ({ usd, className = "", stripUnit = false }: LocalisedPriceProps) => {
  const { currency } = useMemo(() => detectLocale(), []);
  const input = stripUnit ? stripMonthly(usd) : usd;

  if (currency === "USD") {
    return <span className={className}>{input}</span>;
  }

  // formatLocalisedPrice strips the /mo suffix when computing — re-append it so
  // "$9.95/mo" doesn't become a bare "£7.86" with no time unit.
  const trailingUnit = usd.match(/\/\s*(mo|month)\s*$/i)?.[0] ?? "";
  const localisedNumber = formatLocalisedPrice(input, currency);
  const localised = stripUnit ? localisedNumber : `${localisedNumber}${trailingUnit}`;

  return (
    <span
      className={className}
      title={`${usd} — approximate, charged in USD`}
      aria-label={`${localised}, approximate. Charged in USD.`}
    >
      {localised}
    </span>
  );
};

export default LocalisedPrice;
