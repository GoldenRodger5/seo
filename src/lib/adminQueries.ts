/**
 * Supabase query helpers for the /admin dashboard. All queries are
 * SELECT-only and rely on the RLS policy that authenticates the
 * caller's email against the admin_users allowlist.
 *
 * Date math is done in JS rather than Postgres windowing for two
 * reasons: simpler to reason about during dev, and the dataset will be
 * small for the foreseeable future (sub-100k rows per table). When
 * volumes grow we'll move the aggregation to Postgres SQL functions.
 */

import { supabase } from "@/integrations/supabase/client";

export type DateRange = "7d" | "30d" | "90d" | "all";

export function dateRangeStart(range: DateRange): Date {
  const now = new Date();
  switch (range) {
    case "7d": return new Date(now.getTime() - 7 * 86_400_000);
    case "30d": return new Date(now.getTime() - 30 * 86_400_000);
    case "90d": return new Date(now.getTime() - 90 * 86_400_000);
    case "all": return new Date(0);
  }
}

export interface PageViewRow {
  path: string;
  page_type: string | null;
  referrer: string | null;
  session_id: string | null;
  created_at: string;
}

export interface ClickRow {
  source_page: string | null;
  source_type: string | null;
  destination_slug: string | null;
  destination_url: string | null;
  referrer: string | null;
  session_id: string | null;
  created_at: string;
}

export interface SubscriberRow {
  email: string;
  source_page: string | null;
  created_at: string;
}

// ── Fetchers ─────────────────────────────────────────────────────────────

export async function fetchPageViews(range: DateRange): Promise<PageViewRow[]> {
  const since = dateRangeStart(range).toISOString();
  const { data, error } = await supabase
    .from("page_views")
    .select("path, page_type, referrer, session_id, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100_000);
  if (error) { console.error("fetchPageViews", error); return []; }
  return (data ?? []) as PageViewRow[];
}

export async function fetchClicks(range: DateRange): Promise<ClickRow[]> {
  const since = dateRangeStart(range).toISOString();
  const { data, error } = await supabase
    .from("clicks")
    .select("source_page, source_type, destination_slug, destination_url, referrer, session_id, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100_000);
  if (error) { console.error("fetchClicks", error); return []; }
  return (data ?? []) as ClickRow[];
}

export async function fetchSubscribers(limit = 50): Promise<SubscriberRow[]> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("email, source_page, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) { console.error("fetchSubscribers", error); return []; }
  return (data ?? []) as SubscriberRow[];
}

export async function fetchAllSubscribers(): Promise<SubscriberRow[]> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("email, source_page, created_at")
    .order("created_at", { ascending: true })
    .limit(100_000);
  if (error) { console.error("fetchAllSubscribers", error); return []; }
  return (data ?? []) as SubscriberRow[];
}

export async function fetchSubscriberCount(): Promise<number> {
  const { count, error } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true });
  if (error) { console.error("fetchSubscriberCount", error); return 0; }
  return count ?? 0;
}

// ── Aggregation helpers (run client-side) ──────────────────────────────────

export interface DailyCount { date: string; views: number; clicks: number }

export function aggregateDaily(views: PageViewRow[], clicks: ClickRow[], days = 30): DailyCount[] {
  const buckets = new Map<string, DailyCount>();
  const start = new Date(Date.now() - days * 86_400_000);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const key = d.toISOString().split("T")[0];
    buckets.set(key, { date: key, views: 0, clicks: 0 });
  }
  for (const v of views) {
    const key = v.created_at.split("T")[0];
    const b = buckets.get(key);
    if (b) b.views++;
  }
  for (const c of clicks) {
    const key = c.created_at.split("T")[0];
    const b = buckets.get(key);
    if (b) b.clicks++;
  }
  return [...buckets.values()];
}

export interface HourlyCount { hour: string; label: string; views: number; clicks: number }

export function aggregateHourly(views: PageViewRow[], clicks: ClickRow[], hours = 24): HourlyCount[] {
  const buckets = new Map<string, HourlyCount>();
  const now = new Date();
  now.setMinutes(0, 0, 0);
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3_600_000);
    const key = d.toISOString().slice(0, 13);
    const label = d.toLocaleTimeString([], { hour: "2-digit", hour12: false });
    buckets.set(key, { hour: key, label, views: 0, clicks: 0 });
  }
  for (const v of views) {
    const key = v.created_at.slice(0, 13);
    const b = buckets.get(key);
    if (b) b.views++;
  }
  for (const c of clicks) {
    const key = c.created_at.slice(0, 13);
    const b = buckets.get(key);
    if (b) b.clicks++;
  }
  return [...buckets.values()];
}

