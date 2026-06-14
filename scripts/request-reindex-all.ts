/**
 * Manual recovery script — submits the most important URLs to Google's
 * Indexing API + Bing's IndexNow in a single batch run.
 *
 * Use this after a crawl-block incident (like the June 2026 robots.txt
 * regression) to nudge Google + Bing to recrawl quickly instead of
 * waiting for organic discovery.
 *
 * URL set (default ~50): homepage + /top-sites + /reviews index +
 * top-10 reviews by score + every /niche/* + every /best-* SEO landing
 * + every /alternatives/* with AI content + top 10 compare pages by
 * priority.
 *
 * Respects Google's 200-URL/day soft quota by capping at 200 and warning
 * if the batch exceeds it.
 *
 * Run with: npx tsx scripts/request-reindex-all.ts [--dry-run]
 *
 * Env required:
 *   GOOGLE_SERVICE_ACCOUNT_JSON — service-account JSON or base64-encoded
 *   BING_INDEXNOW_KEY           — IndexNow GUID (must also be hosted at
 *                                  https://twinkvault.com/{key}.txt)
 */
import { GoogleAuth } from "google-auth-library";
import { sites } from "../src/data/sites.js";
import { ALTERNATIVES_CONTENT } from "../src/data/alternatives-content.js";
import { getFeaturedComparePairsList } from "../src/data/featured-compare-pairs.js";

const BASE_URL = "https://twinkvault.com";
const NICHE_SLUGS = [
  "twink","bareback","asian","latin","bear","daddy","college","military",
  "amateur","big-dick","jock","uncut","hairy","smooth","group","fetish",
  "interracial","muscle","str8-curious","japanese","solo",
];
const SEO_LANDING_SLUGS = [
  "/top-sites","/reviews","/best-deals","/compare","/best-twink-sites",
  "/free-trial-twink-sites","/cheapest-twink-sites","/best-bareback-gay-sites",
  "/best-asian-gay-sites","/best-amateur-gay-sites","/best-premium-gay-sites",
  "/best-daddy-twink-sites","/best-gay-sites-under-10","/best-gay-twink-sites-2026",
  "/best-gay-porn-sites","/best-twink-porn-sites","/best-value-gay-porn-sites",
  "/gay-porn-sites-ranked","/gay-porn-site-reviews",
];

function buildUrlList(): string[] {
  const urls = new Set<string>();
  urls.add(`${BASE_URL}/`);
  for (const p of SEO_LANDING_SLUGS) urls.add(`${BASE_URL}${p}`);
  for (const n of NICHE_SLUGS) urls.add(`${BASE_URL}/niche/${n}`);

  // Top-10 reviews by overall score (drop pending-review since they have
  // no editorial body — no point asking Google to crawl them yet).
  const rankedReviews = [...sites]
    .filter((s) => s.editorial_status !== "pending-review")
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 10);
  for (const s of rankedReviews) urls.add(`${BASE_URL}/reviews/${s.slug}`);

  // Featured compare pairs (these are the only ones noindex'd → indexed
  // anyway, but featured = highest priority for crawl).
  for (const pair of getFeaturedComparePairsList().slice(0, 10)) {
    urls.add(`${BASE_URL}/compare/${pair}`);
  }

  // Alternatives pages with actual AI body content.
  const LEGACY = new Set(["helix-studios-alternatives","sean-cody-alternatives","nakedsword-alternatives"]);
  for (const k of Object.keys(ALTERNATIVES_CONTENT)) {
    if (LEGACY.has(k)) urls.add(`${BASE_URL}/${k}`);
    else urls.add(`${BASE_URL}/alternatives/${k.replace(/-alternatives$/, "")}`);
  }

  return [...urls];
}

async function pingGoogle(urls: string[], dryRun: boolean): Promise<{ ok: number; fail: number }> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.error("✗ GOOGLE_SERVICE_ACCOUNT_JSON not set — cannot ping Google.");
    return { ok: 0, fail: urls.length };
  }
  if (dryRun) {
    console.log(`[dry-run] Would submit ${urls.length} URLs to Google Indexing API`);
    return { ok: urls.length, fail: 0 };
  }
  const decoded = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  const credentials = JSON.parse(decoded);
  const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/indexing"] });
  const client = await auth.getClient();
  let ok = 0, fail = 0;
  for (const url of urls) {
    try {
      await client.request({
        url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
        method: "POST",
        data: { url, type: "URL_UPDATED" },
      });
      ok++;
      console.log(`  ✓ ${url}`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${url}: ${(e as Error).message}`);
    }
    // 100ms between requests to avoid rate-limiting
    await new Promise((r) => setTimeout(r, 100));
  }
  return { ok, fail };
}

async function pingBing(urls: string[], dryRun: boolean): Promise<{ ok: number; fail: number }> {
  const key = process.env.BING_INDEXNOW_KEY;
  if (!key) {
    console.error("✗ BING_INDEXNOW_KEY not set — cannot ping Bing.");
    return { ok: 0, fail: urls.length };
  }
  if (dryRun) {
    console.log(`[dry-run] Would submit ${urls.length} URLs to Bing IndexNow`);
    return { ok: urls.length, fail: 0 };
  }
  // IndexNow accepts up to 10,000 URLs per request — single batch is fine.
  try {
    const r = await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ host: "twinkvault.com", key, keyLocation: `https://twinkvault.com/${key}.txt`, urlList: urls }),
    });
    if (r.ok) {
      console.log(`  ✓ Bing IndexNow accepted batch of ${urls.length} URLs (${r.status})`);
      return { ok: urls.length, fail: 0 };
    }
    console.log(`  ✗ Bing IndexNow rejected (${r.status})`);
    return { ok: 0, fail: urls.length };
  } catch (e) {
    console.log(`  ✗ Bing IndexNow error: ${(e as Error).message}`);
    return { ok: 0, fail: urls.length };
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const skipBing = process.argv.includes("--skip-bing") || !process.env.BING_INDEXNOW_KEY;
  const skipGoogle = process.argv.includes("--skip-google");
  const urls = buildUrlList();
  console.log(`Built URL list: ${urls.length} URLs`);

  // Google's free Indexing API quota is 200 URLs/day for most properties.
  if (urls.length > 200) {
    console.warn(`⚠ ${urls.length} URLs exceeds Google's 200/day default quota. Truncating to top 200.`);
  }
  const submitUrls = urls.slice(0, 200);

  let gFail = 0;
  if (skipGoogle) {
    console.log(`\nSkipping Google Indexing API (--skip-google).`);
  } else {
    console.log(`\nPinging Google Indexing API (${submitUrls.length} URLs)...`);
    const g = await pingGoogle(submitUrls, dryRun);
    console.log(`Google: ${g.ok} ok, ${g.fail} failed\n`);
    gFail = g.fail;
  }

  let bFail = 0;
  if (skipBing) {
    const reason = process.argv.includes("--skip-bing") ? "--skip-bing flag" : "BING_INDEXNOW_KEY not set";
    console.log(`Skipping Bing IndexNow (${reason}).`);
  } else {
    console.log(`Pinging Bing IndexNow (${urls.length} URLs in single batch)...`);
    const b = await pingBing(urls, dryRun);
    console.log(`Bing: ${b.ok} ok, ${b.fail} failed\n`);
    bFail = b.fail;
  }

  if (gFail > 0 || bFail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
