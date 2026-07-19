/**
 * Price-history snapshotter — the compounding moat.
 *
 * Appends today's pricing for every site to docs/price-history.json.
 * Nobody in this niche tracks price history; after a few months of
 * weekly snapshots we can ship per-site price-history charts and
 * "price drop" callouts no competitor can retroactively fake.
 *
 * Idempotent per day. Run weekly via .github/workflows/price-snapshot.yml
 * or manually: npx tsx scripts/snapshot-prices.ts
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { sites } from "../src/data/sites.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = resolve(ROOT, "docs/price-history.json");

const today = new Date().toISOString().slice(0, 10);
const history: Record<string, Record<string, { m: string; a: string; d: number }>> =
  existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf-8")) : {};

if (history[today]) {
  console.log(`Snapshot for ${today} already exists (${Object.keys(history[today]).length} sites) — nothing to do.`);
  process.exit(0);
}

history[today] = {};
for (const s of sites) {
  history[today][s.slug] = { m: s.price_monthly, a: s.price_annual, d: s.deal_discount };
}
writeFileSync(FILE, JSON.stringify(history, null, 1) + "\n");
console.log(`Snapshot ${today}: ${sites.length} sites recorded (${Object.keys(history).length} total snapshots).`);
