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

const managed: Redirect[] = activeDemotionRedirects().map(({ pair, dest }) => ({
  source: `/compare/${pair}`,
  destination: dest,
  permanent: true,
}));

config.redirects = [...foreign, ...managed];
if (config.redirects.length === 0) delete config.redirects;

writeFileSync(VERCEL_JSON, JSON.stringify(config, null, 2) + "\n", "utf-8");
console.log(
  `vercel.json redirects synced: ${managed.length} active compare demotions` +
  (foreign.length ? ` (+${foreign.length} unmanaged redirects preserved)` : ""),
);
