/**
 * Node-side Supabase client + GSC data fetcher for the daily content
 * engine. Browser-side reads use src/lib/gscQueries.ts (anon key); this
 * file is for cron / Vercel functions / local scripts using the service
 * role key.
 *
 * Required env vars (set in GitHub Actions secrets):
 *   - SUPABASE_URL (or VITE_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY (preferred) OR VITE_SUPABASE_ANON_KEY
 *
 * Missing env vars are NOT an error here — the daily engine should
 * still pick something via static priority. We return empty arrays and
 * let the caller fall back gracefully.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface GscQueryRow {
  date: string;
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function sanitize(v: string | undefined): string | undefined {
  if (!v) return v;
  return v.trim().replace(/^["']|["']$/g, "");
}

let cachedClient: SupabaseClient | null | undefined;
function getClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;
  const url = sanitize(process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL);
  const key = sanitize(
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );
  if (!url || !key || !/^https?:\/\//.test(url)) {
    cachedClient = null;
    return null;
  }
  cachedClient = createClient(url, key);
  return cachedClient;
}

/**
 * Pull recent GSC query rows. Returns [] silently if Supabase is
 * unreachable or env vars are missing — caller falls back to static
 * priority. Window defaults to 28 days (Google's standard reporting
 * cadence; long enough to smooth noise, short enough to reflect
 * recent demand).
 */
export async function fetchGscQueriesNode(days = 28): Promise<GscQueryRow[]> {
  const supabase = getClient();
  if (!supabase) return [];
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  try {
    const { data, error } = await supabase
      .from("gsc_queries")
      .select("date, query, page, clicks, impressions, ctr, position")
      .gte("date", since)
      .limit(50000);
    if (error) {
      console.warn(`[gsc-node] query fetch error: ${error.message}`);
      return [];
    }
    return (data ?? []) as GscQueryRow[];
  } catch (e) {
    console.warn(`[gsc-node] unexpected error: ${(e as Error).message}`);
    return [];
  }
}
