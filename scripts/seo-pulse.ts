/**
 * Weekly SEO pulse — the early-warning system.
 *
 * Pulls GSC (last 7 days vs the 7 before), inspects the tracked money-page
 * set, and writes a dated report + a machine-readable verdict:
 *
 *   IMPROVING — impressions up meaningfully week-over-week, or index count up
 *   FLAT      — no meaningful change
 *   STALLED   — impressions flat/down AND index count flat, two data points in
 *
 * The GitHub workflow (.github/workflows/seo-pulse.yml) commits the report and
 * OPENS AN ISSUE when the verdict is STALLED twice in a row — a loud flag that
 * arrives by email instead of being discovered a month later.
 *
 * Run: npm run seo-pulse   (GOOGLE_SERVICE_ACCOUNT_JSON env, or the local
 * gitignored service-account file)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleAuth } from "google-auth-library";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SA_FILE = resolve(ROOT, "twinkvault-3724c947baff.json");
const PROP = "https://twinkvault.com/";
const HISTORY = resolve(ROOT, "docs/seo-pulse-history.json");
const REPORT_DIR = resolve(ROOT, "docs/seo-pulse");

/** Head terms the site historically ranked page-1 for — the recovery gauge. */
const TRACKED_QUERIES = ["best twink sites", "twink sites", "best gay twink sites", "twink websites", "twinktrade discount", "brothercrush review", "wuboyz", "militarydick review", "boysatcamp review"];

/** Money pages whose index state we track (URL Inspection). */
const TRACKED_PAGES = [
  "/", "/top-sites", "/best-twink-sites", "/guides",
  "/niche/twink", "/niche/bareback", "/niche/amateur", "/niche/asian", "/niche/daddy",
  "/reviews/helix-studios", "/reviews/men", "/reviews/sean-cody", "/reviews/nakedsword",
  "/reviews/twinks-in-shorts", "/reviews/athletic-twinks", "/reviews/peterfever", "/reviews/sayuncle",
  "/reviews/bromo", "/reviews/falcon-studios", "/reviews/active-duty",
  "/reviews/next-door-studios", "/reviews/hot-house", "/reviews/falcon-edge",
  "/guide/gay-porn-billing-guide", "/guide/how-to-cancel-gay-porn-subscriptions", "/discount/twinktrade",
  "/reviews/brothercrush", "/reviews/wuboyz", "/reviews/boysatcamp", "/reviews/militarydick", "/reviews/twinktrade", "/reviews/yesfather",
];

interface Pulse {
  date: string;
  imp7: number;
  clicks7: number;
  pos7: number | null;
  impPrior7: number;
  earningPages7: number;
  indexedCount: number;
  headTerms: Record<string, { imp: number; pos: number } | null>;
  verdict: "IMPROVING" | "FLAT" | "STALLED";
}

