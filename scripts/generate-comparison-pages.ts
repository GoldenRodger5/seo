/**
 * Generate src/data/comparisons.ts — a list of high-value comparison pairs
 * weighted by:
 *   - Shared primary niche (drives search-volume potential)
 *   - Top-30 by overall_score (filter out low-rank pairs)
 *   - Affiliate URLs on at least one side (we can monetise the verdict)
 *
 * Run:  npx tsx scripts/generate-comparison-pages.ts
 *
 * Output: rewrites the `comparisonPairs` array in src/data/comparisons.ts.
 * Manually-edited entries OUTSIDE that array are preserved (only the array
 * literal is replaced).
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { sites } from "../src/data/sites.js";
import { siteNicheMap } from "../src/data/site-niches.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = resolve(__dirname, "..", "src/data/comparisons.ts");
const TOP_N = 30;
const TARGET_PAIRS = 50;

type Pair = {
  slug: string;
  siteA: string;
  siteB: string;
  primaryNiche: string | null;
  suggestedWinner: string;
  suggestedRunnerUp: string;
  priority: number;
};

const parsePrice = (s: string): number => {
  const m = s.match(/\$?([\d.]+)/);
  return m ? parseFloat(m[1]) : Infinity;
};

const candidates = [...sites]
  .sort((a, b) => b.overall_score - a.overall_score)
  .slice(0, TOP_N);

const pairs: Pair[] = [];
for (let i = 0; i < candidates.length; i++) {
  for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i];
    const b = candidates[j];

    const aNiches = new Set(siteNicheMap[a.slug] ?? []);
    const bNiches = siteNicheMap[b.slug] ?? [];
    const shared = bNiches.filter((n) => aNiches.has(n));
    if (shared.length === 0) continue; // require niche overlap

    const winner = a.overall_score >= b.overall_score ? a : b;
    const cheaper = parsePrice(a.price_annual) <= parsePrice(b.price_annual) ? a : b;
    const runnerUp = winner.slug === cheaper.slug ? (winner.slug === a.slug ? b : a) : cheaper;

    const slugSorted = [a.slug, b.slug].sort();

    // Priority: niche-overlap depth + score similarity + monetisation
    const overlapBonus = Math.min(shared.length, 3); // 1..3
    const scoreCloseness = 5 - Math.min(5, Math.abs(a.overall_score - b.overall_score) * 2);
    const monetised = a.affiliate_url || b.affiliate_url ? 1 : 0;
    const priority = Math.min(5, Math.round((overlapBonus + scoreCloseness / 2 + monetised) / 1.6));

    pairs.push({
      slug: `${slugSorted[0]}-vs-${slugSorted[1]}`,
      siteA: slugSorted[0],
      siteB: slugSorted[1],
      primaryNiche: shared[0],
      suggestedWinner: winner.slug,
      suggestedRunnerUp: runnerUp.slug,
      priority,
    });
  }
}

pairs.sort((x, y) => y.priority - x.priority);
const trimmed = pairs.slice(0, TARGET_PAIRS);

const literal = JSON.stringify(trimmed, null, 2);

const src = readFileSync(TARGET_FILE, "utf-8");
const next = src.replace(
  /export const comparisonPairs: ComparisonPair\[\] = \[[\s\S]*?\];/,
  `export const comparisonPairs: ComparisonPair[] = ${literal};`
);

writeFileSync(TARGET_FILE, next, "utf-8");

console.log(`Generated ${trimmed.length} comparison pairs → src/data/comparisons.ts`);
console.log(`  Top niche-overlap pair: ${trimmed[0]?.slug} (priority ${trimmed[0]?.priority})`);
console.log(`  Niches covered: ${new Set(trimmed.map((p) => p.primaryNiche)).size}`);
