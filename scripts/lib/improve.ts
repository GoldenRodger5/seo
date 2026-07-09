/**
 * Improve-existing task selection for the daily content engine.
 *
 * The engine's objective is "pick the single highest-value action each run" —
 * and when no CREATE candidate clears the value floor, the slot goes to
 * IMPROVING an existing weak page instead of manufacturing a marginal new one.
 *
 * Candidates come from the build's own audit snapshot (docs/content-audit.json:
 * per-route word counts + quality flags) intersected with what the engine can
 * actually regenerate (review bodies, AI comparison bodies, guide bodies).
 * Ranked by: strategic weight (money pages first) + GSC opportunity (pages
 * with impressions but poor position/CTR) + thinness gap. A ledger
 * (docs/improvement-log.json) prevents re-touching the same page within
 * IMPROVE_COOLDOWN_DAYS — improvement must be substantive, never cosmetic
 * freshness-faking, and never thrash.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import type { GscQueryAggregate } from "../../src/lib/contentRanker";

export interface ImproveTask {
  /** Live route, e.g. "/reviews/tla-gay-unlimited". */
  route: string;
  /** What the engine regenerates. */
  contentType: "review" | "comparison" | "guide";
  /** Content-file key: site slug / canonical pair slug / guide slug. */
  key: string;
  /** Words currently in the page's prerendered body (audit measurement). */
  pageWords: number;
  reasons: string[];
  score: number;
}

export const IMPROVE_COOLDOWN_DAYS = 14;

const WEIGHT: Record<ImproveTask["contentType"], number> = {
  review: 10, // money pages first
  comparison: 7,
  guide: 6,
};

const PAGE_FLOOR: Record<ImproveTask["contentType"], number> = {
  review: 800,
  comparison: 700,
  guide: 1000,
};

interface AuditRoute {
  route: string;
  pageType: string;
  bodyWordCount: number;
  flags: string[];
}

export function readLedger(ledgerPath: string): Record<string, string> {
  try {
    return JSON.parse(readFileSync(ledgerPath, "utf-8"));
  } catch {
    return {};
  }
}

export function stampLedger(ledgerPath: string, route: string): void {
  const ledger = readLedger(ledgerPath);
  ledger[route] = new Date().toISOString().slice(0, 10);
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n", "utf-8");
}

function underCooldown(ledger: Record<string, string>, route: string): boolean {
  const stamped = ledger[route];
  if (!stamped) return false;
  const ageDays = (Date.now() - new Date(stamped).getTime()) / 86_400_000;
  return ageDays < IMPROVE_COOLDOWN_DAYS;
}

/** GSC opportunity for a route: summed impressions×(1−CTR) of queries whose
 *  text overlaps the route's slug tokens. Same demand currency the create
 *  ranker uses, so create-vs-improve decisions compare like for like. */
function gscOpportunityFor(route: string, gsc: GscQueryAggregate[]): number {
  const tokens = route
    .split("/")
    .pop()!
    .split("-")
    .filter((t) => t.length >= 4);
  if (tokens.length === 0) return 0;
  let opp = 0;
  for (const q of gsc) {
    const lq = q.query.toLowerCase();
    if (tokens.some((t) => lq.includes(t))) opp += q.impressions * (1 - q.ctr);
  }
  return opp;
}

/**
 * Build the ranked improvement queue.
 *
 * @param auditPath      docs/content-audit.json (from the last build)
 * @param gsc            aggregated GSC queries ([] when unavailable)
 * @param ledgerPath     docs/improvement-log.json
 * @param improvableKeys which keys the engine can actually regenerate:
 *   reviews  — slugs present in reviewBodies (regeneratable body)
 *   compares — canonical pair slugs that are featured AND either already have
 *              an AI body (expand) or are flagged keep-quality pairs (add body)
 *   guides   — slugs in GUIDE_CONTENT
 */
export function buildImprovementQueue(
  auditPath: string,
  gsc: GscQueryAggregate[],
  ledgerPath: string,
  improvableKeys: {
    reviewSlugs: Set<string>;
    comparePairs: Set<string>;
    guideSlugs: Set<string>;
  },
): ImproveTask[] {
  if (!existsSync(auditPath)) return [];
  let audits: AuditRoute[];
  try {
    audits = (JSON.parse(readFileSync(auditPath, "utf-8")).audits ?? []) as AuditRoute[];
  } catch {
    return [];
  }
  const ledger = readLedger(ledgerPath);
  const tasks: ImproveTask[] = [];

  for (const a of audits) {
    let contentType: ImproveTask["contentType"] | null = null;
    let key = "";
    if (a.pageType === "review" && a.route.startsWith("/reviews/")) {
      key = a.route.slice("/reviews/".length);
      if (improvableKeys.reviewSlugs.has(key)) contentType = "review";
    } else if (a.pageType === "compare" && a.route.startsWith("/compare/")) {
      key = a.route.slice("/compare/".length);
      if (improvableKeys.comparePairs.has(key)) contentType = "comparison";
    } else if (a.pageType === "guide" && a.route.startsWith("/guide/")) {
      key = a.route.slice("/guide/".length);
      if (improvableKeys.guideSlugs.has(key)) contentType = "guide";
    }
    if (!contentType) continue;
    if (underCooldown(ledger, a.route)) continue;

    const floor = PAGE_FLOOR[contentType];
    const qualityFlags = a.flags.filter((f) =>
      ["WORD_COUNT_LOW", "NO_IMAGES", "LOW_INTERNAL_LINKS", "MISSING_OG_IMAGE"].includes(f),
    );
    const thin = a.bodyWordCount < floor;
    const opp = gscOpportunityFor(a.route, gsc);

    // A page qualifies for improvement if it's flagged/thin OR real search
    // demand says it's underperforming (impressions exist, page is weak).
    if (!thin && qualityFlags.length === 0 && opp < 100) continue;

    const reasons = [
      ...qualityFlags,
      ...(thin ? [`${a.bodyWordCount}w < ${floor}w floor`] : []),
      ...(opp > 0 ? [`gsc-opportunity=${Math.round(opp)}`] : []),
    ];
    const score =
      WEIGHT[contentType] +
      Math.min(20, Math.floor(opp / 500)) +
      (thin ? Math.min(8, Math.floor((floor - a.bodyWordCount) / 100)) : 0);

    tasks.push({ route: a.route, contentType, key, pageWords: a.bodyWordCount, reasons, score });
  }

  return tasks.sort((a, b) => b.score - a.score);
}
