/**
 * Suggest new content-queue items from live GSC demand.
 *
 * Pulls the top queries from Supabase `gsc_queries` over a 28-day
 * window, filters out queries that already have a matching page or
 * are already in the queue, ranks by opportunity (impressions × (1 -
 * CTR)), and prints a SUGGEST-ONLY list for the owner to review.
 *
 * NEVER auto-adds anything. Output is a markdown table the owner reads
 * and copies into content-queue.ts manually for items they want to
 * cover.
 *
 * Usage (with creds set in the local shell):
 *   SUPABASE_URL="https://...supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="..." \
 *   npx tsx scripts/suggest-content-from-gsc.ts
 *
 * Optional flags:
 *   --days 28        — lookback window (default 28)
 *   --top 30         — number of suggestions to surface (default 30)
 *   --json           — emit JSON instead of markdown
 */
import { fetchGscQueriesNode } from "./lib/gsc-node-client";
import { aggregateGscQueries } from "../src/lib/contentRanker";
import { reviewQueue, supportingQueue } from "../src/data/content-queue";
import { sites } from "../src/data/sites";

interface Suggestion {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  opportunity: number;
  guessType: "review" | "isworthit" | "alternatives" | "comparison" | "guide" | "best-of" | "unknown";
  guessSlug: string;
}

function classify(query: string): { type: Suggestion["guessType"]; slug: string } {
  const q = query.toLowerCase().trim();
  if (q.includes(" vs ")) {
    const slug = q.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-");
    return { type: "comparison", slug: `compare/${slug}` };
  }
  if (q.includes("alternatives to") || q.includes("alternative")) {
    const base = q.replace(/(best )?alternatives? (to )?/g, "").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
    return { type: "alternatives", slug: `${base}-alternatives` };
  }
  if (q.startsWith("is ") && q.includes("worth it")) {
    const base = q.replace(/^is /, "").replace(/ worth it.*$/, "").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
    return { type: "isworthit", slug: base };
  }
  if (q.endsWith(" review") || q.endsWith(" reviews")) {
    const base = q.replace(/ reviews?$/, "").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
    return { type: "review", slug: base };
  }
  if (q.startsWith("best ") || q.startsWith("cheapest ") || q.startsWith("top ")) {
    const slug = q.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-");
    return { type: "best-of", slug };
  }
  if (q.includes("how to") || q.includes("guide") || q.includes("explained")) {
    const slug = q.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-");
    return { type: "guide", slug: `guide/${slug}` };
  }
  return { type: "unknown", slug: q.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-") };
}

function isAlreadyCovered(slug: string): boolean {
  if (sites.some((s) => s.slug === slug)) return true;
  if (reviewQueue.some((r) => r.slug === slug)) return true;
  if (supportingQueue.some((s) => s.slug === slug)) return true;
  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const days = parseInt(args[args.indexOf("--days") + 1] || "28", 10);
  const top = parseInt(args[args.indexOf("--top") + 1] || "30", 10);
  const asJson = args.includes("--json");

  const rawGsc = await fetchGscQueriesNode(days);
  if (rawGsc.length === 0) {
    console.error(
      "[suggest] No GSC data returned. Either Supabase env vars aren't set, " +
      "no rows exist in the last " + days + " days, or the gsc-sync cron " +
      "hasn't populated the table yet. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY " +
      "and retry."
    );
    process.exit(2);
  }

  const aggregated = aggregateGscQueries(rawGsc);
  const suggestions: Suggestion[] = aggregated
    .filter((q) => q.impressions >= 50)
    .map((q) => {
      const { type, slug } = classify(q.query);
      return {
        query: q.query,
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: q.ctr,
        opportunity: q.impressions * (1 - q.ctr),
        guessType: type,
        guessSlug: slug,
      };
    })
    .filter((s) => !isAlreadyCovered(s.guessSlug))
    .sort((a, b) => b.opportunity - a.opportunity)
    .slice(0, top);

  if (asJson) {
    console.log(JSON.stringify(suggestions, null, 2));
    return;
  }

  console.log(`# Suggested new content items — from ${days}d GSC, top ${top} by opportunity\n`);
  console.log(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  console.log(`Source rows: ${rawGsc.length}, aggregated queries: ${aggregated.length}, surfaced after filtering: ${suggestions.length}\n`);
  console.log(`| # | Opportunity | Impressions | CTR | Query | Guess type | Suggested slug |`);
  console.log(`| --- | ---: | ---: | ---: | --- | --- | --- |`);
  suggestions.forEach((s, i) => {
    console.log(
      `| ${i + 1} | ${Math.round(s.opportunity)} | ${s.impressions} | ${(s.ctr * 100).toFixed(2)}% | ${s.query} | ${s.guessType} | \`${s.guessSlug}\` |`,
    );
  });
  console.log(`\n_Suggestions only. Review and add the ones you want to content-queue.ts manually._`);
}

main().catch((e) => { console.error(e); process.exit(1); });
