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
  visitor_id: string | null;
  country: string | null;
  created_at: string;
}

export interface ClickRow {
  source_page: string | null;
  source_type: string | null;
  destination_slug: string | null;
  destination_url: string | null;
  referrer: string | null;
  session_id: string | null;
  visitor_id: string | null;
  country: string | null;
  cta_position: string | null;
  created_at: string;
}

export interface EngagementRow {
  session_id: string | null;
  visitor_id: string | null;
  path: string;
  page_type: string | null;
  max_scroll_pct: number | null;
  time_on_page_ms: number | null;
  reached_25: boolean | null;
  reached_50: boolean | null;
  reached_75: boolean | null;
  reached_100: boolean | null;
  created_at: string;
}

export interface ImpressionRow {
  source_page: string | null;
  source_type: string | null;
  destination_slug: string | null;
  session_id: string | null;
  visitor_id: string | null;
  country: string | null;
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
    .select("path, page_type, referrer, session_id, visitor_id, country, created_at")
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
    .select("source_page, source_type, destination_slug, destination_url, referrer, session_id, visitor_id, country, cta_position, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100_000);
  if (error) { console.error("fetchClicks", error); return []; }
  return (data ?? []) as ClickRow[];
}

export async function fetchEngagement(range: DateRange): Promise<EngagementRow[]> {
  const since = dateRangeStart(range).toISOString();
  const { data, error } = await supabase
    .from("page_engagement")
    .select("session_id, visitor_id, path, page_type, max_scroll_pct, time_on_page_ms, reached_25, reached_50, reached_75, reached_100, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100_000);
  if (error) { console.error("fetchEngagement", error); return []; }
  return (data ?? []) as EngagementRow[];
}

export async function fetchImpressions(range: DateRange): Promise<ImpressionRow[]> {
  const since = dateRangeStart(range).toISOString();
  const { data, error } = await supabase
    .from("impressions")
    .select("source_page, source_type, destination_slug, session_id, visitor_id, country, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100_000);
  if (error) { console.error("fetchImpressions", error); return []; }
  return (data ?? []) as ImpressionRow[];
}

/**
 * Fetch the earliest seen timestamp per visitor_id (across all history,
 * not just the selected range). Used by calcVisitorStats to determine
 * whether a visitor seen in the current range is new (first-seen falls
 * inside the range) or returning (first-seen predates the range).
 */
export async function fetchVisitorFirstSeen(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("page_views")
    .select("visitor_id, created_at")
    .order("created_at", { ascending: true })
    .limit(100_000);
  if (error) { console.error("fetchVisitorFirstSeen", error); return new Map(); }
  const map = new Map<string, string>();
  for (const row of (data ?? []) as { visitor_id: string | null; created_at: string }[]) {
    if (!row.visitor_id) continue;
    if (!map.has(row.visitor_id)) map.set(row.visitor_id, row.created_at);
  }
  return map;
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

// ── Destination CTR (impressions-aware) ──────────────────────────────────

export interface DestinationCTR {
  slug: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

/**
 * Compute clicks / impressions per destination — the canonical conversion
 * metric for affiliate optimization. Answers "of users who saw this
 * affiliate, how many clicked through?"
 */
export function aggregateDestinationCTR(
  clicks: ClickRow[],
  impressions: ImpressionRow[],
): DestinationCTR[] {
  const map = new Map<string, DestinationCTR>();
  for (const i of impressions) {
    const slug = i.destination_slug ?? "(unknown)";
    if (!map.has(slug)) map.set(slug, { slug, impressions: 0, clicks: 0, ctr: 0 });
    map.get(slug)!.impressions++;
  }
  for (const c of clicks) {
    const slug = c.destination_slug ?? "(unknown)";
    if (!map.has(slug)) map.set(slug, { slug, impressions: 0, clicks: 0, ctr: 0 });
    map.get(slug)!.clicks++;
  }
  for (const row of map.values()) {
    row.ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
  }
  return [...map.values()].sort((a, b) => b.clicks - a.clicks);
}

// ── New vs returning visitors ────────────────────────────────────────────

export interface VisitorStats {
  newVisitors: number;
  returningVisitors: number;
  totalVisitors: number;
  returningPct: number;
}

/**
 * Classify visitors seen in `views` as new or returning. A visitor is
 * "returning" if their first-seen timestamp (across all history, not
 * just the current range) predates `rangeStartMs`.
 *
 * Requires a pre-computed firstSeen map from fetchVisitorFirstSeen().
 */
export function calcVisitorStats(
  views: PageViewRow[],
  firstSeen: Map<string, string>,
  rangeStartMs: number,
): VisitorStats {
  const seenInRange = new Set<string>();
  for (const v of views) {
    if (v.visitor_id) seenInRange.add(v.visitor_id);
  }
  let newVisitors = 0;
  let returningVisitors = 0;
  for (const vid of seenInRange) {
    const first = firstSeen.get(vid);
    if (!first) continue;
    if (new Date(first).getTime() >= rangeStartMs) newVisitors++;
    else returningVisitors++;
  }
  const total = newVisitors + returningVisitors;
  return {
    newVisitors,
    returningVisitors,
    totalVisitors: total,
    returningPct: total > 0 ? (returningVisitors / total) * 100 : 0,
  };
}

// ── Country breakdown ────────────────────────────────────────────────────

export interface CountryStats { country: string; views: number; clicks: number; ctr: number }

export function aggregateByCountry(views: PageViewRow[], clicks: ClickRow[]): CountryStats[] {
  const map = new Map<string, CountryStats>();
  for (const v of views) {
    const c = v.country ?? "??";
    if (!map.has(c)) map.set(c, { country: c, views: 0, clicks: 0, ctr: 0 });
    map.get(c)!.views++;
  }
  for (const c of clicks) {
    const cc = c.country ?? "??";
    if (!map.has(cc)) map.set(cc, { country: cc, views: 0, clicks: 0, ctr: 0 });
    map.get(cc)!.clicks++;
  }
  for (const row of map.values()) {
    row.ctr = row.views > 0 ? (row.clicks / row.views) * 100 : 0;
  }
  return [...map.values()].sort((a, b) => b.views - a.views);
}

// ── Period comparison ────────────────────────────────────────────────────

/** Compare two periods of the same length and return % change. */
export function pctChange(current: number, prev: number): { delta: number; pct: number } {
  const delta = current - prev;
  const pct = prev === 0 ? (current === 0 ? 0 : 100) : (delta / prev) * 100;
  return { delta, pct };
}

// ── Click attribution matrix ─────────────────────────────────────────────

export interface AttributionRow {
  slug: string;
  totalClicks: number;
  sources: { sourcePage: string; clicks: number; views: number; ctr: number }[];
}

/**
 * For each top-clicked destination, compute the source-page breakdown
 * and CTR from each. Answers "of NakedSword's 6 clicks, where did they
 * come from?" — the single most actionable widget for placement-of-CTA
 * decisions.
 */
export function buildAttributionMatrix(
  clicks: ClickRow[],
  views: PageViewRow[],
  topN = 10,
  perDestSourcesN = 5,
): AttributionRow[] {
  // Step 1: count clicks per destination
  const destClicks = new Map<string, ClickRow[]>();
  for (const c of clicks) {
    const slug = c.destination_slug ?? "(unknown)";
    if (!destClicks.has(slug)) destClicks.set(slug, []);
    destClicks.get(slug)!.push(c);
  }
  // Step 2: views per source page (for CTR denominator)
  const viewsByPath = new Map<string, number>();
  for (const v of views) viewsByPath.set(v.path, (viewsByPath.get(v.path) ?? 0) + 1);
  // Step 3: take top N destinations, build source breakdown for each
  const top = [...destClicks.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, topN);
  return top.map(([slug, rows]) => {
    const srcCounts = new Map<string, number>();
    for (const c of rows) {
      const src = c.source_page ?? "(unknown)";
      srcCounts.set(src, (srcCounts.get(src) ?? 0) + 1);
    }
    const sources = [...srcCounts.entries()]
      .map(([sourcePage, n]) => {
        const v = viewsByPath.get(sourcePage) ?? 0;
        return { sourcePage, clicks: n, views: v, ctr: v > 0 ? (n / v) * 100 : 0 };
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, perDestSourcesN);
    return { slug, totalClicks: rows.length, sources };
  });
}

// ── CTA Position performance ─────────────────────────────────────────────

export interface CtaPositionStats {
  position: string;
  clicks: number;
  destinations: number;
}

export function aggregateByCtaPosition(clicks: ClickRow[]): CtaPositionStats[] {
  const map = new Map<string, { clicks: number; dests: Set<string> }>();
  for (const c of clicks) {
    const pos = c.cta_position ?? "(unspecified)";
    if (!map.has(pos)) map.set(pos, { clicks: 0, dests: new Set() });
    const entry = map.get(pos)!;
    entry.clicks++;
    if (c.destination_slug) entry.dests.add(c.destination_slug);
  }
  return [...map.entries()]
    .map(([position, d]) => ({ position, clicks: d.clicks, destinations: d.dests.size }))
    .sort((a, b) => b.clicks - a.clicks);
}

// ── Engagement aggregations ──────────────────────────────────────────────

export interface EngagementByPageType {
  pageType: string;
  rows: number;
  avgScrollPct: number;
  avgTimeOnPageSec: number;
  pctReached75: number;
}

export function aggregateEngagementByPageType(rows: EngagementRow[]): EngagementByPageType[] {
  const map = new Map<string, EngagementRow[]>();
  for (const r of rows) {
    const t = r.page_type ?? "other";
    if (!map.has(t)) map.set(t, []);
    map.get(t)!.push(r);
  }
  return [...map.entries()]
    .map(([pageType, arr]) => {
      const totalScroll = arr.reduce((s, r) => s + (r.max_scroll_pct ?? 0), 0);
      const totalTime = arr.reduce((s, r) => s + (r.time_on_page_ms ?? 0), 0);
      const deep = arr.filter((r) => r.reached_75).length;
      return {
        pageType,
        rows: arr.length,
        avgScrollPct: arr.length > 0 ? totalScroll / arr.length : 0,
        avgTimeOnPageSec: arr.length > 0 ? totalTime / arr.length / 1000 : 0,
        pctReached75: arr.length > 0 ? (deep / arr.length) * 100 : 0,
      };
    })
    .sort((a, b) => b.rows - a.rows);
}

export interface BrokenCtaPage {
  path: string;
  views: number;
  avgScrollPct: number;
  clicks: number;
}

/**
 * "High engagement, no clicks" — pages where readers stayed and scrolled
 * but didn't convert. Strong signal that the CTA is missing, weak, or
 * mispositioned.
 */
export function findHighScrollLowConversion(
  engagement: EngagementRow[],
  clicks: ClickRow[],
  minViews = 5,
): BrokenCtaPage[] {
  const byPath = new Map<string, EngagementRow[]>();
  for (const r of engagement) {
    if (!byPath.has(r.path)) byPath.set(r.path, []);
    byPath.get(r.path)!.push(r);
  }
  const clicksByPath = new Map<string, number>();
  for (const c of clicks) {
    if (!c.source_page) continue;
    clicksByPath.set(c.source_page, (clicksByPath.get(c.source_page) ?? 0) + 1);
  }
  return [...byPath.entries()]
    .map(([path, rows]) => {
      const totalScroll = rows.reduce((s, r) => s + (r.max_scroll_pct ?? 0), 0);
      return {
        path,
        views: rows.length,
        avgScrollPct: rows.length > 0 ? totalScroll / rows.length : 0,
        clicks: clicksByPath.get(path) ?? 0,
      };
    })
    .filter((r) => r.views >= minViews && r.avgScrollPct >= 60 && r.clicks === 0)
    .sort((a, b) => b.views - a.views);
}

// ── Session journeys ─────────────────────────────────────────────────────

export interface JourneyEvent {
  type: "view" | "click";
  path: string;
  destination?: string;
  createdAt: string;
}

export interface SessionJourney {
  sessionId: string;
  events: JourneyEvent[];
  converted: boolean;
  pages: number;
  startedAt: string;
}

/**
 * Reconstruct per-session event sequences (views interleaved with
 * clicks). Used by /admin/journeys to surface most-common conversion
 * paths and bounce patterns.
 */
export function reconstructJourneys(views: PageViewRow[], clicks: ClickRow[]): SessionJourney[] {
  const map = new Map<string, JourneyEvent[]>();
  for (const v of views) {
    if (!v.session_id) continue;
    if (!map.has(v.session_id)) map.set(v.session_id, []);
    map.get(v.session_id)!.push({ type: "view", path: v.path, createdAt: v.created_at });
  }
  for (const c of clicks) {
    if (!c.session_id) continue;
    if (!map.has(c.session_id)) map.set(c.session_id, []);
    map.get(c.session_id)!.push({
      type: "click",
      path: c.source_page ?? "(unknown)",
      destination: c.destination_slug ?? undefined,
      createdAt: c.created_at,
    });
  }
  return [...map.entries()]
    .map(([sessionId, events]) => {
      events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const converted = events.some((e) => e.type === "click");
      const pages = events.filter((e) => e.type === "view").length;
      return {
        sessionId,
        events,
        converted,
        pages,
        startedAt: events[0]?.createdAt ?? new Date().toISOString(),
      };
    })
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export interface PathFrequency { path: string; count: number; converted: number }

/**
 * Most-common N-step journey signatures. Each journey is a "/" joined
 * string of the first `steps` views, optionally with the destination
 * click appended.
 */
export function aggregateJourneyPaths(
  journeys: SessionJourney[],
  steps = 3,
  includeClick = true,
): PathFrequency[] {
  const map = new Map<string, { count: number; converted: number }>();
  for (const j of journeys) {
    const viewSteps = j.events.filter((e) => e.type === "view").slice(0, steps).map((e) => e.path);
    if (viewSteps.length === 0) continue;
    let key = viewSteps.join(" → ");
    if (includeClick && j.converted) {
      const firstClick = j.events.find((e) => e.type === "click");
      if (firstClick?.destination) key += ` → 💰 ${firstClick.destination}`;
    }
    if (!map.has(key)) map.set(key, { count: 0, converted: 0 });
    const entry = map.get(key)!;
    entry.count++;
    if (j.converted) entry.converted++;
  }
  return [...map.entries()]
    .map(([path, d]) => ({ path, count: d.count, converted: d.converted }))
    .sort((a, b) => b.count - a.count);
}

/**
 * For each top destination, find the most common preceding source path
 * (the page right before the click). Answers "what's the page that
 * usually precedes a click to NakedSword?"
 */
export interface PreClickPath {
  destination: string;
  totalClicks: number;
  precedingPaths: { path: string; count: number }[];
}

export function aggregatePreClickPaths(journeys: SessionJourney[], topN = 10): PreClickPath[] {
  const map = new Map<string, Map<string, number>>();
  for (const j of journeys) {
    if (!j.converted) continue;
    for (let i = 0; i < j.events.length; i++) {
      const e = j.events[i];
      if (e.type !== "click" || !e.destination) continue;
      // Find the view immediately before this click.
      let preceding: string | null = null;
      for (let k = i - 1; k >= 0; k--) {
        if (j.events[k].type === "view") { preceding = j.events[k].path; break; }
      }
      if (!preceding) preceding = "(direct landing)";
      if (!map.has(e.destination)) map.set(e.destination, new Map());
      const inner = map.get(e.destination)!;
      inner.set(preceding, (inner.get(preceding) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([destination, inner]) => {
      const paths = [...inner.entries()]
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      const total = paths.reduce((s, p) => s + p.count, 0);
      return { destination, totalClicks: total, precedingPaths: paths };
    })
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, topN);
}
