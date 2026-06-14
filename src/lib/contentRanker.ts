/**
 * Demand-driven re-ranker for the content queue.
 *
 * Static priority (from src/data/content-queue.ts) is the editorial
 * floor — it captures what the owner cares about strategically. GSC
 * demand data layers ON TOP via:
 *
 *   effective_priority =
 *     static_priority
 *     + demand_bonus           (capped at +20)
 *     - cannibalization_penalty
 *     - no_affiliate_penalty   (research-only reviews only)
 *     - duplication_penalty    (already-published topics)
 *
 * Never publishes anything that wasn't queued. Only re-orders.
 */
import type { ReviewQueueEntry, SupportingQueueEntry } from "../data/content-queue";

export interface GscQueryAggregate {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number; // 0–1
}

interface CandidateRanker {
  staticPriority: number;
  demandBonus: number;
  cannibalizationPenalty: number;
  noAffiliatePenalty: number;
  duplicationPenalty: number;
  effective: number;
  matchedQueries: { query: string; impressions: number; opportunity: number }[];
}

const DEMAND_BONUS_CAP = 20;
const CANNIBALIZATION_PENALTY = 10;
const NO_AFFILIATE_PENALTY = 5;
const DUPLICATION_PENALTY = 100;

/**
 * Collapse raw GSC query rows (potentially many rows per query across
 * dates) into per-query totals + average CTR.
 */
export function aggregateGscQueries(
  rows: { query: string; impressions: number; clicks: number; ctr: number }[],
): GscQueryAggregate[] {
  const map = new Map<string, { impressions: number; clicks: number }>();
  for (const r of rows) {
    const q = r.query.toLowerCase().trim();
    if (!q) continue;
    const cur = map.get(q) ?? { impressions: 0, clicks: 0 };
    cur.impressions += r.impressions ?? 0;
    cur.clicks += r.clicks ?? 0;
    map.set(q, cur);
  }
  return [...map.entries()].map(([query, d]) => ({
    query,
    impressions: d.impressions,
    clicks: d.clicks,
    ctr: d.impressions > 0 ? d.clicks / d.impressions : 0,
  }));
}

/**
 * Per-query opportunity score = impressions × (1 - CTR). High = we
 * rank for it but aren't converting; new/better content could capture
 * the missed clicks.
 */
function opportunityScore(q: GscQueryAggregate): number {
  return q.impressions * (1 - q.ctr);
}

/**
 * Build a set of route slugs (existing pages) that compete with a new
 * keyword. Caller supplies the existing route paths so this stays
 * framework-agnostic.
 */
export interface CannibalizationIndex {
  /** Map keyword → list of existing routes that already target it. */
  routesByKeyword: Map<string, string[]>;
  /** Set of slugs that already exist in sites.ts or have been published. */
  existingSlugs: Set<string>;
}

/**
 * Build the demand-and-collision index from GSC data + route table +
 * existing slugs.
 */
export function buildIndex(
  gscRows: GscQueryAggregate[],
  routes: string[],
  existingSlugs: Iterable<string>,
): {
  queries: GscQueryAggregate[];
  routesByKeyword: Map<string, string[]>;
  existingSlugs: Set<string>;
} {
  const routesByKeyword = new Map<string, string[]>();
  for (const r of routes) {
    const tokens = r
      .replace(/^\/+/, "")
      .split("/")
      .pop()!
      .split("-")
      .filter((t) => t.length >= 3);
    if (tokens.length === 0) continue;
    const key = tokens.join(" ").toLowerCase();
    if (!routesByKeyword.has(key)) routesByKeyword.set(key, []);
    routesByKeyword.get(key)!.push(r);
  }
  return {
    queries: gscRows,
    routesByKeyword,
    existingSlugs: new Set(existingSlugs),
  };
}

