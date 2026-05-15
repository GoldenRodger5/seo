import { supabase } from "@/integrations/supabase/client";

export interface GscDailyTotalRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
}

export interface GscQueryRow {
  date: string;
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageRow {
  date: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function fetchGscDailyTotals(days = 30): Promise<GscDailyTotalRow[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("gsc_daily_totals")
    .select("date, clicks, impressions, ctr, avg_position")
    .gte("date", since)
    .order("date", { ascending: true })
    .limit(1000);
  if (error) { console.error("fetchGscDailyTotals", error); return []; }
  return (data ?? []) as GscDailyTotalRow[];
}

export async function fetchGscQueries(days = 7): Promise<GscQueryRow[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("gsc_queries")
    .select("date, query, page, clicks, impressions, ctr, position")
    .gte("date", since)
    .order("clicks", { ascending: false })
    .limit(10000);
  if (error) { console.error("fetchGscQueries", error); return []; }
  return (data ?? []) as GscQueryRow[];
}

export interface TopQuery { query: string; clicks: number; impressions: number; avgCtr: number; avgPosition: number }

export function aggregateTopQueries(rows: GscQueryRow[], topN = 50): TopQuery[] {
  const map = new Map<string, { clicks: number; impressions: number; positions: number[]; ctrs: number[] }>();
  for (const r of rows) {
    if (!map.has(r.query)) map.set(r.query, { clicks: 0, impressions: 0, positions: [], ctrs: [] });
    const entry = map.get(r.query)!;
    entry.clicks += r.clicks;
    entry.impressions += r.impressions;
    entry.positions.push(r.position);
    entry.ctrs.push(r.ctr);
  }
  return [...map.entries()]
    .map(([query, d]) => ({
      query,
      clicks: d.clicks,
      impressions: d.impressions,
      avgCtr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
      avgPosition: d.positions.length > 0 ? d.positions.reduce((s, p) => s + p, 0) / d.positions.length : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, topN);
}

/**
 * "Opportunity queries" — high impressions but low CTR. These are
 * queries where you're getting served but not earning clicks, usually
 * indicating a title/description that doesn't match search intent.
 */
export function aggregateOpportunityQueries(rows: GscQueryRow[], topN = 20): TopQuery[] {
  const top = aggregateTopQueries(rows, 500);
  return top
    .filter((q) => q.impressions >= 100 && q.avgCtr < 2 && q.avgPosition <= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, topN);
}

/**
 * "Close-to-page-1" — queries ranking 4-15. Page 1 is positions 1-10
 * but with featured snippets/zero-click overlays the real cliff is at
 * position ~3. We surface 4-15 as the achievable-improvement bucket.
 */
export function aggregateClosePage1(rows: GscQueryRow[], topN = 20): TopQuery[] {
  const top = aggregateTopQueries(rows, 500);
  return top
    .filter((q) => q.avgPosition >= 4 && q.avgPosition <= 15 && q.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, topN);
}
