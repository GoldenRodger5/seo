/**
 * GA4 wrapper with consent gating.
 *
 * Loads gtag.js only after the user clicks Accept on the cookie banner.
 * Set VITE_GA4_ID in env to enable. If unset, all calls are silent no-ops
 * so dev/preview environments don't ping production analytics.
 */

const GA_ID = (import.meta.env.VITE_GA4_ID as string | undefined) ?? "";
const CONSENT_KEY = "tv_cookie_consent";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let loaded = false;

const hasConsent = (): boolean => {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
};

const ensureLoaded = (): void => {
  if (loaded || !GA_ID || typeof window === "undefined") return;
  if (!hasConsent()) return;

  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
};

export const initAnalytics = (): void => {
  ensureLoaded();
};

export const onConsentGranted = (): void => {
  ensureLoaded();
};

export const trackPageView = (path: string, title?: string): void => {
  ensureLoaded();
  if (!loaded || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
  });
};

export const trackEvent = (
  name: string,
  params: Record<string, unknown> = {}
): void => {
  ensureLoaded();
  if (!loaded || !window.gtag) return;
  window.gtag("event", name, params);
};

export const trackOutbound = (
  slug: string,
  isAffiliate: boolean,
  referrerPage: string
): void => {
  trackEvent("outbound_click", {
    site_slug: slug,
    is_affiliate: isAffiliate,
    referrer_page: referrerPage,
  });
};
