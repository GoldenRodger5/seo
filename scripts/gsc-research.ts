/**
 * GSC research reports — the API-driven optimization finder.
 *
 * 1. STRIKING DISTANCE  — queries ranking 8–30 with real impressions: the
 *    classic highest-ROI set (a title/content nudge can cross to page 1).
 * 2. CTR GAPS           — ranking well but nobody clicks: title/description
 *    rewrite candidates.
 * 3. QUERY→PAGE MISMATCH — brand queries served by the wrong page (e.g. a
 *    compare page outranking the site's own review): internal-linking and
 *    title-targeting fixes.
 *
 * Run: npm run gsc-research   (90-day window)
 */
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleAuth } from "google-auth-library";
import { sites } from "../src/data/sites.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SA = resolve(ROOT, "twinkvault-3724c947baff.json");
const PROP = "https://twinkvault.com/";

async function main() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const auth = raw
    ? new GoogleAuth({ credentials: JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8")), scopes: ["https://www.googleapis.com/auth/webmasters"] })
    : existsSync(SA)
      ? new GoogleAuth({ keyFile: SA, scopes: ["https://www.googleapis.com/auth/webmasters"] })
      : null;
  if (!auth) throw new Error("no credentials");
  const client = await auth.getClient();
  const enc = encodeURIComponent(PROP);
  const sa = (body: unknown) =>
    client
      .request<{ rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[] }>({
        url: `https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`,
        method: "POST",
        data: body,
      })
      .then((r) => r.data.rows ?? []);

  const end = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - 92 * 86_400_000).toISOString().slice(0, 10);

  const qp = await sa({ startDate: start, endDate: end, dimensions: ["query", "page"], rowLimit: 500 });

  console.log("═══ 1. STRIKING DISTANCE (pos 8–30, imp ≥ 5) ═══");
  for (const r of qp.filter((r) => r.position >= 8 && r.position <= 30 && r.impressions >= 5).sort((a, b) => b.impressions - a.impressions).slice(0, 15)) {
    console.log(`  "${r.keys[0]}" pos=${r.position.toFixed(1)} imp=${r.impressions} → ${r.keys[1].replace("https://twinkvault.com", "")}`);
  }

  console.log("\n═══ 2. CTR GAPS (pos ≤ 12, imp ≥ 10, CTR < 3%) ═══");
  for (const r of qp.filter((r) => r.position <= 12 && r.impressions >= 10 && r.ctr < 0.03).sort((a, b) => b.impressions - a.impressions).slice(0, 10)) {
    console.log(`  "${r.keys[0]}" pos=${r.position.toFixed(1)} imp=${r.impressions} ctr=${(r.ctr * 100).toFixed(1)}% → ${r.keys[1].replace("https://twinkvault.com", "")}`);
  }

  console.log("\n═══ 3. BRAND QUERY → WRONG PAGE ═══");
  const byName = sites.map((s) => ({ slug: s.slug, name: s.name.toLowerCase().replace(/[^a-z0-9 ]/g, "") }));
  for (const r of qp.filter((r) => r.impressions >= 5)) {
    const q = r.keys[0].toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    const hit = byName.find((s) => q === s.name || q === s.name.replace(/\s+/g, "") || q.startsWith(s.name + " ") || q === s.slug.replace(/-/g, " "));
    if (!hit) continue;
    const servedPath = r.keys[1].replace("https://twinkvault.com", "");
    if (servedPath !== `/reviews/${hit.slug}`) {
      console.log(`  "${r.keys[0]}" (brand: ${hit.slug}) imp=${r.impressions} pos=${r.position.toFixed(1)} served by ${servedPath} — review is /reviews/${hit.slug}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