export interface PageStats { path: string; page_type: string; views: number; clicks: number; ctr: number }

export function aggregateByPage(views: PageViewRow[], clicks: ClickRow[]): PageStats[] {
  const map = new Map<string, PageStats>();
  for (const v of views) {
    const path = v.path;
    if (!map.has(path)) map.set(path, { path, page_type: v.page_type ?? "other", views: 0, clicks: 0, ctr: 0 });
    map.get(path)!.views++;
  }
  for (const c of clicks) {
    const path = c.source_page ?? "(unknown)";
    if (!map.has(path)) map.set(path, { path, page_type: c.source_type ?? "other", views: 0, clicks: 0, ctr: 0 });
    map.get(path)!.clicks++;
  }
  for (const stats of map.values()) {
    stats.ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0;
  }
  return [...map.values()].sort((a, b) => b.views - a.views);
}

export interface DestinationStats { slug: string; clicks: number; topSource: string; topSourceClicks: number }

export function aggregateByDestination(clicks: ClickRow[]): DestinationStats[] {
  const map = new Map<string, { clicks: number; sources: Map<string, number> }>();
  for (const c of clicks) {
    const slug = c.destination_slug ?? "(unknown)";
    if (!map.has(slug)) map.set(slug, { clicks: 0, sources: new Map() });
    const entry = map.get(slug)!;
    entry.clicks++;
    const src = c.source_page ?? "(unknown)";
    entry.sources.set(src, (entry.sources.get(src) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([slug, data]) => {
      let topSource = "";
      let topSourceClicks = 0;
      for (const [src, n] of data.sources) {
        if (n > topSourceClicks) { topSource = src; topSourceClicks = n; }
      }
      return { slug, clicks: data.clicks, topSource, topSourceClicks };
    })
    .sort((a, b) => b.clicks - a.clicks);
}

// ── Time-window snapshots ────────────────────────────────────────────────

export interface WindowMetrics {
  views: number;
  clicks: number;
  uniqueSessions: number;
  ctr: number;
}

/**
 * Compute view/click/session metrics for rows whose created_at falls
 * within [startMs, endMs). Defaults endMs to now.
 */
export function metricsBetween(
  views: PageViewRow[],
  clicks: ClickRow[],
  startMs: number,
  endMs: number = Date.now(),
): WindowMetrics {
  const v = views.filter((x) => {
    const t = new Date(x.created_at).getTime();
    return t >= startMs && t < endMs;
  });
  const c = clicks.filter((x) => {
    const t = new Date(x.created_at).getTime();
    return t >= startMs && t < endMs;
  });
  const sessions = new Set(v.map((x) => x.session_id).filter(Boolean) as string[]);
  return {
    views: v.length,
    clicks: c.length,
    uniqueSessions: sessions.size,
    ctr: v.length > 0 ? (c.length / v.length) * 100 : 0,
  };
}

/** Midnight (local time) of today, as ms since epoch. */
export function todayStartMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ── Session quality ──────────────────────────────────────────────────────

export interface SessionQuality {
  totalSessions: number;
  bouncedSessions: number;
  bounceRate: number;
  avgPagesPerSession: number;
}

export function calcSessionQuality(views: PageViewRow[]): SessionQuality {
  const sessionViews = new Map<string, number>();
  for (const v of views) {
    if (!v.session_id) continue;
    sessionViews.set(v.session_id, (sessionViews.get(v.session_id) ?? 0) + 1);
  }
  const totalSessions = sessionViews.size;
  let bouncedSessions = 0;
  let totalPages = 0;
  for (const n of sessionViews.values()) {
    if (n === 1) bouncedSessions++;
    totalPages += n;
  }
  return {
    totalSessions,
    bouncedSessions,
    bounceRate: totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0,
    avgPagesPerSession: totalSessions > 0 ? totalPages / totalSessions : 0,
  };
}

// ── Entry pages — first view per session ─────────────────────────────────

export interface EntryPageStats { path: string; sessions: number }

export function aggregateEntryPages(views: PageViewRow[]): EntryPageStats[] {
  const sorted = [...views].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const firstBySession = new Map<string, string>();
  for (const v of sorted) {
    if (!v.session_id || firstBySession.has(v.session_id)) continue;
    firstBySession.set(v.session_id, v.path);
  }
  const counts = new Map<string, number>();
  for (const path of firstBySession.values()) {
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([path, sessions]) => ({ path, sessions }))
    .sort((a, b) => b.sessions - a.sessions);
}

// ── Referrers + traffic sources ──────────────────────────────────────────

function categorizeReferrer(ref: string | null): string {
  if (!ref || ref.trim() === "") return "direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "twinkvault.com" || host.endsWith(".twinkvault.com") || host === "localhost") return "internal";
    if (/^(google|bing|yahoo|duckduckgo|brave|ecosia|startpage|kagi|baidu|yandex)\./.test(host) || host.includes(".google.")) return "organic";
    if (/(^|\.)(reddit|x|twitter|facebook|instagram|tiktok|youtube|youtu\.be|pinterest|tumblr|threads|linkedin|discord|telegram|snapchat)\./.test(host)) return "social";
    return "referral";
  } catch {
    return "direct";
  }
}

export interface ReferrerRow { referrer: string; category: string; views: number; clicks: number }

export function aggregateReferrers(views: PageViewRow[], clicks: ClickRow[]): ReferrerRow[] {
  const map = new Map<string, ReferrerRow>();
  for (const v of views) {
    const r = (v.referrer || "(direct)").trim();
    if (!map.has(r)) map.set(r, { referrer: r, category: categorizeReferrer(v.referrer), views: 0, clicks: 0 });
    map.get(r)!.views++;
  }
  for (const c of clicks) {
    const r = (c.referrer || "(direct)").trim();
    if (!map.has(r)) map.set(r, { referrer: r, category: categorizeReferrer(c.referrer), views: 0, clicks: 0 });
    map.get(r)!.clicks++;
  }
  return [...map.values()].sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks));
}

