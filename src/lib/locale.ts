/**
 * Light-touch locale detection for currency display + hero tagline.
 *
 * We don't run a Vercel Edge Function (extra infra) — instead we use
 * navigator.language as a best-effort signal, persist the detected
 * country in localStorage so users on a VPN-detected mismatch can still
 * see consistent currency, and leave a manual override hook for later.
 *
 * Currency display is approximate; all billing is USD. The disclaimer
 * "approximate, charged in USD" lives in the components that render prices.
 */

export type Currency = "USD" | "GBP" | "EUR" | "CAD" | "AUD";
export type LocaleCode = "en-US" | "en-GB" | "en-CA" | "en-AU" | "de-DE" | "it-IT" | "pt-BR" | "ja-JP";

interface DetectedLocale {
  code: LocaleCode;
  currency: Currency;
  /** Short multilingual hero tagline that signals to search engines we serve this market */
  heroTagline?: string;
}

const FALLBACK: DetectedLocale = { code: "en-US", currency: "USD" };

const TABLE: Record<string, DetectedLocale> = {
  "en-US": { code: "en-US", currency: "USD" },
  "en-GB": { code: "en-GB", currency: "GBP" },
  "en-CA": { code: "en-CA", currency: "CAD" },
  "en-AU": { code: "en-AU", currency: "AUD" },
  "de": { code: "de-DE", currency: "EUR", heroTagline: "Die besten Twink-Seiten" },
  "de-DE": { code: "de-DE", currency: "EUR", heroTagline: "Die besten Twink-Seiten" },
  "it": { code: "it-IT", currency: "EUR", heroTagline: "I migliori siti twink" },
  "it-IT": { code: "it-IT", currency: "EUR", heroTagline: "I migliori siti twink" },
  "fr": { code: "de-DE", currency: "EUR" },
  "es": { code: "de-DE", currency: "EUR" },
  "pt-BR": { code: "pt-BR", currency: "USD", heroTagline: "Os melhores sites twink" },
  "pt": { code: "pt-BR", currency: "USD", heroTagline: "Os melhores sites twink" },
  "ja": { code: "ja-JP", currency: "USD", heroTagline: "ベストなツインクサイト" },
  "ja-JP": { code: "ja-JP", currency: "USD", heroTagline: "ベストなツインクサイト" },
};

const STORAGE_KEY = "tv_locale";

export const detectLocale = (): DetectedLocale => {
  if (typeof window === "undefined") return FALLBACK;

  // 1. Manual override wins (set via stored preference)
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && TABLE[stored]) return TABLE[stored];
  } catch {
    // ignore storage errors
  }

  // 2. navigator.language — best-effort signal
  const lang = (navigator.language || "en-US").trim();
  if (TABLE[lang]) return TABLE[lang];
  const base = lang.split("-")[0];
  if (TABLE[base]) return TABLE[base];

  return FALLBACK;
};

export const setLocaleOverride = (code: LocaleCode): void => {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
};

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  CAD: "CA$",
  AUD: "A$",
};

// Approximate FX rates — refresh quarterly. All billing is USD; this is purely
// for UI display. Off-by-a-few-percent is fine; users see "approximate" copy.
const FX_TO_USD: Record<Currency, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  AUD: 1.51,
};

export const formatLocalisedPrice = (
  usdPriceStr: string,
  currency: Currency
): string => {
  if (currency === "USD") return usdPriceStr;
  const m = usdPriceStr.match(/\$?([\d.]+)/);
  if (!m) return usdPriceStr;
  const usd = parseFloat(m[1]);
  if (!Number.isFinite(usd)) return usdPriceStr;
  const localised = usd * FX_TO_USD[currency];
  return `${SYMBOLS[currency]}${localised.toFixed(2).replace(/\.00$/, "")}`;
};

export const localePriceNote = (currency: Currency): string =>
  currency === "USD"
    ? ""
    : "Approximate, charged in USD";
