/**
 * First-party analytics tracking — writes to Supabase clicks + page_views.
 *
 * Why first-party (not just GA4): we own the data, we can query it in the
 * /admin dashboard without GA4 quirks, and clicks-to-destination data is
 * the single most important signal for affiliate revenue optimization.
 *
 * Privacy: no PII collected. session_id is a random uuid stored in
 * sessionStorage (rotates per browser session), not tied to identity.
 * No full user-agent or IP captured. country comes from Vercel geolocation
 * headers if exposed via the response or window.__VERCEL_GEO (only set by
 * a Vercel edge middleware; absent in this codebase so it's null today).
 *
 * Transport: sendBeacon for clicks (survives navigation). fetch with
 * keepalive as a fallback. All failures silent — never block UX.
 */

const BASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
const SESSION_KEY = "tv_session_id";
const LAST_VIEW_KEY = "tv_last_pageview"; // path|timestamp — for 30s dedupe

/** Lazily-generated stable session ID stored in sessionStorage. */
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `s${Date.now()}${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

/** Page-type classifier — used by both click and page-view rows. */
export function inferPageType(path: string): string {
  if (path === "/" || path === "") return "homepage";
  if (path.startsWith("/reviews/")) return "review";
  if (path === "/reviews") return "reviews-index";
  if (path.startsWith("/compare/")) return "compare";
  if (path === "/compare") return "compare-index";
  if (path.startsWith("/discount/")) return "discount";
  if (path.startsWith("/niche/")) return "niche";
  if (path.startsWith("/category/")) return "category";
  if (path.startsWith("/best-") || path.startsWith("/cheapest-") || path.startsWith("/free-trial-") || path.startsWith("/gay-porn-") || path.startsWith("/helix-studios-") || path.startsWith("/sean-cody-") || path.startsWith("/nakedsword-") || path.startsWith("/is-")) return "landing";
  if (path.startsWith("/blog/")) return "blog";
  if (path === "/blog") return "blog-index";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/go/")) return "outbound-redirect";
  return "other";
}

/** Internal helper — POST a row to a Supabase REST endpoint. */
function postRow(table: string, row: Record<string, unknown>): void {
  if (!BASE_URL || !ANON_KEY) return; // env not configured (dev preview, etc.)
  const url = `${BASE_URL.replace(/\/$/, "")}/rest/v1/${table}`;
  const body = JSON.stringify(row);
  const headers = {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    Prefer: "return=minimal",
  } as const;
  // Prefer sendBeacon — survives the impending navigation. Falls back to
  // fetch+keepalive if the page doesn't support it (older Safari edge cases).
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      // sendBeacon's blob route lets us set the right Content-Type, but it
      // can't set apikey/Authorization headers. So we use fetch+keepalive
      // for Supabase REST. sendBeacon is only useful if we proxy through
      // our own /api endpoint; keepalive achieves the same survival
      // guarantee for short bodies.
    }
    fetch(url, {
      method: "POST",
      headers,
      body,
      keepalive: true,
      mode: "cors",
    }).catch(() => { /* silent fail — analytics must never block UX */ });
  } catch {
    /* silent fail */
  }
}

// ── Click tracking ─────────────────────────────────────────────────────────

export interface ClickEvent {
  sourcePage: string;       // current path
  destinationSlug: string;  // site slug being clicked through to
  destinationUrl: string;   // actual outbound URL
}

/**
 * Log an affiliate-outbound click. Fire-and-forget. Returns immediately —
 * the caller should proceed with navigation without awaiting.
 */
export function logClick({ sourcePage, destinationSlug, destinationUrl }: ClickEvent): void {
  postRow("clicks", {
    source_page: sourcePage,
    source_type: inferPageType(sourcePage),
    destination_slug: destinationSlug,
    destination_url: destinationUrl,
    referrer: typeof document !== "undefined" ? (document.referrer || null) : null,
    session_id: getSessionId(),
    // Legacy columns retained for backward compatibility with the original
    // schema — the /admin dashboard reads the new columns.
    site_slug: destinationSlug,
    referrer_page: sourcePage,
  });
}

// ── Page-view tracking ─────────────────────────────────────────────────────

/**
 * Log a page view. Deduplicates within a 30-second window for the same
 * path + session (covers double-renders from React StrictMode + page
 * reload spam). Does NOT log /admin paths or /go redirects.
 */
export function logPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (path.startsWith("/admin") || path.startsWith("/go/")) return;

  const session = getSessionId();
  const now = Date.now();
  try {
    const last = sessionStorage.getItem(LAST_VIEW_KEY);
    if (last) {
      const [lastPath, lastTimeStr] = last.split("|");
      const lastTime = parseInt(lastTimeStr, 10);
      if (lastPath === path && now - lastTime < 30_000) return;
    }
    sessionStorage.setItem(LAST_VIEW_KEY, `${path}|${now}`);
  } catch {
    // sessionStorage unavailable — proceed without dedupe
  }

  postRow("page_views", {
    path,
    page_type: inferPageType(path),
    referrer: document.referrer || null,
    session_id: session,
  });
}