async function main() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const auth = raw
    ? new GoogleAuth({ credentials: JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8")), scopes: ["https://www.googleapis.com/auth/webmasters"] })
    : existsSync(SA_FILE)
      ? new GoogleAuth({ keyFile: SA_FILE, scopes: ["https://www.googleapis.com/auth/webmasters"] })
      : null;
  if (!auth) { console.error("no Google credentials"); process.exit(1); }
  const client = await auth.getClient();
  const enc = encodeURIComponent(PROP);
  const sa = (body: unknown) =>
    client
      .request<{ rows?: { keys?: string[]; clicks: number; impressions: number; position: number }[] }>({
        url: `https://www.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`,
        method: "POST",
        data: body,
      })
      .then((r) => r.data.rows ?? []);

  // GSC data lags ~2 days; anchor the window there.
  const day = 86_400_000;
  const endD = new Date(Date.now() - 2 * day);
  const d = (x: Date) => x.toISOString().slice(0, 10);
  const end = d(endD);
  const start = d(new Date(endD.getTime() - 6 * day));
  const priorEnd = d(new Date(endD.getTime() - 7 * day));
  const priorStart = d(new Date(endD.getTime() - 13 * day));

  const [cur, prior, pages, queries] = await Promise.all([
    sa({ startDate: start, endDate: end, dimensions: [] }),
    sa({ startDate: priorStart, endDate: priorEnd, dimensions: [] }),
    sa({ startDate: start, endDate: end, dimensions: ["page"], rowLimit: 100 }),
    sa({ startDate: start, endDate: end, dimensions: ["query"], rowLimit: 200 }),
  ]);
  const imp7 = cur[0]?.impressions ?? 0;
  const clicks7 = cur[0]?.clicks ?? 0;
  const pos7 = cur[0]?.position ?? null;
  const impPrior7 = prior[0]?.impressions ?? 0;
  const earningPages7 = pages.length;

  const headTerms: Pulse["headTerms"] = {};
  for (const q of TRACKED_QUERIES) {
    const row = queries.find((r) => r.keys?.[0] === q);
    headTerms[q] = row ? { imp: row.impressions, pos: Math.round(row.position * 10) / 10 } : null;
  }

  // Index states (URL Inspection, sequential to be quota-polite).
  let indexedCount = 0;
  const states: Record<string, string> = {};
  for (const path of TRACKED_PAGES) {
    try {
      const res = await client.request<{ inspectionResult?: { indexStatusResult?: { coverageState?: string } } }>({
        url: "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        method: "POST",
        data: { inspectionUrl: `https://twinkvault.com${path === "/" ? "/" : path}`, siteUrl: PROP },
      });
      const cov = res.data.inspectionResult?.indexStatusResult?.coverageState ?? "?";
      states[path] = cov;
      if (cov.startsWith("Submitted and indexed")) indexedCount++;
    } catch {
      states[path] = "ERR";
    }
  }

  // History + verdict
  const history: Pulse[] = existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, "utf-8")) : [];
  const prevIndexed = history.length ? history[history.length - 1].indexedCount : null;
  const impUp = imp7 >= impPrior7 * 1.15 && imp7 >= impPrior7 + 5;
  const impFlatOrDown = imp7 <= impPrior7;
  const indexUp = prevIndexed !== null && indexedCount > prevIndexed;
  const verdict: Pulse["verdict"] = impUp || indexUp ? "IMPROVING" : impFlatOrDown ? "STALLED" : "FLAT";

  const pulse: Pulse = { date: end, imp7, clicks7, pos7, impPrior7, earningPages7, indexedCount, headTerms, verdict };
  history.push(pulse);
  writeFileSync(HISTORY, JSON.stringify(history, null, 2) + "\n");

  // Dated human report
  mkdirSync(REPORT_DIR, { recursive: true });
  const lines = [
    `# SEO Pulse — ${end}`,
    "",
    `**VERDICT: ${verdict}**`,
    "",
    `| metric | this 7d | prior 7d |`,
    `| --- | ---: | ---: |`,
    `| impressions | ${imp7} | ${impPrior7} |`,
    `| clicks | ${clicks7} | ${prior[0]?.clicks ?? 0} |`,
    `| avg position | ${pos7?.toFixed(1) ?? "—"} | ${prior[0]?.position?.toFixed(1) ?? "—"} |`,
    `| pages earning impressions | ${earningPages7} | — |`,
    `| tracked money pages indexed | ${indexedCount}/${TRACKED_PAGES.length}${prevIndexed !== null ? ` (prev ${prevIndexed})` : ""} | — |`,
    "",
    "## Head-term recovery gauge (April baseline: pos 3–7)",
    ...TRACKED_QUERIES.map((q) => {
      const h = headTerms[q];
      return `- "${q}": ${h ? `pos ${h.pos} (${h.imp} imp)` : "no impressions"}`;
    }),
    "",
    "## Tracked page states",
    ...Object.entries(states).map(([p, s]) => `- ${p}: ${s}`),
  ];
  writeFileSync(resolve(REPORT_DIR, `${end}.md`), lines.join("\n") + "\n");

  // Machine-readable outputs for the workflow.
  const consecutiveStalls = [...history].reverse().findIndex((p) => p.verdict !== "STALLED");
  const stallStreak = consecutiveStalls === -1 ? history.length : consecutiveStalls;
  writeFileSync(resolve(ROOT, "docs/seo-pulse-verdict.txt"), `${verdict}\nstall_streak=${stallStreak}\n`);

  console.log(`SEO pulse ${end}: ${verdict} — imp ${impPrior7}→${imp7}, indexed ${prevIndexed ?? "?"}→${indexedCount}/${TRACKED_PAGES.length}, stall streak ${stallStreak}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
