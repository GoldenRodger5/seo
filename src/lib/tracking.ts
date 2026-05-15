/**
 * First-party analytics tracking — writes to Supabase clicks, page_views,
 * and impressions tables.
 *
 * Privacy: no PII collected.
 *   • session_id = random UUID in sessionStorage (rotates per browser session)
 *   • visitor_id = random UUID in localStorage (persists across sessions —
 *     used only for new/returning visitor analytics, no identity linkage)
 *   • country = ISO 3166 alpha-2 from Vercel edge headers via /api/geo
 *
 * Transport: fetch with keepalive (survives page navigation). sendBeacon
 * isn't usable here because Supabase REST requires apikey + Authorization
 * headers that sendBeacon's blob form can't set.
 */

const BASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
const SESSION_KEY = "tv_session_id";
const VISITOR_KEY = "tv_visitor_id";
const COUNTRY_KEY = "tv_country";
const LAST_VIEW_KEY = "tv_last_pageview";  // path|timestamp — 30s dedupe
const IMPR_DEDUPE_KEY = "tv_impr_seen";    // sessionStorage list of seen (page|destination) pairs

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

/** Persistent visitor ID — localStorage so it survives across sessions. */
function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `v${Date.now()}${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

/**
 * Cached country code (ISO alpha-2). Populated from /api/geo on import,
 * then read synchronously from sessionStorage for subsequent events.
 * undefined = not fetched yet; null = fetched, no country available.
 */
let countryCache: string | null | undefined = undefined;

async function ensureCountry(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (countryCache !== undefined) return countryCache;
  // Try sessionStorage first (avoids /api/geo round-trip on subsequent pages)
  try {
    const stored = sessionStorage.getItem(COUNTRY_KEY);
    if (stored !== null) {
      countryCache = stored === "" ? null : stored;
      return countryCache;
    }
  } catch { /* ignore */ }
  // Fetch from edge endpoint
  try {
    const r = await fetch("/api/geo", { cache: "no-store" });
    if (!r.ok) { countryCache = null; return null; }
    const data = await r.json() as { country?: string | null };
    countryCache = data.country ?? null;
    try { sessionStorage.setItem(COUNTRY_KEY, countryCache ?? ""); } catch { /* ignore */ }
    return countryCache;
  } catch {
    countryCache = null;
    return null;
  }
}

// Prime the country cache on module load — first event may have null
// country but every subsequent event in the session will be tagged.
if (typeof window !== "undefined") void ensureCountry();

const INFO_PATHS = new Set([
  "/about", "/methodology", "/privacy-policy", "/affiliate-disclosure",
  "/contact", "/terms", "/2257", "/sitemap",
]);

/** Page-type classifier — used by click, page-view, and impression rows. */
export function inferPageType(path: string): string {
  if (path === "/" || path === "") return "homepage";
  if (path.startsWith("/reviews/")) return "review";
  if (path === "/reviews") return "reviews-index";
  if (path.startsWith("/compare/")) return "compare";
  if (path === "/compare") return "compare-index";
  if (path.startsWith("/discount/")) return "discount";
  if (path.startsWith("/niche/")) return "niche";
  if (path.startsWith("/category/")) return "category";
  if (
    path.startsWith("/best-") ||
    path.startsWith("/cheapest-") ||
    path.startsWith("/free-trial-") ||
    path.startsWith("/gay-porn-") ||
    path.startsWith("/gay-dating-") ||
    path.startsWith("/helix-studios-") ||
    path.startsWith("/sean-cody-") ||
    path.startsWith("/nakedsword-") ||
    path.startsWith("/is-")
  ) return "landing";
  if (path.startsWith("/blog/")) return "blog";
  if (path === "/blog") return "blog-index";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/go/")) return "outbound-redirect";
  if (path === "/top-sites") return "top-sites";
  if (path === "/find-my-site" || path === "/ask-ai") return "tool";
  if (INFO_PATHS.has(path)) return "info";
  return "other";
}

/** Internal helper — POST a row to a Supabase REST endpoint. */
function postRow(table: string, row: Record<string, unknown>): void {
  if (!BASE_URL || !ANON_KEY) return;
  const url = `${BASE_URL.replace(/\/$/, "")}/rest/v1/${table}`;
  // Inject country from cache (sync read — may be null on first event)
  if (!("country" in row)) row.country = countryCache ?? null;
  const body = JSON.stringify(row);
  const headers = {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    Prefer: "return=minimal",
  } as const;
  try {
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
  sourcePage: string;
  destinationSlug: string;
  destinationUrl: string;
}

/**
 * Log an affiliate-outbound click. Fire-and-forget — caller proceeds
 * with navigation without awaiting.
 */
export function logClick({ sourcePage, destinationSlug, destinationUrl }: ClickEvent): void {
  postRow("clicks", {
    source_page: sourcePage,
    source_type: inferPageType(sourcePage),
    destination_slug: destinationSlug,
    destination_url: destinationUrl,
    referrer: typeof document !== "undefined" ? (document.referrer || null) : null,
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
    // Legacy columns retained for backward compatibility with the original
    // schema — the /admin dashboard reads the new columns.
    site_slug: destinationSlug,
    referrer_page: sourcePage,
  });
}

// ── Impression tracking ────────────────────────────────────────────────────

export interface ImpressionEvent {
  sourcePage: string;
  destinationSlug: string;
}

/**
 * Log an outbound-link impression. Fires when an OutboundLink mounts
 * on a page. Deduped client-side per (session, source_page, destination)
 * tuple — same link rendered twice on the same page only counts once.
 *
 * This is the denominator for CTR-per-destination: the most actionable
 * affiliate revenue metric (which sites convert when shown).
 */
export function logImpression({ sourcePage, destinationSlug }: ImpressionEvent): void {
  if (typeof window === "undefined") return;
  if (sourcePage.startsWith("/admin") || sourcePage.startsWith("/go/")) return;

  const dedupeKey = `${sourcePage}|${destinationSlug}`;
  try {
    const raw = sessionStorage.getItem(IMPR_DEDUPE_KEY) ?? "[]";
    const seen = JSON.parse(raw) as string[];
    if (seen.includes(dedupeKey)) return;
    seen.push(dedupeKey);
    // Bound the list to avoid unbounded growth in long sessions.
    if (seen.length > 500) seen.splice(0, seen.length - 500);
    sessionStorage.setItem(IMPR_DEDUPE_KEY, JSON.stringify(seen));
  } catch {
    // sessionStorage unavailable — log without dedupe (acceptable degradation)
  }

  postRow("impressions", {
    source_page: sourcePage,
    source_type: inferPageType(sourcePage),
    destination_slug: destinationSlug,
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
  });
}

// ── Page-view tracking ─────────────────────────────────────────────────────

/**
 * Log a page view. Deduplicates within a 30-second window for the same
 * path + session. Does NOT log /admin paths or /go redirects.
 */
export function logPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (path.startsWith("/admin") || path.startsWith("/go/")) return;

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
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
  });
}