function findMatchingQueries(
  candidateKeywords: string[],
  gscQueries: GscQueryAggregate[],
): { query: string; impressions: number; opportunity: number }[] {
  const matches: { query: string; impressions: number; opportunity: number }[] = [];
  for (const q of gscQueries) {
    const lq = q.query.toLowerCase();
    const ok = candidateKeywords.some((kw) => {
      const lkw = kw.toLowerCase();
      // Match by substring in either direction. Use word boundaries
      // for short keywords to avoid spurious matches.
      if (lkw.length >= 5) return lq.includes(lkw) || lkw.includes(lq);
      // Short keyword: require word-boundary
      return new RegExp(`\\b${lkw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lq);
    });
    if (ok) {
      matches.push({ query: q.query, impressions: q.impressions, opportunity: opportunityScore(q) });
    }
  }
  return matches.sort((a, b) => b.opportunity - a.opportunity);
}

function cannibalizationFor(
  candidateKeywords: string[],
  routesByKeyword: Map<string, string[]>,
): number {
  let penalty = 0;
  for (const kw of candidateKeywords) {
    const lkw = kw.toLowerCase();
    for (const [routeKw] of routesByKeyword) {
      // Compute token overlap. If ≥ 60% of the candidate's tokens
      // appear in an existing route's keyword, count as a hit.
      const cTokens = lkw.split(/\s+/).filter((t) => t.length >= 3);
      const rTokens = new Set(routeKw.split(/\s+/).filter((t) => t.length >= 3));
      if (cTokens.length === 0) continue;
      const overlap = cTokens.filter((t) => rTokens.has(t)).length / cTokens.length;
      if (overlap >= 0.6) {
        penalty += CANNIBALIZATION_PENALTY;
        break; // one penalty per candidate, not per match
      }
    }
  }
  return penalty;
}

export function rankReview(
  entry: ReviewQueueEntry,
  index: { queries: GscQueryAggregate[]; routesByKeyword: Map<string, string[]>; existingSlugs: Set<string> },
): CandidateRanker {
  // What queries this entry is meant to capture: site name + slug words
  const keywords = [
    entry.name.toLowerCase(),
    entry.slug.replace(/-/g, " "),
    `${entry.name.toLowerCase()} review`,
    `is ${entry.name.toLowerCase()} worth it`,
  ];
  const matched = findMatchingQueries(keywords, index.queries);
  const totalOpportunity = matched.reduce((s, m) => s + m.opportunity, 0);
  // Scale: every 500 missed-impressions ≈ +1 priority point, capped.
  const demandBonus = Math.min(DEMAND_BONUS_CAP, Math.floor(totalOpportunity / 500));

  const cannibalization = cannibalizationFor([entry.name, entry.slug.replace(/-/g, " ")], index.routesByKeyword);
  const duplication = index.existingSlugs.has(entry.slug) ? DUPLICATION_PENALTY : 0;
  const noAffiliate =
    entry.editorial_mode === "research-only" || entry.affiliate_url === null
      ? NO_AFFILIATE_PENALTY
      : 0;

  return {
    staticPriority: entry.priority,
    demandBonus,
    cannibalizationPenalty: cannibalization,
    noAffiliatePenalty: noAffiliate,
    duplicationPenalty: duplication,
    effective: entry.priority + demandBonus - cannibalization - noAffiliate - duplication,
    matchedQueries: matched.slice(0, 5),
  };
}

export function rankSupporting(
  entry: SupportingQueueEntry,
  index: { queries: GscQueryAggregate[]; routesByKeyword: Map<string, string[]>; existingSlugs: Set<string> },
): CandidateRanker {
  const keywords = [entry.target_keyword, entry.slug.replace(/^[a-z]+\//, "").replace(/-/g, " ")];
  const matched = findMatchingQueries(keywords, index.queries);
  const totalOpportunity = matched.reduce((s, m) => s + m.opportunity, 0);
  const demandBonus = Math.min(DEMAND_BONUS_CAP, Math.floor(totalOpportunity / 500));

  const cannibalization = cannibalizationFor([entry.target_keyword], index.routesByKeyword);
  // Supporting types don't have affiliate state.
  return {
    staticPriority: entry.priority,
    demandBonus,
    cannibalizationPenalty: cannibalization,
    noAffiliatePenalty: 0,
    duplicationPenalty: 0,
    effective: entry.priority + demandBonus - cannibalization,
    matchedQueries: matched.slice(0, 5),
  };
}

/**
 * Pick the highest effective-priority candidate from a mixed
 * (reviews + supporting) pool. Supporting items keep their static
 * priority scale (which goes up to ~99); reviews stay in 1–10. Both
 * are pushed through the same ranker so we compare apples-to-apples
 * via effective priority — and supporting still wins most days because
 * its head is at ~77.
 *
 * EDITORIAL-ONLY CAP: at most `editorialOnlyCap` research-only reviews
 * can be selected total across the lifetime of the queue (caller
 * supplies the current count from sites.ts editorial_status:
 * "editorial-only"). Once at the cap, research-only candidates are
 * filtered out before ranking.
 */
export function pickHighestEffective(
  reviews: ReviewQueueEntry[],
  supporting: SupportingQueueEntry[],
  index: { queries: GscQueryAggregate[]; routesByKeyword: Map<string, string[]>; existingSlugs: Set<string> },
  opts: { editorialOnlyCap: number; editorialOnlyCurrent: number },
): { kind: "review"; entry: ReviewQueueEntry; ranking: CandidateRanker } | { kind: "supporting"; entry: SupportingQueueEntry; ranking: CandidateRanker } | null {
  const atCap = opts.editorialOnlyCurrent >= opts.editorialOnlyCap;
  const eligibleReviews = atCap
    ? reviews.filter((r) => r.editorial_mode !== "research-only")
    : reviews;

  const reviewRanked = eligibleReviews.map((r) => ({ kind: "review" as const, entry: r, ranking: rankReview(r, index) }));
  const suppRanked = supporting.map((s) => ({ kind: "supporting" as const, entry: s, ranking: rankSupporting(s, index) }));

  const all = [...reviewRanked, ...suppRanked].sort((a, b) => b.ranking.effective - a.ranking.effective);
  return all[0] ?? null;
}
