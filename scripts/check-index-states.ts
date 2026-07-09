/**
 * Re-inspect the 20 crawl-pump URLs (docs/index-request-baseline.json) via
 * the URL Inspection API and report each one's state NOW vs its captured
 * baseline — the scoreboard for whether the manual Request Indexing batch +
 * Indexing API reindex triggered crawls and crawl trust is rebuilding.
 *
 * Run: npm run index-check
 * Auth: GOOGLE_SERVICE_ACCOUNT_JSON env, or the local service-account file.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleAuth } from "google-auth-library";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = resolve(ROOT, "docs/index-request-baseline.json");
const SA_FILE = resolve(ROOT, "twinkvault-3724c947baff.json");
const PROP = "https://twinkvault.com/";

/** Order matters: later = better. Used to mark improvements. */
const LADDER = ["URL is unknown to Google", "Discovered - currently not indexed", "Crawled - currently not indexed", "Submitted and indexed"];
const rung = (state: string): number => LADDER.findIndex((s) => state.startsWith(s));

async function main() {
  const baseline = JSON.parse(readFileSync(BASELINE, "utf-8")) as {
    captured: string;
    urls: { rank: number; path: string; baseline: string }[];
  };

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const auth = raw
    ? new GoogleAuth({ credentials: JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8")), scopes: ["https://www.googleapis.com/auth/webmasters"] })
    : existsSync(SA_FILE)
      ? new GoogleAuth({ keyFile: SA_FILE, scopes: ["https://www.googleapis.com/auth/webmasters"] })
      : null;
  if (!auth) {
    console.error("No GOOGLE_SERVICE_ACCOUNT_JSON env and no local service-account file — cannot inspect.");
    process.exit(1);
  }
  const client = await auth.getClient();

  console.log(`Index-state check vs baseline captured ${baseline.captured}\n`);
  let improved = 0, indexed = 0, same = 0, regressed = 0;
  for (const u of baseline.urls) {
    let now = "?";
    let crawl = "";
    try {
      const res = await client.request<{ inspectionResult?: { indexStatusResult?: { coverageState?: string; lastCrawlTime?: string } } }>({
        url: "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        method: "POST",
        data: { inspectionUrl: `https://twinkvault.com${u.path}`, siteUrl: PROP },
      });
      const r = res.data.inspectionResult?.indexStatusResult ?? {};
      now = r.coverageState ?? "?";
      crawl = r.lastCrawlTime ? ` (lastCrawl ${r.lastCrawlTime.slice(0, 10)})` : " (never crawled)";
    } catch (e) {
      now = `ERR: ${(e as Error).message?.slice(0, 60)}`;
    }
    const before = rung(u.baseline);
    const after = rung(now);
    let mark = "＝ same";
    if (after > before && after >= 0) { mark = "▲ IMPROVED"; improved++; }
    else if (after < before && after >= 0 && before >= 0) { mark = "▼ regressed"; regressed++; }
    else same++;
    if (now.startsWith("Submitted and indexed")) indexed++;
    console.log(`${String(u.rank).padStart(2)}. ${u.path}`);
    console.log(`    was: ${u.baseline}`);
    console.log(`    now: ${now}${crawl}   ${mark}`);
  }
  console.log(`\nSummary: ${improved} improved · ${same} unchanged · ${regressed} regressed · ${indexed}/20 indexed`);
}

main().catch((e) => { console.error(e); process.exit(1); });
