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

/**
 * Fetch query rows DIRECTLY from the Search Console API using the service
 * account (GOOGLE_SERVICE_ACCOUNT_JSON — already present in the daily
 * workflow env for the Indexing API ping).
 *
 * This exists because the Supabase-mirror path has two failure points the
 * engine can't see: the nightly gsc-sync cron (which failed silently for
 * weeks while the Search Console API was disabled) and RLS (gsc_queries is
 * admin-only SELECT; the workflow only carries the anon key, so the engine's
 * mirror reads return 0 rows even when the table is populated). Direct GSC
 * needs neither. Returns [] gracefully on any failure — the picker falls back
 * to static priority exactly as before.
 */
export async function fetchGscQueriesDirect(days = 28): Promise<GscQueryRow[]> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return [];
  const siteUrl = sanitize(process.env.GSC_SITE_URL) || "https://twinkvault.com/";
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const decoded = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const auth = new GoogleAuth({
      credentials: JSON.parse(decoded),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    const client = await auth.getClient();
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const res = await client.request<{ rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] }>({
      url: `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      method: "POST",
      data: { startDate, endDate, dimensions: ["query"], rowLimit: 5000 },
    });
    const rows = res.data.rows ?? [];
    return rows.map((r) => ({
      date: endDate,
      query: r.keys[0],
      page: null,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));
  } catch (e) {
    console.warn(`[gsc-node] direct GSC fetch failed (falling back to static priority): ${(e as Error).message?.slice(0, 160)}`);
    return [];
  }
}
