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
  created_at: string;
}

export interface ClickRow {
  source_page: string | null;
  source_type: string | null;
  destination_slug: string | null;
  destination_url: string | null;
  created_at: string;
}

export interface SubscriberRow {
  email: string;
  source_page: string | null;
  created_at: string;
}

export async function fetchPageViews(range: DateRange): Promise<PageViewRow[]> {
  const since = dateRangeStart(range).toISOString();
  const { data, error } = await supabase
    .from("page_views")
    .select("path, page_type, created_at")
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
    // Use new schema columns. created_at on new rows; fallback to clicked_at
    // is handled at aggregation time.
    .select("source_page, source_type, destination_slug, destination_url, created_at")
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

/** Compare two periods of the same length and return % change. */
export function pctChange(current: number, prev: number): { delta: number; pct: number } {
  const delta = current - prev;
  const pct = prev === 0 ? (current === 0 ? 0 : 100) : (delta / prev) * 100;
  return { delta, pct };
}
