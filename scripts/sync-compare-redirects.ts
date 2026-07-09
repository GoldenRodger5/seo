/**
 * Sync vercel.json's compare-demotion 301s with the ACTIVE tranches in
 * src/data/compare-demotions.ts.
 *
 * Run after activating a tranche:
 *   npm run compare-redirects
 * then commit vercel.json + compare-demotions.ts together.
 *
 * The redirects live in a managed block: every redirect whose source starts
 * with /compare/ is owned by this script (replaced wholesale on each run);
 * any other redirects in vercel.json are preserved untouched. Vercel reads
 * vercel.json from the repo, so redirects take effect on the next deploy.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { activeDemotionRedirects } from "../src/data/compare-demotions.js";
import { ORPHANED_COMPARE_REDIRECTS } from "../src/data/compare-orphan-redirects.js";
import { getFeaturedComparePairsList } from "../src/data/featured-compare-pairs.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERCEL_JSON = resolve(ROOT, "vercel.json");

interface Redirect {
  source: string;
  destination: string;
  permanent?: boolean;
}

const config = JSON.parse(readFileSync(VERCEL_JSON, "utf-8"));
const existing: Redirect[] = Array.isArray(config.redirects) ? config.redirects : [];
const foreign = existing.filter((r) => !r.source.startsWith("/compare/"));

const managed = new Map<string, string>(); // source path → destination
const add = (pair: string, dest: string) => {
  const source = `/compare/${pair}`;
  if (!managed.has(source)) managed.set(source, dest);
};

// 1. Active demotions — BOTH slug orders → mapped review (Google learned
//    non-canonical orders from the engine's pre-canonicalization pings).
for (const { pair, dest } of activeDemotionRedirects()) {
  const [a, b] = pair.split("-vs-");
  add(pair, dest);
  add(`${b}-vs-${a}`, dest);
}

// 2. Reversed order of every FEATURED pair → 308 to the canonical URL
//    (consolidates instead of serving a duplicate at 200).
for (const pair of getFeaturedComparePairsList()) {
  const [a, b] = pair.split("-vs-");
  add(`${b}-vs-${a}`, `/compare/${pair}`);
}

// 3. Orphaned pairs from old score-drifted featured sets (GSC-known 404s).
for (const { pair, dest } of ORPHANED_COMPARE_REDIRECTS) add(pair, dest);

const managedList: Redirect[] = [...managed.entries()].map(([source, destination]) => ({
  source,
  destination,
  permanent: true,
}));

config.redirects = [...foreign, ...managedList];
if (config.redirects.length === 0) delete config.redirects;

writeFileSync(VERCEL_JSON, JSON.stringify(config, null, 2) + "\n", "utf-8");
console.log(
  `vercel.json redirects synced: ${managedList.length} managed compare redirects ` +
  `(demotions both-orders + featured-reversed + orphans)` +
  (foreign.length ? ` (+${foreign.length} unmanaged preserved)` : ""),
);
if (managedList.length + foreign.length > 1024) {
  console.error("✗ Vercel redirect limit (1024) exceeded — trim before deploying!");
  process.exit(1);
}
