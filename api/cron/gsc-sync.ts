import type { VercelRequest, VercelResponse } from "@vercel/node";
import { JWT } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";

/**
 * Daily Search Console sync. Pulls yesterday's data from GSC and
 * mirrors it into Supabase so the /admin/seo dashboard can correlate
 * organic search performance with on-site click data.
 *
 * Cron schedule (Vercel): "0 4 * * *" (04:00 UTC daily).
 * Auth: bearer-tokened via CRON_SECRET env var to prevent abuse.
 *
 * Required env vars:
 *   - GSC_SERVICE_ACCOUNT_JSON  — JSON-stringified service account creds
 *   - GSC_SITE_URL              — e.g. "https://twinkvault.com/"
 *   - SUPABASE_URL              — same as VITE_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY — service role key (NOT anon) for writes
 *   - CRON_SECRET               — random string; cron must send Authorization: Bearer <secret>
 */

const GSC_API = "https://searchconsole.googleapis.com/v1";

interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscResponse {
  rows?: GscRow[];
}

function isoYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function getAccessToken(): Promise<string> {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GSC_SERVICE_ACCOUNT_JSON env var not set");
  const creds = JSON.parse(raw) as { client_email: string; private_key: string };
  const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const { access_token } = await jwt.authorize();
  if (!access_token) throw new Error("GSC auth failed — no access_token returned");
  return access_token;
}

async function queryGsc(
  accessToken: string,
  siteUrl: string,
  date: string,
  dimensions: string[],
  rowLimit = 5000,
): Promise<GscRow[]> {
  const endpoint = `${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const body = {
    startDate: date,
    endDate: date,
    dimensions,
    rowLimit,
    type: "web",
  };
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`GSC query failed (${r.status}): ${txt.slice(0, 200)}`);
  }
  const data = (await r.json()) as GscResponse;
  return data.rows ?? [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth: only allow Vercel cron (or a manual trigger with the secret).
  const expected = process.env.CRON_SECRET;
  const provided = req.headers["authorization"]?.toString().replace(/^Bearer\s+/, "");
  if (!expected || !provided || provided !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.GSC_SITE_URL;
  if (!supabaseUrl || !supabaseKey || !siteUrl) {
    return res.status(500).json({
      error: "missing_env",
      missing: {
        SUPABASE_URL: !supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !supabaseKey,
        GSC_SITE_URL: !siteUrl,
      },
    });
  }

  try {
    const token = await getAccessToken();
    const date = isoYesterday();
    const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    // 1. Per-query × page rows
    const queryRows = await queryGsc(token, siteUrl, date, ["query", "page"]);
    const queryUpserts = queryRows.map((r) => ({
      date,
      query: r.keys[0] ?? "",
      page: r.keys[1] ?? null,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));
    if (queryUpserts.length > 0) {
      const { error } = await sb.from("gsc_queries").upsert(queryUpserts, { onConflict: "date,query,page" });
      if (error) throw new Error(`gsc_queries upsert failed: ${error.message}`);
    }

    // 2. Per-page rows
    const pageRows = await queryGsc(token, siteUrl, date, ["page"]);
    const pageUpserts = pageRows.map((r) => ({
      date,
      page: r.keys[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    }));
    if (pageUpserts.length > 0) {
      const { error } = await sb.from("gsc_pages").upsert(pageUpserts, { onConflict: "date,page" });
      if (error) throw new Error(`gsc_pages upsert failed: ${error.message}`);
    }

    // 3. Daily totals (no dimensions)
    const totalRows = await queryGsc(token, siteUrl, date, []);
    const t = totalRows[0];
    if (t) {
      const { error } = await sb.from("gsc_daily_totals").upsert(
        {
          date,
          clicks: t.clicks,
          impressions: t.impressions,
          ctr: t.ctr,
          avg_position: t.position,
        },
        { onConflict: "date" },
      );
      if (error) throw new Error(`gsc_daily_totals upsert failed: ${error.message}`);
    }

    return res.status(200).json({
      ok: true,
      date,
      queries_synced: queryUpserts.length,
      pages_synced: pageUpserts.length,
      daily_totals: t ? 1 : 0,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("gsc-sync error:", msg);
    return res.status(500).json({ error: msg });
  }
}