export interface SourceCategoryRow { category: string; views: number; clicks: number; ctr: number }

export function aggregateBySource(views: PageViewRow[], clicks: ClickRow[]): SourceCategoryRow[] {
  const cats = ["organic", "social", "referral", "internal", "direct"] as const;
  const map = new Map<string, SourceCategoryRow>();
  for (const c of cats) map.set(c, { category: c, views: 0, clicks: 0, ctr: 0 });
  for (const v of views) map.get(categorizeReferrer(v.referrer))!.views++;
  for (const c of clicks) map.get(categorizeReferrer(c.referrer))!.clicks++;
  for (const row of map.values()) row.ctr = row.views > 0 ? (row.clicks / row.views) * 100 : 0;
  return [...map.values()].filter((r) => r.views + r.clicks > 0).sort((a, b) => b.views - a.views);
}

// ── Page-type funnel ─────────────────────────────────────────────────────

export interface PageTypeStats { page_type: string; views: number; clicks: number; ctr: number }

export function aggregateByPageType(views: PageViewRow[], clicks: ClickRow[]): PageTypeStats[] {
  const map = new Map<string, PageTypeStats>();
  for (const v of views) {
    const t = v.page_type ?? "other";
    if (!map.has(t)) map.set(t, { page_type: t, views: 0, clicks: 0, ctr: 0 });
    map.get(t)!.views++;
  }
  for (const c of clicks) {
    const t = c.source_type ?? "other";
    if (!map.has(t)) map.set(t, { page_type: t, views: 0, clicks: 0, ctr: 0 });
    map.get(t)!.clicks++;
  }
  for (const row of map.values()) {
    row.ctr = row.views > 0 ? (row.clicks / row.views) * 100 : 0;
  }
  return [...map.values()].sort((a, b) => b.views - a.views);
}

// ── Subscriber growth ────────────────────────────────────────────────────

export interface SubscriberGrowthRow { date: string; newSubs: number; cumulative: number }

export function subscriberGrowth(subscribers: SubscriberRow[], days = 30): SubscriberGrowthRow[] {
  const buckets = new Map<string, number>();
  const start = new Date(Date.now() - days * 86_400_000);
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    buckets.set(d.toISOString().split("T")[0], 0);
  }
  let priorCumulative = 0;
  for (const s of subscribers) {
    const key = s.created_at.split("T")[0];
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + 1);
    } else {
      priorCumulative++;
    }
  }
  let cumulative = priorCumulative;
  return [...buckets.entries()].map(([date, n]) => {
    cumulative += n;
    return { date, newSubs: n, cumulative };
  });
}

// ── Period comparison ────────────────────────────────────────────────────

/** Compare two periods of the same length and return % change. */
export function pctChange(current: number, prev: number): { delta: number; pct: number } {
  const delta = current - prev;
  const pct = prev === 0 ? (current === 0 ? 0 : 100) : (delta / prev) * 100;
  return { delta, pct };
}
