/**
 * Autonomous content engine for TwinkVault.
 *
 * Reads src/data/content-queue.ts, picks the next item per the day-of-week
 * rotation (with critical-gap override), generates the page via Anthropic
 * Claude, applies quality gates, writes the resulting files into the repo,
 * runs the build, optionally commits + pushes + pings Google/Bing,
 * logs the result to Supabase.
 *
 * Run modes:
 *   npx tsx scripts/generate-daily-content.ts                    # default daily mode
 *   npx tsx scripts/generate-daily-content.ts --dry-run --site men
 *   npx tsx scripts/generate-daily-content.ts --type comparison
 *   npx tsx scripts/generate-daily-content.ts --force
 *   npx tsx scripts/generate-daily-content.ts --audit
 *
 * Flags:
 *   --dry-run        Generate + log JSON only. No writes, no commit, no ping.
 *   --force          Ignore day-of-week rotation; pick highest-priority queue item.
 *   --type <kind>    Force a specific content type.
 *   --site <slug>    Force generation for a specific queued site.
 *   --audit          Scan repo for SEO gaps. Don't generate anything.
 *   --push           Commit + push + ping. Default off (safe to run locally).
 */
import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { GoogleAuth } from "google-auth-library";

import {
  reviewQueue,
  reviewCandidates,
  supportingCandidates,
  supportingQueue,
  nextReviewToPublish,
  nextSupporting,
  type ReviewQueueEntry,
  type SupportingQueueEntry,
  type SupportingContentType,
} from "../src/data/content-queue.js";
import { sites, type SiteData } from "../src/data/sites.js";
import { selectGuideHero } from "../src/lib/guideImagery.js";
import { countProseLinks } from "../src/lib/proseLinker.js";
import { canonicalComparePairSlug, isFeaturedComparePair } from "../src/data/featured-compare-pairs.js";

// ---------------------------------------------------------------------------
// Constants & paths
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_FILE = resolve(ROOT, "src/data/sites.ts");
const QUEUE_FILE = resolve(ROOT, "src/data/content-queue.ts");
const REVIEWS_FILE = resolve(ROOT, "src/hooks/useAIReview.ts");
const COMPARISON_CONTENT_FILE = resolve(ROOT, "src/data/comparison-content.ts");
const ALTERNATIVES_CONTENT_FILE = resolve(ROOT, "src/data/alternatives-content.ts");
const ISWORTHIT_CONTENT_FILE = resolve(ROOT, "src/data/isworthit-content.ts");
const GUIDE_CONTENT_FILE = resolve(ROOT, "src/data/guide-content.ts");
const IMPROVEMENT_LOG_FILE = resolve(ROOT, "docs/improvement-log.json");
const CONTENT_AUDIT_FILE = resolve(ROOT, "docs/content-audit.json");

/** Every file a run may mutate — snapshot before persist, restore on any
 *  rollback (build failure or --inspect). Includes the tracked files
 *  runBuild() regenerates AND the improve-mode ledger. */
const ENGINE_SNAPSHOT_FILES = () => [
  QUEUE_FILE,
  REVIEWS_FILE,
  SITES_FILE,
  COMPARISON_CONTENT_FILE,
  ALTERNATIVES_CONTENT_FILE,
  ISWORTHIT_CONTENT_FILE,
  GUIDE_CONTENT_FILE,
  IMPROVEMENT_LOG_FILE,
  resolve(ROOT, "docs/content-lastmod.json"),
  resolve(ROOT, "public/sitemap.xml"),
  resolve(ROOT, "public/blog-sitemap.xml"),
  resolve(ROOT, "docs/content-audit-report.md"),
  resolve(ROOT, "docs/content-audit.json"),
];

const BASE_URL = "https://twinkvault.com";
// Sonnet 4.6 is the current latest at time of writing. Override here if you
// want to test a different model — the spec asked for claude-sonnet-4-20250514
// but the newer model produces tighter JSON.
const MODEL = "claude-sonnet-4-6";
// Spec said 2000, but the prompt asks for ~700 words of body + 5 FAQs + scores
// + meta — empirically that's ~3500 output tokens. With web_search enabled the
// model also emits tool-use + search-result blocks that share this budget, so
// a 4000 cap could truncate the final JSON (or leave a turn with no text block)
// on longer comparison/guide articles. 8000 gives comfortable headroom — the
// cap only bounds length, it doesn't increase cost for shorter responses.
const MAX_TOKENS = 8000;

// ---------------------------------------------------------------------------
// CLI flag parsing
// ---------------------------------------------------------------------------
interface Flags {
  dryRun: boolean;
  force: boolean;
  type?: SupportingContentType | "review";
  site?: string;
  audit: boolean;
  push: boolean;
  /** Live generation → persist → real build/prerender → print a full
   *  inspection report from the prerendered HTML → restore ALL source files.
   *  Never commits, pushes, or pings. For end-to-end QA of a fresh article. */
  inspect: boolean;
}

function parseFlags(argv: string[]): Flags {
  const f: Flags = { dryRun: false, force: false, audit: false, push: false, inspect: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") f.dryRun = true;
    else if (a === "--force") f.force = true;
    else if (a === "--audit") f.audit = true;
    else if (a === "--push") f.push = true;
    else if (a === "--inspect") f.inspect = true;
    else if (a === "--type") f.type = argv[++i] as Flags["type"];
    else if (a === "--site") f.site = argv[++i];
  }
  return f;
}

// ---------------------------------------------------------------------------
// Queue resolution (priority-driven, no day-of-week rotation)
// ---------------------------------------------------------------------------
// Previously this used a day-of-week → content_type map. That left several
// days with no eligible content (e.g. Wed/bestof was always empty because
// hubs use content_type "hub", not "bestof"). Switched to pure priority:
// every day picks the highest-priority queued item across both queues,
// with reviews still gated on affiliate_url presence to avoid publishing
// content for sites we can't monetize.
type ContentTypeKey = "review" | SupportingContentType;

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------
const log = {
  info: (msg: string) => console.log(`[content] ${msg}`),
  warn: (msg: string) => console.warn(`[content][WARN] ${msg}`),
  err: (msg: string) => console.error(`[content][ERR] ${msg}`),
  json: (label: string, obj: unknown) => {
    console.log(`[content] ${label}:`);
    console.log(JSON.stringify(obj, null, 2));
  },
};

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------
interface AuditResult {
  category: string;
  severity: "critical" | "warn" | "info";
  detail: string;
}

function runAudit(): AuditResult[] {
  const issues: AuditResult[] = [];

  // 1. Reviews missing affiliate URLs (no commission attribution).
  // Pending-review sites are exempted from review-body/comparison checks
  // below since editorial coverage isn't expected to exist yet.
  for (const s of sites) {
    if (!s.affiliate_url) {
      issues.push({
        category: "missing-affiliate",
        severity: "critical",
        detail: `${s.name} (/reviews/${s.slug}) has affiliate_url=null — clicks bypass tracking.`,
      });
    }
  }

  // 2. Duplicate slugs.
  const slugSet = new Set<string>();
  for (const s of sites) {
    if (slugSet.has(s.slug)) {
      issues.push({ category: "duplicate-slug", severity: "critical", detail: `Duplicate slug: ${s.slug}` });
    }
    slugSet.add(s.slug);
  }

  // 3. Reviews not linked from at least 3 internal pages (orphan check).
  // ReviewsIndex auto-iterates `sites`, so all reviews are linked at least once.
  // We check whether each review has comparison/discount/category coverage.
  for (const s of sites) {
    if (s.editorial_status === "pending-review") continue;
    const inComparisons = supportingQueue.filter(
      (q) => q.content_type === "comparison" && q.related_sites.includes(s.slug)
    ).length;
    if (inComparisons < 1) {
      issues.push({
        category: "weak-internal-linking",
        severity: "warn",
        detail: `${s.name} has zero comparison-page coverage in queue.`,
      });
    }
  }

  // 4. Meta description length on review pages (template renders the same shape
  //    for every site — we sample with the longest site name).
  const longestName = sites.reduce((m, s) => (s.name.length > m.length ? s.name : m), "");
  const sampleMeta = `Read our honest ${longestName} review. We tested the content, pricing, and usability so you know exactly what you're getting.`;
  if (sampleMeta.length > 160) {
    issues.push({
      category: "meta-too-long",
      severity: "warn",
      detail: `Review meta description exceeds 160 chars when rendered for ${longestName} (${sampleMeta.length} chars).`,
    });
  }

  // 5. Sitemap drift — every site's /reviews/{slug} URL must be in the
  // generated sitemap.xml. Check the actual OUTPUT, not the script source:
  // generate-sitemap.ts builds review URLs dynamically from sites.map(...), so
  // individual slugs never appear as literals in the source (the old check
  // grepped the source and false-flagged all 64 sites). If sitemap.xml hasn't
  // been generated yet, skip — the build regenerates it before the audit runs.
  const sitemapXmlPath = resolve(ROOT, "public/sitemap.xml");
  if (existsSync(sitemapXmlPath)) {
    const sitemapXml = readFileSync(sitemapXmlPath, "utf-8");
    for (const s of sites) {
      if (!sitemapXml.includes(`/reviews/${s.slug}<`)) {
        issues.push({
          category: "sitemap-drift",
          severity: "critical",
          detail: `${s.slug} is in sites.ts but its /reviews/${s.slug} URL is missing from sitemap.xml.`,
        });
      }
    }
  }

  // 6. Reviews missing AI body (falls back to short site.description).
  // Pending-review sites are expected to have no body — their review page
  // renders a "Full review in development" placeholder instead.
  const reviewsSrc = readFileSync(REVIEWS_FILE, "utf-8");
  for (const s of sites) {
    if (s.editorial_status === "pending-review") continue;
    if (!reviewsSrc.includes(`"${s.slug}":`)) {
      issues.push({
        category: "missing-review-body",
        severity: "warn",
        detail: `${s.name} has no editorial body in useAIReview.ts — falls back to short description.`,
      });
    }
  }

  // 7. Queue entries pointing at non-existent slugs.
  const allKnownSlugs = new Set([...sites.map((s) => s.slug), ...reviewQueue.map((r) => r.slug)]);
  for (const q of supportingQueue) {
    for (const s of q.related_sites) {
      if (!allKnownSlugs.has(s)) {
        issues.push({
          category: "queue-broken-ref",
          severity: "warn",
          detail: `Supporting entry "${q.slug}" references unknown site slug "${s}".`,
        });
      }
    }
  }

  // 8. Duplicate target keywords across queue (cannibalization).
  const kwMap = new Map<string, string[]>();
  for (const q of supportingQueue) {
    const arr = kwMap.get(q.target_keyword) ?? [];
    arr.push(q.slug);
    kwMap.set(q.target_keyword, arr);
  }
  for (const [kw, slugs] of kwMap) {
    if (slugs.length > 1) {
      issues.push({
        category: "keyword-cannibalization",
        severity: "warn",
        detail: `Keyword "${kw}" targeted by ${slugs.length} pages: ${slugs.join(", ")}`,
      });
    }
  }

  return issues;
}

function printAudit(issues: AuditResult[]) {
  const groups = { critical: [] as AuditResult[], warn: [] as AuditResult[], info: [] as AuditResult[] };
  for (const i of issues) groups[i.severity].push(i);

  console.log("\n=== TwinkVault SEO/Content Audit ===\n");
  console.log(`Critical: ${groups.critical.length}`);
  console.log(`Warnings: ${groups.warn.length}`);
  console.log(`Info:     ${groups.info.length}\n`);

  for (const sev of ["critical", "warn", "info"] as const) {
    if (!groups[sev].length) continue;
    console.log(`--- ${sev.toUpperCase()} ---`);
    const byCat = new Map<string, AuditResult[]>();
    for (const issue of groups[sev]) {
      const arr = byCat.get(issue.category) ?? [];
      arr.push(issue);
      byCat.set(issue.category, arr);
    }
    for (const [cat, items] of byCat) {
      console.log(`\n[${cat}] (${items.length})`);
      for (const i of items.slice(0, 20)) console.log(`  • ${i.detail}`);
      if (items.length > 20) console.log(`  …${items.length - 20} more`);
    }
    console.log();
  }
}

// ---------------------------------------------------------------------------
// Anthropic call
// ---------------------------------------------------------------------------
function getAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPT = `You are an experienced gay man writing membership-site reviews for TwinkVault, an independent gay site review project. Your readers are other gay men deciding where to spend money.

RESEARCH MANDATE:
Before writing any review or page content, you MUST use the web_search tool to research the site. Search for: current pricing, scene/video count, recent member reviews, performer types, update frequency, trial offers, and any known issues or changes. Base your content on what you actually find — not assumptions. If search results conflict with your training data, trust the search results.

CRITICAL OUTPUT RULES:
- You must respond with valid JSON only. Do not include any preamble, explanation, thinking, or conversational text before or after the JSON.
- Your entire response must be parseable by JSON.parse(). Start your response with { and end with }.
- Do NOT write things like "I'll research..." or "Let me think about this..." or "Here's the JSON:" — start with { immediately.
- No markdown fences, no preamble, no trailing text, no inline thoughts.
- Vary sentence structure and vocabulary — never reuse phrases verbatim across reviews.
- Be opinionated and specific. Generic praise is worthless.
- Include concrete details where you know them: scene counts, model archetypes, video resolution, prices.
- Honest cons: every site has them. Surface real ones.

VOICE:
- First-person plural ("we tested...", "we logged in...") or third-person observation. Never "I" — this is a review project, not a personal blog post.

STYLE (anti-AI-tell rules — these are hard requirements):
- Em dashes: at most 2 per piece, total. Join clauses with periods, commas, colons, or semicolons instead. Never open an answer with "Yes —" or "No —".
- Banned words/phrases (do not use, ever): "curated", "realm", "landscape" (figurative), "elevate", "unleash", "seamless", "meticulous", "treasure trove", "plethora", "myriad", "boasts", "delve", "dive into", "Whether you're", "look no further", "game-changer", "it's worth noting", "In today's", "isn't just", "more than just", "stands as", "testament to", "In conclusion".
- Vary paragraph and sentence length. A piece where every section has the same shape reads machine-written.
- Prefer plain verbs and concrete nouns over intensifiers. "The library is big: 4,000 scenes" beats "an impressively vast library".
- Conversational but informed. No corporate fluff. No SEO keyword stuffing.
- The reader has paid for memberships before and knows when they're being marketed to.
`;

interface GenerateOptions {
  contentType: ContentTypeKey;
  payload: Record<string, unknown>;
}

async function generate({ contentType, payload }: GenerateOptions) {
  return callClaude(buildUserPrompt(contentType, payload));
}

/**
 * Improve-mode generation: same type-specific prompt as a create, plus the
 * EXISTING content and an explicit expand-substantively instruction. The
 * model returns the full improved JSON in the same schema, so gates and
 * persistence are identical to the create path.
 */
async function generateImprove(
  contentType: ContentTypeKey,
  payload: Record<string, unknown>,
  existing: unknown,
  targetWords: number,
): Promise<Record<string, unknown>> {
  const prompt =
    rawUserPrompt(contentType, payload) +
    `\n\nIMPROVEMENT MODE: A version of this exact page already exists but is too thin to rank. ` +
    `Rewrite it SUBSTANTIVELY BETTER: keep everything that is accurate, deepen it with concrete ` +
    `specifics (real features, numbers, scene/site specifics, honest trade-offs), and target at ` +
    `least ${targetWords} words of body prose — materially longer than the existing version. ` +
    `Do not pad with filler; add information. Return the FULL improved JSON in the same schema.` +
    `\n\nEXISTING CONTENT (JSON):\n${JSON.stringify(existing)}` +
    JSON_ONLY_REMINDER;
  return callClaude(prompt);
}

async function callClaude(userPrompt: string) {
  const anthropic = getAnthropic();

  const tools = [{ type: "web_search_20250305" as const, name: "web_search" }];
  const messages: { role: "user" | "assistant"; content: unknown }[] = [
    { role: "user", content: userPrompt },
  ];

  let resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tools,
    messages: messages as never,
  });

  // The web_search server tool can end a turn with stop_reason "pause_turn"
  // (the model paused mid-tool-use). That response carries only tool/search
  // blocks and NO final text — which previously surfaced as the opaque
  // "No text content in Claude response" error and burned the day. Continue
  // the paused turn by feeding the partial assistant content back, up to a
  // few times, until the model emits its final JSON text.
  let continues = 0;
  while (resp.stop_reason === "pause_turn" && continues < 4) {
    messages.push({ role: "assistant", content: resp.content });
    resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools,
      messages: messages as never,
    });
    continues++;
  }

  // Concatenate every text block (the final JSON can follow tool-use blocks).
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  if (!text.trim()) {
    // Capture WHY it was empty so this is debuggable instead of opaque:
    // stop_reason distinguishes max_tokens (truncated) / pause_turn (still
    // paused after continues) / refusal / tool_use; block types + usage show
    // whether the model only searched and never wrote.
    const blockTypes = resp.content.map((b) => b.type).join(",") || "(none)";
    const usage = resp.usage
      ? `in=${resp.usage.input_tokens} out=${resp.usage.output_tokens}`
      : "?";
    log.warn(
      `Empty Claude response — stop_reason=${resp.stop_reason} blocks=[${blockTypes}] ` +
      `${usage} pause_continues=${continues}`,
    );
    throw new Error(
      `No text content in Claude response (stop_reason=${resp.stop_reason}, blocks=[${blockTypes}], ${usage})`,
    );
  }
  return parseJsonStrict(text);
}

function parseJsonStrict(raw: string): Record<string, unknown> {
  // Strip code fences if model defied instructions.
  let trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  // Salvage JSON when the model wraps it in conversational preamble or trailing
  // commentary — extract the largest balanced {...} substring. JSON.parse on
  // that. If the parse fails, throw so the caller can log + skip cleanly.
  if (!trimmed.startsWith("{")) {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first !== -1 && last > first) {
      trimmed = trimmed.slice(first, last + 1);
    }
  }

  try {
    return JSON.parse(trimmed);
  } catch (e) {
    throw new Error(`Claude returned invalid JSON: ${(e as Error).message}\n\n--- raw ---\n${raw.slice(0, 500)}`);
  }
}

// Appended to every user prompt as a final-line reminder. The system prompt
// already instructs JSON-only, but the model occasionally prefaces with
// research narration ("I'll research both sites..."). Restating immediately
// after the request meaningfully reduces preamble drift.
const JSON_ONLY_REMINDER = "\n\nIMPORTANT: Return only the JSON object. No preamble, no explanation, no markdown. Start with { immediately.";

function buildUserPrompt(type: ContentTypeKey, payload: Record<string, unknown>): string {
  return rawUserPrompt(type, payload) + JSON_ONLY_REMINDER;
}

function rawUserPrompt(type: ContentTypeKey, payload: Record<string, unknown>): string {
  switch (type) {
    case "review":
      return payload.editorial_only === true
        ? reviewEditorialOnlyPrompt(payload)
        : reviewPrompt(payload);
    case "discount":
      return discountPrompt(payload);
    case "comparison":
      return comparisonPrompt(payload);
    case "bestof":
    case "awards":
      return bestofPrompt(payload);
    case "alternatives":
      return alternativesPrompt(payload);
    case "guide":
    case "isworthit":
    case "freetrial":
    case "pricing":
      return guidePrompt(payload);
    case "hub":
      return hubPrompt(payload);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
}

function reviewPrompt(p: Record<string, unknown>): string {
  return `Search for real, current information about "${p.name}" before writing. Look up: current pricing, number of videos/scenes, recent member feedback, update schedule, any trial offers, and what types of performers appear. Then generate a complete review JSON object using what you found. Output the EXACT JSON shape requested — no extra fields, no missing fields.

Site: ${p.name}
Homepage: ${p.homepage_url}
Niche: ${(p.niche as string[]).join(", ")}
Affiliate network: ${p.affiliate_network ?? "unknown"}
Existing reviewed sites you can link to as comparisons: ${(p.existing_slugs as string[]).slice(0, 12).join(", ")}

HARD CONSTRAINTS — these are not suggestions:
- The four review_body fields MUST total >= 900 words combined. Count before returning. If under, expand with specifics (scene examples, performer types, head-to-head comparisons), not filler.
- meta_description MUST be 145-155 characters. Count characters (NOT words) before returning. Include the site name. End with a hook.

Return JSON with fields:
review_body_p1 (200-240 words: overview, who made it, niche, who it's for)
review_body_p2 (260-300 words: content deep dive — scene count, models, resolution, exclusivity, update frequency, variety)
review_body_p3 (200-240 words: pricing breakdown, tiers, trial, cancellation, value vs competitors)
review_body_p4 (160-200 words: verdict — clear recommendation, who should/shouldn't subscribe)
pros (4-5 specific pros — never generic)
cons (2-3 honest cons)
scores: { content_quality, value_for_money, site_design, update_frequency, overall } (each 1-10, one decimal place)
tagline (one sentence under 15 words)
best_for (one sentence describing ideal subscriber)
faq (5 entries, each {q, a} — q is something people Google about this site, a is 100-150 words)
meta_description (HARD CONSTRAINT — must be between 145 and 155 characters INCLUSIVE. Anything under 145 or over 155 fails downstream validation and the entire response will be rejected. Count characters in your draft, then expand with a buying-intent hook or Google-friendly phrase if too short. Must include the site name. Examples of valid lengths: 145, 148, 152, 155. Examples that will fail: 132, 140, 156, 170.)
h1 (primary H1 with main keyword — HARD LIMIT 52 characters INCLUDING spaces, count before returning; use the terse form "{Site} Review 2026: {2-4 word hook}", e.g. "Bromo Review 2026: Raw Studio Power" at 35 chars. NEVER a full sentence)
h2_sections (array of 5 H2 strings)
comparison_sites (3 existing slugs from the list above, most relevant)
internal_links (3 existing slugs)
og_description (under 100 chars)
twitter_description (under 100 chars)`;
}

/**
 * Editorial-only review prompt — for sites we don't yet partner with
 * but want SEO coverage of. The output schema matches reviewPrompt() so
 * the same persistence path works, but the prompt:
 *   - Tells the model TwinkVault has no commercial relationship.
 *   - Bans CTA/conversion language ("get the discount", "sign up now",
 *     "save 67%") — those would mislead readers about a deal we don't
 *     actually offer.
 *   - Skips pricing fields (we set price_* to "n/a" at persist time
 *     since we haven't subscribed).
 *   - Asks for an editorial verdict paragraph that names the gap
 *     (e.g., "We haven't tested this site with a paid membership").
 */
function reviewEditorialOnlyPrompt(p: Record<string, unknown>): string {
  return `Search for current public information about "${p.name}" before writing — performer roster, content style, scene count, recent member feedback. Do NOT search for affiliate pricing or join page; we will not be linking. Then generate a complete editorial-only review JSON object using what you found.

Site: ${p.name}
Homepage: ${p.homepage_url}
Niche: ${(p.niche as string[]).join(", ")}
Existing reviewed sites you can reference for comparison: ${(p.existing_slugs as string[]).slice(0, 12).join(", ")}

CONTEXT — IMPORTANT:
TwinkVault has NOT subscribed to this site and is NOT affiliated. This review is editorial coverage for readers who search for it. The output must NOT promise discounts, contain affiliate CTAs, or use first-person "we tested" language about a paid membership. Be transparent: surface what's known publicly, what isn't, and what a reader should investigate themselves.

HARD CONSTRAINTS — these are not suggestions:
- The four review_body fields MUST total >= 900 words combined.
- BANNED phrases: "we tested", "we logged in", "we subscribed", "during our membership", "we paid for", "TwinkVault members get", "use our discount", "exclusive offer", "save XX%", "sign up here", "limited time".
- INSTEAD use: "publicly available scenes suggest", "the site advertises", "member reports indicate", "trade press has noted".
- review_body_p4 (verdict) must include a sentence noting we have not yet partnered with this site and the review is based on public information.
- meta_description MUST be 145-155 characters. Count characters before returning. Include the site name.

Return JSON with fields:
review_body_p1 (200-240 words: overview, who made it, niche, who it's for — sourced from public info)
review_body_p2 (260-300 words: content overview — scene count claims, model roster, resolution, exclusivity — flag what's verifiable vs marketing-claim)
review_body_p3 (200-240 words: positioning vs competitors we've actually tested; don't fabricate pricing)
review_body_p4 (160-200 words: editorial verdict with transparency about our coverage gap)
pros (4-5 specific pros from public observation — never generic)
cons (2-3 honest cons, including "we haven't independently tested" as one)
scores: { content_quality, value_for_money, site_design, update_frequency, overall } (each 1-10, one decimal; score conservatively since we haven't tested)
tagline (one sentence under 15 words)
best_for (one sentence describing the ideal reader, NOT framed as a purchase recommendation)
faq (5 entries, each {q, a} — focus on what readers actually search: what is this site, who runs it, what content does it have, is it active, how does it compare publicly to X)
meta_description (145-155 chars — include site name, end with editorial framing not a deal hook)
h1 (primary H1 with main keyword + "Review" — HARD LIMIT 52 characters INCLUDING spaces, count before returning; terse form "{Site} Review 2026: {2-4 word hook}". NEVER a full sentence)
h2_sections (array of 5 H2 strings)
comparison_sites (3 existing slugs we have reviewed, most relevant)
internal_links (3 existing slugs)
og_description (under 100 chars)
twitter_description (under 100 chars)`;
}

function discountPrompt(p: Record<string, unknown>): string {
  return `Search for current "${p.name}" pricing, active discount codes, and any trial offers before writing. Then generate a discount-page JSON for the site below.

Site: ${p.name}
Monthly: ${p.price_monthly}
Annual: ${p.price_annual}
Savings %: ${p.savings_percentage}

Return JSON: { headline, subheadline, intro_paragraph (~100w), body_p1 (~150w on what you get), body_p2 (~100w on why pay), body_p3 (~100w urgency+CTA), current_monthly_price, annual_price, savings_percentage, savings_amount, urgency_line, cta_button_text, faq (2 entries — free trial Q + cancellation Q), meta_description (145-155 chars discount keyword), h1 (discount keyword H1) }`;
}

function comparisonPrompt(p: Record<string, unknown>): string {
  return `Search for current information about both "${p.site_a_name}" and "${p.site_b_name}" — pricing, scene counts, update frequency — before writing. Then generate a side-by-side comparison JSON for these two sites.

Site A: ${p.site_a_name} (${p.site_a_slug}) — ${p.site_a_summary}
Site B: ${p.site_b_name} (${p.site_b_slug}) — ${p.site_b_summary}

HARD CONSTRAINT on h1: must be 50 characters or fewer (so "{h1} | TwinkVault" stays under the 65-char SERP cap). COUNT the characters. Use the form "[A] vs [B] (2026)". Only add "— Which Is Better" if the whole h1 still fits in 50 chars; for longer site names, "[A] vs [B] (2026)" alone is correct. Example: "Twinks in Shorts vs Southern Strokes (2026)" (43 chars) — good; the longer "— Which Is Better in 2026?" form would be 62 chars — too long.

Return JSON: { site_a_slug, site_b_slug, h1 (≤50 chars — see constraint above), intro (~150w), site_a_summary (~100w on A's strengths), site_b_summary (~100w on B's strengths), comparison_categories: 5 entries with { category, site_a_score (1-10), site_b_score (1-10), site_a_detail (2-3 sentences), site_b_detail (2-3 sentences) } covering Content Library, Pricing & Value, Site Design & UX, Update Frequency, Niche Focus. verdict (~200w decisive), who_should_choose_a (one sentence), who_should_choose_b (one sentence), faq (2 entries, each {q, a} — q is the search question, a is the answer 80-150 words), meta_description (145-155 chars) }`;
}

function bestofPrompt(p: Record<string, unknown>): string {
  return `Generate a best-of listicle JSON.

Niche: ${p.niche ?? p.title}
Sites to rank (with current overall scores): ${JSON.stringify(p.candidates)}

Return JSON: { h1 ("Best [Niche] Sites 2026 — Ranked & Reviewed"), intro (~200w establishing authority and ranking criteria), sites: array with { slug, rank (1..N), blurb (~150w), best_for (one sentence) } in ranked order, conclusion (~150w summary + CTA), methodology_note (2 sentences on ranking criteria), meta_description (145-155 chars), faq (3 entries, each {q, a} — q is the search question, a is the answer 80-150 words) }`;
}

function alternativesPrompt(p: Record<string, unknown>): string {
  return `Generate a "best alternatives to" JSON for ${p.name}.

Existing sites available as alternatives: ${JSON.stringify(p.candidates)}

Return JSON: { h1 ("Best Alternatives To [Site] in 2026"), intro (~150w on why someone wants alternatives + what to look for), alternatives: array with { slug, reason (~100w on fit + comparison) } — pick 5 most relevant from candidates, verdict (~100w wrap-up), meta_description (145-155 chars), faq (2 entries, each {q, a} — q is the search question, a is the answer 80-150 words) }`;
}

function guidePrompt(p: Record<string, unknown>): string {
  return `Generate a long-form guide JSON for the topic below.

Title: ${p.title}
Target keyword: ${p.target_keyword}
Related sites: ${(p.related_sites as string[]).join(", ")}

HARD CONSTRAINT on h1: must be 30-50 characters (so that "{h1} | TwinkVault" stays under the 65-char SERP title cap). Long slug names need terse h1s — "How To Cancel Gay Porn Subs" is fine, "How To Cancel A Gay Porn Site Subscription Step By Step Walkthrough" is too long.

Return JSON: { h1 (30-50 chars — count carefully), intro (~200w), sections: 4-5 entries with { h2, content (200-300w each) }, conclusion (~150w with CTAs to review pages), meta_description (145-155 chars), faq (5 entries, each {q, a} — q is the search question, a is the answer 80-150 words. Use EXACTLY field names "q" and "a", not "question"/"answer") }`;
}

function hubPrompt(p: Record<string, unknown>): string {
  return `Generate a niche hub-page JSON.

Niche title: ${p.title}
Niche keyword: ${p.target_keyword}
Sites in this niche: ${JSON.stringify(p.related_sites)}

Return JSON: { h1 ("[Niche] Porn Sites — Complete Guide 2026"), intro (~200w establishing this as the definitive resource), niche_explanation (~150w explaining the niche), site_blurbs: array { slug, blurb (~75w on why this site fits) }, buying_guide (~200w on what to look for), conclusion (~100w), meta_description (145-155 chars), faq (4 entries, each {q, a} — q is the search question, a is the answer 80-150 words) }`;
}

// ---------------------------------------------------------------------------
// Quality gates (Part 3G)
// ---------------------------------------------------------------------------
function qualityGate(content: Record<string, unknown>, contentType: ContentTypeKey): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  // Meta description gate aligned with the audit's HARD_FAIL band:
  // <120 flags THIN_DESC, >165 flags LONG_DESC. Daily-gen output must
  // match what the audit accepts so AI content never trips the strict
  // build-time gate.
  const meta = content.meta_description as string | undefined;
  if (!meta) errors.push("meta_description missing");
  else if (meta.length < 120 || meta.length > 165) errors.push(`meta_description length ${meta.length} not in 120-165`);

  // h1 gate. Renderers append " | TwinkVault" (13 chars) for the meta
  // <title>; a 52-char h1 yields a 65-char title which is Google's
  // SERP-display cap. Below 20 is too sparse for SERP weight. The
  // renderer (GuidePage, prerender-app) also includes a defensive
  // truncate-with-ellipsis fallback if the model overshoots — see
  // src/pages/GuidePage.tsx — so this gate is the first line of defense
  // but not the only one.
  const h1 = content.h1 as string | undefined;
  if (h1 && (h1.length < 20 || h1.length > 52)) errors.push(`h1 length ${h1.length} out of 20-52`);

  if (contentType === "review") {
    const wc = wordCount([
      content.review_body_p1, content.review_body_p2, content.review_body_p3, content.review_body_p4,
    ].join(" "));
    if (wc < 800) errors.push(`review word count ${wc} < 800`);
    const scores = content.scores as Record<string, number> | undefined;
    if (!scores) errors.push("scores missing");
    else for (const [k, v] of Object.entries(scores)) {
      if (typeof v !== "number" || v < 1 || v > 10) errors.push(`score ${k}=${v} out of 1-10`);
    }
    const faq = content.faq as unknown[] | undefined;
    if (!faq || faq.length < 3) errors.push(`faq has < 3 entries`);
    const h1 = content.h1 as string | undefined;
    if (!h1) errors.push("h1 missing");
  }

  if (contentType === "discount") {
    const wc = wordCount([content.intro_paragraph, content.body_p1, content.body_p2, content.body_p3].join(" "));
    if (wc < 400) errors.push(`discount word count ${wc} < 400`);
  }

  if (contentType === "guide") {
    const sections = Array.isArray(content.sections) ? (content.sections as { content?: string }[]) : [];
    const wc = wordCount(
      [content.intro, ...sections.map((s) => s?.content ?? ""), content.conclusion]
        .filter((x): x is string => typeof x === "string")
        .join(" "),
    );
    if (wc < 1000) errors.push(`guide word count ${wc} < 1000`);
    const faq = content.faq as unknown[] | undefined;
    if (!faq || faq.length < 3) errors.push("guide faq has < 3 entries");
  }

  // Comparisons previously passed on meta+h1 length ALONE while flooding 46%
  // of the sitemap — the inverse of the quality bar guides face. Parity now:
  // real word floor, minimum category depth, minimum FAQ. (Hero availability
  // is enforced separately in tryGenerateItem — it needs the queue entry.)
  if (contentType === "comparison") {
    const cats = Array.isArray(content.comparison_categories)
      ? (content.comparison_categories as { site_a_detail?: string; site_b_detail?: string }[])
      : [];
    const wc = wordCount(
      [
        content.intro, content.site_a_summary, content.site_b_summary,
        ...cats.flatMap((c) => [c?.site_a_detail ?? "", c?.site_b_detail ?? ""]),
        content.verdict, content.who_should_choose_a, content.who_should_choose_b,
      ]
        .filter((x): x is string => typeof x === "string")
        .join(" "),
    );
    if (wc < 700) errors.push(`comparison word count ${wc} < 700`);
    if (cats.length < 3) errors.push(`comparison has ${cats.length} category rows < 3`);
    const faq = content.faq as unknown[] | undefined;
    if (!faq || faq.length < 2) errors.push("comparison faq has < 2 entries");
  }

  return { ok: errors.length === 0, errors };
}

// Body word count for the quality log line, per content type.
function bodyWordsFor(content: Record<string, unknown>, contentType: ContentTypeKey): number {
  const join = (...keys: string[]) =>
    wordCount(keys.map((k) => content[k]).filter((v): v is string => typeof v === "string").join(" "));
  if (contentType === "review") return join("review_body_p1", "review_body_p2", "review_body_p3", "review_body_p4");
  if (contentType === "discount") return join("intro_paragraph", "body_p1", "body_p2", "body_p3");
  if (contentType === "guide") {
    const sections = Array.isArray(content.sections) ? (content.sections as { content?: string }[]) : [];
    return wordCount(
      [content.intro, ...sections.map((s) => s?.content ?? ""), content.conclusion]
        .filter((x): x is string => typeof x === "string")
        .join(" "),
    );
  }
  return wordCount(JSON.stringify(content));
}

const SCHEMA_BY_TYPE: Record<string, string> = {
  review: "Review,Product,BreadcrumbList,FAQPage",
  guide: "Article,BreadcrumbList,FAQPage",
  comparison: "Product,Review,ItemList,BreadcrumbList,FAQPage",
  alternatives: "ItemList,BreadcrumbList",
  isworthit: "Article,BreadcrumbList,FAQPage",
  discount: "Product,BreadcrumbList,FAQPage",
};

/**
 * Emit the per-run [content][quality] summary line, e.g.:
 *   [content][quality] type=guide slug=… words=1861 images=1 ilinks=6
 *     schema=Article,BreadcrumbList,FAQPage faqs=5 title=44c desc=159c
 *     ogimg=hero → PASS
 */
function logQualityLine(
  generated: Record<string, unknown>,
  target: { kind: "review"; entry: ReviewQueueEntry } | { kind: "supporting"; entry: SupportingQueueEntry },
  contentType: ContentTypeKey,
  pass: boolean,
): void {
  const slug = target.entry.slug;
  const words = bodyWordsFor(generated, contentType);
  const faqs = Array.isArray(generated.faq) ? (generated.faq as unknown[]).length : 0;
  const h1 = (generated.h1 as string) ?? "";
  const meta = (generated.meta_description as string) ?? "";
  const schema = SCHEMA_BY_TYPE[contentType] ?? "—";

  let images = 0;
  let ilinks = Array.isArray(generated.internal_links) ? (generated.internal_links as unknown[]).length : 0;
  let ogimg = "favicon";

  if (contentType === "guide") {
    const related = target.kind === "supporting" ? (target.entry.related_sites ?? []) : [];
    const hero = selectGuideHero(related);
    images = hero ? 1 : 0;
    ogimg = hero ? "hero" : "favicon";
    const sections = Array.isArray(generated.sections) ? (generated.sections as { content?: string }[]) : [];
    const chunks = [generated.intro, ...sections.map((s) => s?.content ?? ""), generated.conclusion]
      .filter((x): x is string => typeof x === "string");
    ilinks = countProseLinks(chunks);
  } else if (contentType === "comparison") {
    const related = target.kind === "supporting" ? (target.entry.related_sites ?? []) : [];
    const pairKey = canonicalComparePairSlug(slug.replace(/^compare\//, ""));
    const hero = selectGuideHero(related, pairKey);
    images = hero ? 1 : 0;
    ogimg = hero ? "hero" : "favicon";
    const cats = Array.isArray(generated.comparison_categories)
      ? (generated.comparison_categories as { site_a_detail?: string; site_b_detail?: string }[])
      : [];
    const chunks = [
      generated.intro, generated.site_a_summary, generated.site_b_summary,
      ...cats.flatMap((c) => [c?.site_a_detail ?? "", c?.site_b_detail ?? ""]),
      generated.verdict,
    ].filter((x): x is string => typeof x === "string");
    ilinks = countProseLinks(chunks);
  } else if (contentType === "review") {
    ogimg = "fetched"; // og image fetched from the site at persist time
  }

  // Direct console.log (not log.info) so the line starts exactly with
  // [content][quality] rather than the doubled "[content] [content][quality]".
  console.log(
    `[content][quality] type=${contentType} slug=${slug} words=${words} images=${images} ` +
    `ilinks=${ilinks} schema=${schema} faqs=${faqs} title=${h1.length}c desc=${meta.length}c ` +
    `ogimg=${ogimg} → ${pass ? "PASS" : "WARN"}`,
  );
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

async function repairMeta(
  generated: Record<string, unknown>,
  target: { kind: "review"; entry: ReviewQueueEntry } | { kind: "supporting"; entry: SupportingQueueEntry },
): Promise<string | null> {
  const name = target.kind === "review" ? target.entry.name : target.entry.title;
  const current = (generated.meta_description as string) ?? "";
  const tagline = (generated.tagline as string) ?? "";
  log.info(`Repairing short meta (${current.length} chars) for ${name}...`);

  // Target ~150 chars, accept 120-200. Cap output tokens at 80 (≈320 chars
  // worst case) so the model can't run away with a multi-paragraph rewrite
  // like the 487-char overcorrection we hit previously.
  const targetLen = 150;
  const expandBy = Math.max(5, targetLen - current.length);
  const anthropic = getAnthropic();
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 80,
    system: "You write Google search snippets. Output ONLY the snippet — no JSON, no quotes, no preamble. Do not exceed 200 characters under any circumstances.",
    messages: [{
      role: "user",
      content: `The current meta description for ${name} is ${current.length} characters — ${current.length < 120 ? "too short" : "out of range"}. Target: ~${targetLen} characters total (acceptable range 120-200). Expand the existing text by approximately ${expandBy}-${expandBy + 15} characters — do NOT rewrite from scratch and do NOT exceed 200 characters total. Must still include "${name}". Reference tagline: "${tagline}".\n\nCurrent: "${current}"\n\nReturn only the rewritten meta description.`,
    }],
  });

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  let cleaned = block.text.trim().replace(/^["']|["']$/g, "");
  // Hard cap at 200 even if the model overshoots — truncate at the last
  // sentence boundary or word boundary to stay readable.
  if (cleaned.length > 200) {
    const cap = cleaned.slice(0, 200);
    const lastBoundary = Math.max(cap.lastIndexOf(". "), cap.lastIndexOf(", "), cap.lastIndexOf(" "));
    cleaned = (lastBoundary > 120 ? cap.slice(0, lastBoundary) : cap).trim();
  }
  if (cleaned.length >= 120 && cleaned.length <= 200) {
    log.info(`Meta repaired: ${cleaned.length} chars`);
    return cleaned;
  }
  log.warn(`Repair attempt produced ${cleaned.length} chars — still out of range`);
  return null;
}

function isUrlValid(u: string | null | undefined): boolean {
  if (!u) return true; // null is valid (no affiliate)
  try { new URL(u); return true; } catch { return false; }
}

// ---------------------------------------------------------------------------
// Image lookup (Part 3C)
// ---------------------------------------------------------------------------
async function fetchOgImage(homepage: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(homepage, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timer);
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Duplicate detection (Part 3F)
// ---------------------------------------------------------------------------
function isDuplicateMeta(meta: string): boolean {
  if (!existsSync(REVIEWS_FILE)) return false;
  const reviewsSrc = readFileSync(REVIEWS_FILE, "utf-8");
  // Quick existing-content check — if the EXACT meta appears in any source file we've seen, flag.
  const sitesSrc = readFileSync(SITES_FILE, "utf-8");
  const escapedMeta = meta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escapedMeta, "i");
  return re.test(reviewsSrc) || re.test(sitesSrc);
}

// ---------------------------------------------------------------------------
// File mutators (Part 3D)
// ---------------------------------------------------------------------------
function appendSiteEntry(entry: ReviewQueueEntry, generated: Record<string, unknown>, imageUrl: string | null) {
  const src = readFileSync(SITES_FILE, "utf-8");
  // Compute next id and rank.
  const ids = sites.map((s) => parseInt(s.id)).sort((a, b) => b - a);
  const nextId = String((ids[0] ?? 0) + 1);
  const ranks = sites.map((s) => s.rank).sort((a, b) => b - a);
  const nextRank = (ranks[0] ?? 0) + 1;

  const scores = generated.scores as Record<string, number>;
  const pros = generated.pros as string[];
  const cons = generated.cons as string[];
  const overall = scores.overall;

  // Map 1-10 scores to existing 0-100 fields used by ReviewPage.
  const round = (n: number) => Math.round(n * 10);

  // Best-effort guess at price fields. The generator doesn't currently
  // produce prices — we'll use the queue defaults if not present.
  const price_monthly = (generated.price_monthly as string) ?? "$29.95/mo";
  const price_annual = (generated.price_annual as string) ?? "$9.95/mo";
  const price_quarterly = (generated.price_quarterly as string) ?? "$19.95/mo";

  // Editorial-only reviews: no affiliate, no price (we don't know it
  // without partnering), no deal. The flag also stamps editorial_status
  // so renderers + ranking-surface filters know to handle accordingly.
  const isEditorialOnly = entry.editorial_mode === "research-only";

  const block = `  {
    id: "${nextId}",
    name: "${entry.name}",
    slug: "${entry.slug}",
    short_description: ${JSON.stringify(generated.tagline ?? `${entry.name} review.`)},
    description: ${JSON.stringify(generated.review_body_p1)},
    overall_score: ${overall.toFixed(1)},
    content_quality: ${round(scores.content_quality)},
    value_score: ${round(scores.value_for_money)},
    update_frequency: ${round(scores.update_frequency)},
    mobile_score: ${round(scores.site_design)},
    price_from: ${JSON.stringify(isEditorialOnly ? "n/a" : price_annual)},
    price_monthly: ${JSON.stringify(isEditorialOnly ? "n/a" : price_monthly)},
    price_quarterly: ${JSON.stringify(isEditorialOnly ? "n/a" : price_quarterly)},
    price_annual: ${JSON.stringify(isEditorialOnly ? "n/a" : price_annual)},
    affiliate_url: ${entry.affiliate_url ? JSON.stringify(entry.affiliate_url) : "null"},
    homepage_url: ${JSON.stringify(entry.homepage_url)},
    categories: ${JSON.stringify(entry.niche)},
    pros: ${JSON.stringify(pros)},
    cons: ${JSON.stringify(cons)},
    rank: ${nextRank},
    badge: ${isEditorialOnly ? JSON.stringify("Editorial-only") : "null"},
    is_featured: false,
    has_free_trial: false,
    has_hd: true,
    best_for: ${JSON.stringify(generated.best_for)},
    deal_text: ${JSON.stringify(isEditorialOnly ? "" : "Up to 67% off annual plan")},
    deal_discount: ${isEditorialOnly ? 0 : 67},
    deal_type: "ongoing",${isEditorialOnly ? `\n    editorial_status: "editorial-only",` : ""}
  },
`;

  const updated = src.replace(/(\n\];\s*\n\nexport const categories)/, `\n${block}];\n\nexport const categories`);
  if (updated === src) {
    throw new Error("Failed to splice new site entry — sites.ts pattern not matched.");
  }
  writeFileSync(SITES_FILE, updated, "utf-8");
  log.info(`Appended site entry: ${entry.slug} (id=${nextId}, rank=${nextRank})`);
  void imageUrl; // image_url is currently not part of SiteData interface; kept for future migration.
}

function appendReviewBody(slug: string, generated: Record<string, unknown>, opts: { overwrite?: boolean } = {}) {
  const src = readFileSync(REVIEWS_FILE, "utf-8");
  const body = [
    generated.review_body_p1,
    generated.review_body_p2,
    generated.review_body_p3,
    generated.review_body_p4,
  ].join("\n\n");
  const block = `\n  ${JSON.stringify(slug)}:\n    ${JSON.stringify(body)},\n`;

  // Improve mode: replace the existing body entry (a single JSON string
  // value) in place. Matches `"slug":\n    "…",` as written by this function.
  const existingRe = new RegExp(
    `\\n  ${JSON.stringify(slug).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}:\\n    "(?:[^"\\\\]|\\\\.)*",?\\n`,
  );
  if (existingRe.test(src)) {
    if (!opts.overwrite) {
      log.info(`review body for ${slug} already exists, skipping`);
      return;
    }
    const updated = src.replace(existingRe, () => block);
    writeFileSync(REVIEWS_FILE, updated, "utf-8");
    log.info(`OVERWROTE review body for ${slug}`);
    return;
  }

  const updated = src.replace(/(\n};\n)/, `${block}};\n`);
  if (updated === src) throw new Error("Failed to splice review body");
  writeFileSync(REVIEWS_FILE, updated, "utf-8");
  log.info(`Appended review body for ${slug}`);
}

// Removed addSlugToScripts() — generate-sitemap.ts and prerender-app.ts
// now derive SITE_SLUGS / SITE_NAMES from src/data/sites.ts via
// `sites.map(s => s.slug)`, so any new site appended to sites.ts is
// automatically picked up by both scripts on the next build. The old
// splice-into-hardcoded-array logic is no longer needed and was
// silently a no-op against the refactored scripts.

/**
 * Generic upsert into a TypeScript Record<string, T> file. Reads the file,
 * inserts a new entry literal before the closing `};` of the record, writes
 * back. If a key already exists, leaves the file untouched and warns.
 *
 * Used to persist generated body content for comparison / alternatives /
 * isworthit / guide content types into their respective data files.
 */
function upsertContentEntry(file: string, key: string, body: unknown, opts: { overwrite?: boolean } = {}): void {
  const src = readFileSync(file, "utf-8");
  const literal = `  ${JSON.stringify(key)}: ${JSON.stringify(body, null, 2).replace(/\n/g, "\n  ")},\n`;

  // Detect existing key. Default: skip rather than overwrite to avoid
  // clobbering hand-edited content — re-runs on the same key are a no-op.
  // Improve mode passes overwrite:true to REPLACE the existing entry (the
  // whole point is regenerating a thin body with a materially better one).
  const keyRe = new RegExp(`^\\s*${JSON.stringify(key).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*:`, "m");
  if (keyRe.test(src)) {
    if (!opts.overwrite) {
      log.info(`upsert: ${key} already in ${file.split("/").pop()}, skipping`);
      return;
    }
    // Replace the existing entry: from the key, brace-match the value object
    // to its balanced close (string/escape aware — entries are JSON.stringify
    // output), consume the trailing comma/newline, splice the new literal.
    const keyIdx = src.search(keyRe);
    const braceStart = src.indexOf("{", keyIdx);
    if (braceStart === -1) { log.warn(`upsert: no value object for ${key}`); return; }
    let depth = 0, i = braceStart, inStr = false, esc = false;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { i++; break; } }
    }
    let end = i;
    if (src[end] === ",") end++;
    if (src[end] === "\n") end++;
    const entryStart = src.lastIndexOf("\n", keyIdx) + 1;
    const updatedSrc = src.slice(0, entryStart) + literal + src.slice(end);
    writeFileSync(file, updatedSrc, "utf-8");
    log.info(`upsert: OVERWROTE ${key} in ${file.split("/").pop()}`);
    return;
  }

  // Two formats to handle:
  //   1. Empty record: `= {};` (initial state — single line)
  //   2. Populated record: `\n};` on its own line (after first insert)
  //
  // CRITICAL: pass the replacement as a function, not a string. String
  // replacements treat `$` as a backreference prefix ($1, $&, $$ etc.), and
  // AI-generated content frequently contains prices like "$11.99" — when
  // that hit `replace()` as a literal string, "$1" was interpreted as
  // capture-group 1 (the matched terminator) and silently corrupted the
  // JSON output mid-string. Function form has no such interpretation.
  let updated: string;
  if (/=\s*\{\s*\};/.test(src)) {
    updated = src.replace(/=\s*\{\s*\};/, () => `= {\n${literal}};`);
  } else {
    // Preserve the leading newline that the regex consumes, otherwise the
    // new entry joins the previous "}," on the same line — valid JS but
    // visually broken (and fragile if anything later parses by line).
    updated = src.replace(/\n};\s*$/m, () => `\n${literal}};\n`);
  }

  if (updated === src) {
    log.warn(`upsert: could not find record terminator in ${file}`);
    return;
  }
  writeFileSync(file, updated, "utf-8");
  log.info(`upsert: wrote ${key} to ${file.split("/").pop()}`);
}

/**
 * Persists generated content to the per-type data file. Each content type
 * has a distinct convention for how the queue slug maps to the
 * persistence-map key — and to the URL fragment the frontend uses to look
 * the entry back up. Mismatches between any of these three (queue slug /
 * file key / frontend lookup) silently break rendering.
 *
 * This function is the single canonical place that derives the file key
 * from the queue slug AND validates that the resulting key matches what
 * the frontend will look up. A mismatch throws — better to fail loudly
 * at write time than to ship invisible content.
 */
/**
 * Map any AI FAQ-shape drift back to the canonical `{q, a}` the data
 * layer + renderers expect. Handles {question, answer}, {Q, A}, etc.
 * Silently drops malformed entries (no recognizable text content).
 */
function normalizeGeneratedFaq(generated: Record<string, unknown>): Record<string, unknown> {
  const faq = generated.faq;
  if (!Array.isArray(faq)) return generated;
  const Q_ALIASES = ["q", "question", "Q", "Question"];
  const A_ALIASES = ["a", "answer", "A", "Answer", "text", "acceptedAnswer"];
  const normalized = faq.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const e = entry as Record<string, unknown>;
    const q = Q_ALIASES.map((k) => e[k]).find((v) => typeof v === "string" && (v as string).trim().length > 0);
    const a = A_ALIASES.map((k) => e[k]).find((v) => typeof v === "string" && (v as string).trim().length > 0);
    if (!q || !a) return [];
    return [{ q: (q as string).trim(), a: (a as string).trim() }];
  });
  return { ...generated, faq: normalized };
}

function persistSupportingContent(entry: SupportingQueueEntry, generated: Record<string, unknown>): void {
  type ContentBinding = {
    file: string;
    /** Derive the persistence key from the queue slug. */
    keyFromSlug: (slug: string) => string;
    /** Derive what the frontend will look up — for validation only. */
    frontendLookup: (slug: string) => string;
    fileLabel: string;
  };

  const bindings: Record<string, ContentBinding> = {
    comparison: {
      // Persist under the CANONICAL (alphabetical) pair key regardless of
      // queue order — the canonical URL is what's prerendered/sitemapped,
      // and getComparisonBody resolves either order for legacy keys.
      file: COMPARISON_CONTENT_FILE,
      keyFromSlug: (s) => canonicalComparePairSlug(s.replace(/^compare\//, "")),
      frontendLookup: (s) => canonicalComparePairSlug(s.replace(/^compare\//, "")),
      fileLabel: "comparison-content.ts",
    },
    alternatives: {
      file: ALTERNATIVES_CONTENT_FILE,
      keyFromSlug: (s) => s,
      frontendLookup: (s) => s,
      fileLabel: "alternatives-content.ts",
    },
    isworthit: {
      file: ISWORTHIT_CONTENT_FILE,
      keyFromSlug: (s) => s,
      frontendLookup: (s) => s,
      fileLabel: "isworthit-content.ts",
    },
    guide: {
      file: GUIDE_CONTENT_FILE,
      keyFromSlug: (s) => s.replace(/^guide\//, ""),
      frontendLookup: (s) => s.replace(/^guide\//, ""),
      fileLabel: "guide-content.ts",
    },
  };

  const binding = bindings[entry.content_type];
  if (!binding) {
    log.info(`persist: no data file wired for content_type=${entry.content_type}, content logged only`);
    return;
  }

  const writeKey = binding.keyFromSlug(entry.slug);
  const expectedLookup = binding.frontendLookup(entry.slug);
  log.info(`Writing key: "${writeKey}" to ${binding.fileLabel}`);
  log.info(`Frontend will look up: "${expectedLookup}"`);
  if (writeKey !== expectedLookup) {
    throw new Error(
      `Slug mismatch: write key "${writeKey}" ≠ frontend lookup "${expectedLookup}". ` +
      `Refusing to write invisible content. Fix keyFromSlug/frontendLookup in persistSupportingContent for content_type=${entry.content_type}.`
    );
  }

  // FAQ field-shape canonicalization. The TS interfaces (guide-content.ts,
  // comparison-content.ts, alternatives-content.ts, isworthit-content.ts)
  // and every renderer (GuidePage.tsx, ReviewPage.tsx, ComparePage.tsx)
  // read `{q, a}`. Some prompts only loosely specify the FAQ shape and the
  // model sometimes returns `{question, answer}` (or other variants),
  // which silently ships empty FAQs both visually and in JSON-LD until a
  // human notices. Normalize here so the field-name choice can't drift.
  // Guides: stamp the hero image (chosen from existing clean site covers) and
  // the related_sites list onto the body so GuidePage can render the hero,
  // link it to the depicted site, set og:image, and show "Sites mentioned".
  if (entry.content_type === "guide") {
    generated.related_sites = entry.related_sites;
    // Seed by the guide slug so each guide gets a DIFFERENT hero from its
    // covered related sites (instead of every guide collapsing onto the first
    // covered slug). Deterministic → stable across rebuilds.
    const hero = selectGuideHero(entry.related_sites, writeKey);
    if (hero) {
      generated.hero_image = hero.hero_image;
      generated.hero_alt = hero.hero_alt;
      generated.hero_site_slug = hero.hero_site_slug;
    }
  }

  const normalized = normalizeGeneratedFaq(generated);
  upsertContentEntry(binding.file, writeKey, normalized);

  // Stamp the route's lastmod so generate-sitemap.ts can emit accurate
  // <lastmod> for this URL — without this Google never gets a recrawl
  // signal when AI body content updates.
  const routePath = (() => {
    switch (entry.content_type) {
      case "comparison":
        // Canonical (alphabetical) so the lastmod keys the same /compare URL
        // that generate-sitemap.ts emits — otherwise the sitemap lookup misses
        // and falls back to TODAY, giving Google no real recrawl signal.
        return `/compare/${canonicalComparePairSlug(writeKey)}`;
      case "alternatives":
        return `/alternatives/${writeKey.replace(/-alternatives$/, "")}`;
      case "isworthit":
        return `/is-${writeKey}-worth-it`;
      case "guide":
        return `/guide/${writeKey}`;
      default:
        return `/${writeKey}`;
    }
  })();
  stampContentLastmod(routePath);
}

/** Tracker for per-route lastmod values; consumed by generate-sitemap.ts. */
const CONTENT_LASTMOD_FILE = resolve(ROOT, "docs/content-lastmod.json");
function stampContentLastmod(routePath: string): void {
  let map: Record<string, string> = {};
  try {
    map = JSON.parse(readFileSync(CONTENT_LASTMOD_FILE, "utf-8"));
  } catch { /* file may not exist on first run */ }
  map[routePath] = new Date().toISOString().split("T")[0];
  writeFileSync(CONTENT_LASTMOD_FILE, JSON.stringify(map, null, 2) + "\n", "utf-8");
}

function markQueuePublished(slug: string, kind: "review" | "supporting") {
  const src = readFileSync(QUEUE_FILE, "utf-8");
  // Targeted replace: find the entry with this slug whose status is "queued" and flip to "published".
  const re = new RegExp(`(slug:\\s*["']${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^}]*?status:\\s*)["']queued["']`);
  const updated = src.replace(re, `$1"published"`);
  if (updated !== src) {
    writeFileSync(QUEUE_FILE, updated, "utf-8");
    log.info(`Marked queue entry ${kind}:${slug} as published`);
  } else {
    // Programmatic entries (comparisons/isworthit/alternatives built by
    // .map() in content-queue.ts) have no literal status text to flip —
    // their published-state is DERIVED from the content file the persist
    // step just wrote to. Expected, not an error. (Before this state model,
    // the silent regex miss here re-picked the same comparison daily for
    // two weeks.)
    log.info(`Queue state for ${slug} is derived from its content file (no literal row to edit) — persist already made it published.`);
  }
}

// ---------------------------------------------------------------------------
// Build + sitemap regeneration
// ---------------------------------------------------------------------------
function runBuild(): { passed: boolean; commitHash: string } {
  try {
    log.info("Regenerating sitemap...");
    execSync("npx tsx scripts/generate-sitemap.ts", { cwd: ROOT, stdio: "inherit" });
    log.info("Running vite build (client)...");
    execSync("npx vite build", { cwd: ROOT, stdio: "inherit" });
    log.info("Running vite build (ssr)...");
    execSync("npx vite build --ssr src/entry-server.tsx --outDir dist-server", { cwd: ROOT, stdio: "inherit" });
    log.info("Running prerender-app (renders React tree into per-route HTML)...");
    execSync("npx tsx scripts/prerender-app.ts", { cwd: ROOT, stdio: "inherit" });
    // SEO hygiene gate — fails the build if any hard-fail flag (thin or
    // long title/desc, missing schema, client-side-only render) is on any
    // route. Keeps daily auto-content from regressing the SEO baseline.
    log.info("Running audit-content (strict)...");
    execSync("npx tsx scripts/audit-content.ts --strict", { cwd: ROOT, stdio: "inherit" });
    return { passed: true, commitHash: "" };
  } catch (e) {
    log.err(`Build failed: ${(e as Error).message}`);
    return { passed: false, commitHash: "" };
  }
}

/**
 * Publish-integrity gate: after the build, before commit/push, verify the
 * new page ACTUALLY EXISTS as served output. Catches the invisible-publish
 * class of failure — on 2026-07-17 the engine generated isworthit content
 * for a slug with no route; the build "succeeded", the sitemap gained the
 * URL, Google was pinged… and the URL served the homepage via SPA fallback.
 * A page that fails these checks must never ship: (1) prerendered HTML file
 * exists for the route, (2) it carries a non-homepage <title>, (3) its
 * canonical matches the route, (4) it is NOT noindex, (5) the route is in
 * the generated sitemap.
 */
function verifyPublishIntegrity(routePath: string): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  const fileRel = routePath === "/" ? "index.html" : `${routePath.replace(/^\//, "")}/index.html`;
  const distFile = resolve(ROOT, "dist", fileRel);
  if (!existsSync(distFile)) {
    problems.push(`no prerendered HTML at dist/${fileRel} — route missing from prerender (would serve the homepage shell)`);
    return { ok: false, problems };
  }
  const html = readFileSync(distFile, "utf-8");
  const title = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? "";
  if (!title || /^TwinkVault — Best Gay Twink Sites/.test(title)) {
    problems.push(`prerendered <title> is missing or the homepage default ("${title.slice(0, 60)}") — page not actually rendered`);
  }
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) ?? [])[1] ?? "";
  if (canonical !== `${BASE_URL}${routePath}`) {
    problems.push(`canonical "${canonical}" ≠ expected "${BASE_URL}${routePath}"`);
  }
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) {
    problems.push("page renders noindex — published content would be excluded from the index");
  }
  try {
    const sitemap = readFileSync(resolve(ROOT, "public/sitemap.xml"), "utf-8");
    if (!sitemap.includes(`<loc>${BASE_URL}${routePath}</loc>`)) {
      problems.push("route missing from generated sitemap.xml — Google has no discovery path");
    }
  } catch { problems.push("sitemap.xml unreadable"); }
  return { ok: problems.length === 0, problems };
}

/**
 * Print a full inspection report for a freshly-generated page from its
 * prerendered HTML in dist/. Used by --inspect. Read-only on dist/.
 */
function printInspectionReport(routePath: string, gateOk: boolean, generated: Record<string, unknown>): void {
  const fileRel = routePath === "/" ? "index.html" : `${routePath.replace(/^\//, "")}/index.html`;
  const distFile = resolve(ROOT, "dist", fileRel);
  console.log("\n════════ INSPECTION REPORT — live-generated, no commit/push/ping ════════");
  console.log(`route: ${routePath}`);
  console.log(`[5] GATES: ${gateOk ? "PASS (no WARN/HARD_FAIL)" : "did NOT fully pass — see warnings above"}`);

  let html = "";
  try { html = readFileSync(distFile, "utf-8"); }
  catch { console.log(`⚠ prerendered HTML not found at dist/${fileRel} (build failed before prerender?)`); return; }

  // [2] Hero image
  const hero = html.match(/<img[^>]*src="(\/(?:site-banners|niche-covers)\/[^"]+)"[^>]*\balt="([^"]*)"/i);
  const og = html.match(/<meta property="og:image" content="([^"]*)"/i);
  console.log("\n[2] HERO IMAGE:");
  if (hero) {
    console.log(`  src = ${hero[1]}`);
    console.log(`  alt = "${hero[2]}"`);
    console.log(`  → clean per-site cover from site-imagery.ts (not the favicon, not a leaderboard/promo banner)`);
  } else {
    console.log("  ⚠ no content hero <img> found");
  }
  console.log(`  og:image = ${og?.[1] ?? "?"}${og && /pwa-\d+\.png/.test(og[1]) ? "  ⚠ FAVICON" : "  ✓ (real hero, not favicon)"}`);

  // [3] Internal links in the article body (excludes nav/footer chrome)
  const article = (html.match(/<article[\s\S]*?<\/article>/i) ?? [""])[0];
  const seen = new Set<string>();
  const links = [...article.matchAll(/<a[^>]*href="(\/(?:reviews|niche)\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, "").trim() }))
    .filter((l) => (seen.has(l.href) ? false : seen.add(l.href)));
  console.log(`\n[3] INTERNAL LINKS in <article> body (${links.length}):`);
  links.slice(0, 25).forEach((l) => console.log(`  ${l.href}  ←  "${l.text}"`));
  console.log(`  → ${links.length >= 3 ? "✓ ≥3 contextual internal links" : "⚠ fewer than 3"}`);

  // [4] FAQ — visible HTML + FAQPage JSON-LD
  const faqArr = Array.isArray(generated.faq) ? (generated.faq as { q?: string; a?: string }[]) : [];
  const faqLd = html.match(/\{[^{}]*"@type"\s*:\s*"FAQPage"[\s\S]*?\}\s*<\/script>/i)
    ?? html.match(/"@type"\s*:\s*"FAQPage"[\s\S]*?<\/script>/i);
  const qCount = faqLd ? (faqLd[0].match(/"@type"\s*:\s*"Question"/g) ?? []).length : 0;
  const hasEmpty = faqLd ? /"name"\s*:\s*""|"text"\s*:\s*""/.test(faqLd[0]) : true;
  const firstQ = faqArr[0]?.q;
  console.log("\n[4] FAQ:");
  console.log(`  generated FAQ entries: ${faqArr.length}`);
  console.log(`  FAQPage JSON-LD: ${faqLd ? "present" : "MISSING"}; Question entries: ${qCount}; non-empty: ${faqLd && !hasEmpty ? "yes ✓ (EMPTY_FAQ bug not present)" : "NO ⚠"}`);
  if (firstQ) console.log(`  first question rendered in visible HTML: ${html.includes(firstQ.slice(0, 30)) ? "yes ✓" : "NO ⚠"}`);
  console.log("═══════════════════════════════════════════════════════════════════════\n");
}

// ---------------------------------------------------------------------------
// Git commit + push
// ---------------------------------------------------------------------------
function commitAndPush(message: string): string {
  execSync(`git config user.email "${process.env.GIT_USER_EMAIL || "isaac.m.builds@gmail.com"}"`, { cwd: ROOT });
  execSync(`git config user.name "${process.env.GIT_USER_NAME || "TwinkVault Auto"}"`, { cwd: ROOT });
  execSync("git add -A", { cwd: ROOT });
  execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: ROOT, stdio: "inherit" });
  const hash = execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim();
  execSync("git push origin main", { cwd: ROOT, stdio: "inherit" });
  return hash;
}

// ---------------------------------------------------------------------------
// Indexing pings (Part 3I, 3J)
// ---------------------------------------------------------------------------
/**
 * Resubmit the sitemap via the Search Console Sitemaps API after a publish.
 * This is the RELIABLE discovery path for new URLs: Google only re-fetches
 * sitemap.xml on its own schedule (observed gap: last download Jul 9 while
 * three new money reviews shipped Jul 10–12 and sat "unknown to Google"),
 * and the Indexing API ping below is officially scoped to JobPosting pages —
 * a weak nudge for regular content. Resubmission triggers a prompt re-fetch,
 * which is how each day's new page actually enters Google's discovery queue.
 */
async function resubmitSitemap(): Promise<boolean> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return false;
  try {
    const decoded = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const auth = new GoogleAuth({
      credentials: JSON.parse(decoded),
      scopes: ["https://www.googleapis.com/auth/webmasters"],
    });
    const client = await auth.getClient();
    const prop = encodeURIComponent(`${BASE_URL}/`);
    await client.request({
      url: `https://www.googleapis.com/webmasters/v3/sites/${prop}/sitemaps/${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`,
      method: "PUT",
    });
    log.info("Sitemap resubmitted to Google (prompt re-fetch → new URL discovery)");
    return true;
  } catch (e) {
    log.warn(`Sitemap resubmit failed: ${(e as Error).message?.slice(0, 140)}`);
    return false;
  }
}

async function pingGoogle(url: string): Promise<boolean> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    // Loud failure — visible in the Action summary, not buried in a warn.
    // After the June 2026 crawl-block incident, silently skipping these
    // pings while the site needs every crawl signal possible is the
    // wrong default. See docs/seo-pipeline-setup.md for setup.
    log.err("🚨 GOOGLE_SERVICE_ACCOUNT_JSON is NOT SET — Google Indexing API ping skipped. Google won't be nudged to crawl new content. Set this secret in GitHub Actions → Repository Secrets. See docs/seo-pipeline-setup.md.");
    return false;
  }
  try {
    const decoded = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const credentials = JSON.parse(decoded);
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });
    const client = await auth.getClient();
    const res = await client.request({
      url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
      method: "POST",
      data: { url, type: "URL_UPDATED" },
    });
    log.info(`Google ping ok (${res.status})`);
    return true;
  } catch (e) {
    log.warn(`Google ping failed: ${(e as Error).message}`);
    return false;
  }
}

/**
 * Confirm the IndexNow key file is actually served as the bare key before
 * pinging. The 403 we hit in production came from this file returning the SPA
 * HTML shell (when it predated the live deploy) instead of the key — Bing
 * fetches it to verify ownership and rejects the whole submission if it
 * doesn't byte-match. Catching it here turns a silent 403 into an actionable
 * diagnostic instead of a doomed POST.
 */
async function verifyIndexNowKeyHosted(key: string, keyUrl: string): Promise<boolean> {
  try {
    const r = await fetch(keyUrl, { headers: { "cache-control": "no-cache" } });
    const ct = r.headers.get("content-type") ?? "";
    const body = (await r.text()).trim();
    if (!r.ok) {
      log.err(`🚨 IndexNow key file ${keyUrl} returned HTTP ${r.status}. Bing will 403 every submission until it serves the bare key.`);
      return false;
    }
    if (ct.includes("text/html") || body !== key) {
      log.err(
        `🚨 IndexNow key file ${keyUrl} is NOT serving the bare key (content-type=${ct || "?"}, ` +
        `${body.length} bytes). It's likely returning the SPA HTML shell because public/${key}.txt ` +
        `isn't in the live deploy yet. Deploy it and confirm it serves text/plain — Bing rejects key ` +
        `verification (403) until then. Skipping the Bing ping.`,
      );
      return false;
    }
    return true;
  } catch (e) {
    log.warn(`Could not verify IndexNow key file (${(e as Error).message}); skipping Bing ping to avoid a 403.`);
    return false;
  }
}

async function pingBing(url: string): Promise<boolean> {
  const key = process.env.BING_INDEXNOW_KEY;
  if (!key) {
    log.err("🚨 BING_INDEXNOW_KEY is NOT SET — Bing IndexNow ping skipped. Set this secret in GitHub Actions → Repository Secrets, and host the same key at https://twinkvault.com/{key}.txt. See docs/seo-pipeline-setup.md.");
    return false;
  }
  const keyUrl = `${BASE_URL}/${key}.txt`;
  // Pre-flight: a doomed POST against an unverifiable key file is the exact
  // 403 we saw daily. Verify first, log precisely, and skip if not hosted.
  if (!(await verifyIndexNowKeyHosted(key, keyUrl))) return false;
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // keyLocation is explicit (spec-recommended) so Bing fetches the exact
      // hosted file rather than guessing the host root.
      body: JSON.stringify({ host: "twinkvault.com", key, keyLocation: keyUrl, urlList: [url] }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      log.warn(`Bing ping failed (${r.status})${detail ? ` — ${detail.slice(0, 200)}` : ""}`);
      return false;
    }
    log.info(`Bing ping ok (${r.status})`);
    return true;
  } catch (e) {
    log.warn(`Bing ping failed: ${(e as Error).message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Supabase logging (Part 3K)
// ---------------------------------------------------------------------------
async function logToSupabase(row: Record<string, unknown>) {
  // Sanitize: GitHub Secrets sometimes get saved with surrounding quotes
  // (if the user pasted "https://..." instead of https://...). Supabase's
  // createClient validator rejects values with quotes as invalid URLs.
  // Strip wrapping quotes and trim whitespace defensively.
  const sanitize = (v: string | undefined): string | undefined => {
    if (!v) return v;
    return v.trim().replace(/^["']|["']$/g, "");
  };
  const url = sanitize(process.env.VITE_SUPABASE_URL);
  const key = sanitize(process.env.VITE_SUPABASE_ANON_KEY) || sanitize(process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  if (!url || !key) {
    log.warn("Supabase env vars missing — skipping content_log insert");
    return;
  }
  if (!/^https?:\/\//.test(url)) {
    log.warn(`Supabase URL invalid (got "${url.slice(0, 40)}..."). Check the GitHub Secret value — must start with https:// and contain no surrounding quotes.`);
    return;
  }
  try {
    const supa = createClient(url, key);
    const { error } = await supa.from("content_log").insert(row as never);
    if (error) log.warn(`Supabase log error: ${error.message}`);
    else log.info("Logged to content_log");
  } catch (e) {
    log.warn(`Supabase log failed: ${(e as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// Resolution: which item to generate today?
// ---------------------------------------------------------------------------
/**
 * Load demand queries once per run (mirror → direct GSC → none). Exposed so
 * both the create picker and the improve-task builder price value in the
 * same currency.
 */
async function loadDemandQueries(): Promise<{ queries: import("../src/lib/contentRanker.js").GscQueryAggregate[]; source: string }> {
  const { fetchGscQueriesNode, fetchGscQueriesDirect } = await import("./lib/gsc-node-client.js");
  const { aggregateGscQueries } = await import("../src/lib/contentRanker.js");
  let rawGsc = await fetchGscQueriesNode(28);
  let demandSource = "supabase-mirror";
  if (rawGsc.length === 0) {
    rawGsc = await fetchGscQueriesDirect(28);
    demandSource = rawGsc.length > 0 ? "direct-gsc-api" : "none";
  }
  return { queries: aggregateGscQueries(rawGsc), source: demandSource };
}

/**
 * Value floor for CREATING a new page. A candidate below this (and without
 * real search demand) isn't worth a publish slot — the run's slot goes to
 * improving an existing weak page instead. Explicit --site/--type/--force
 * overrides bypass the floor (human intent).
 */
const CREATE_FLOOR = 6;
const CREATE_DEMAND_OVERRIDE = 3; // demandBonus ≥ this ⇒ real searches exist

async function resolveTarget(
  flags: Flags,
  exclude: Set<string> = new Set(),
  demand?: { queries: import("../src/lib/contentRanker.js").GscQueryAggregate[]; source: string },
): Promise<{ kind: "review"; entry: ReviewQueueEntry } | { kind: "supporting"; entry: SupportingQueueEntry } | null> {
  // --site override (unchanged: explicit slug always wins). Never falls
  // through to another item — you asked for this exact one.
  if (flags.site) {
    if (exclude.has(flags.site)) return null;
    const r = reviewQueue.find((q) => q.slug === flags.site);
    if (r) return { kind: "review", entry: r };
    const s = supportingQueue.find((q) => q.slug === flags.site);
    if (s) return { kind: "supporting", entry: s };
    return null;
  }

  // --type override (honors the exclusion set for fallback-to-next-item)
  if (flags.type) {
    if (flags.type === "review") {
      const r = nextReviewToPublish();
      return r && !exclude.has(r.slug) ? { kind: "review", entry: r } : null;
    }
    const s = [...supportingCandidates(flags.type as SupportingContentType)]
      .filter((e) => !exclude.has(e.slug))
      .sort((a, b) => b.priority - a.priority)[0];
    return s ? { kind: "supporting", entry: s } : null;
  }

  // --force: highest static-priority queued review, skipping archived + tried.
  if (flags.force) {
    const sorted = [...reviewQueue]
      .filter((r) => r.status === "queued" && r.editorial_mode !== "archived" && !exclude.has(r.slug))
      .sort((a, b) => b.priority - a.priority);
    if (sorted.length) return { kind: "review", entry: sorted[0] };
  }

  // ── Demand-driven resolution ─────────────────────────────────────────
  // Fetch live GSC query data + build the cannibalization/duplication
  // index, then pick the highest-effective-priority candidate across
  // both queues. Falls back to static priority if Supabase is unreachable.
  const { buildIndex, rankAllCandidates } = await import("../src/lib/contentRanker.js");
  const { queries: gscQueries, source: demandSource } = demand ?? (await loadDemandQueries());
  log.info(`Ranker: loaded ${gscQueries.length} aggregated GSC queries (source: ${demandSource}${gscQueries.length === 0 ? " — falling back to static priority" : ""})`);

  // Build the existing-content index from sites.ts + already-published
  // queue entries (so we never re-rank a published item to the top).
  const existingSlugs = new Set<string>([
    ...sites.map((s) => s.slug),
    ...reviewQueue.filter((r) => r.status === "published").map((r) => r.slug),
    ...supportingQueue.filter((s) => s.status === "published").map((s) => s.slug),
  ]);
  // Use the site's static route table as the cannibalization corpus —
  // best-* landing pages, niche pages, and existing reviews all count.
  const routes = [
    "/", "/top-sites", "/reviews", "/best-deals", "/compare",
    ...sites.map((s) => `/reviews/${s.slug}`),
    ...sites.map((s) => `/discount/${s.slug}`),
    "/best-twink-sites", "/free-trial-twink-sites", "/cheapest-twink-sites",
    "/best-bareback-gay-sites", "/best-asian-gay-sites", "/best-amateur-gay-sites",
    "/best-premium-gay-sites", "/best-daddy-twink-sites",
    "/best-gay-sites-under-10", "/best-gay-twink-sites-2026",
    "/best-gay-sites-with-downloads", "/best-twink-porn-sites-with-free-trials",
    "/best-cheap-gay-porn-sites", "/best-bareback-twink-sites",
    "/best-gay-porn-sites", "/best-gay-porn-subscription",
    "/best-twink-porn-sites", "/gay-porn-sites-with-free-trial",
    "/best-value-gay-porn-sites", "/gay-porn-site-reviews", "/gay-porn-sites-ranked",
    "/best-gay-sites-for-beginners",
  ];
  const index = buildIndex(gscQueries, routes, existingSlugs);

  // Editorial-only cap: limit genuinely non-monetized speculative coverage.
  // The count keys off editorial_status === "editorial-only" (NOT
  // editorial_mode === "research-only"), which makes it self-correcting: when
  // a research-only review gets a real affiliate deal and is flipped to a
  // normal commercial review, the owner sets editorial_status: "reviewed", so
  // it stops counting here and frees a slot. Only still-unmonetized pages
  // count toward the cap. Raised 5 → 8 per the owner's spec.
  const editorialOnlyCurrent = sites.filter((s) => s.editorial_status === "editorial-only").length;
  const editorialOnlyCap = 8;

  // Exclude items already tried this run (fallback-to-next-item) so the
  // picker returns the NEXT-best candidate instead of the one that just failed.
  const reviews = reviewCandidates().filter((r) => !exclude.has(r.slug));
  const supporting = supportingCandidates().filter((s) => !exclude.has(s.slug));
  const ranked = rankAllCandidates(reviews, supporting, index, {
    editorialOnlyCap,
    editorialOnlyCurrent,
  });
  const picked = ranked[0] ?? null;
  if (!picked) return null;

  // Leaderboard: top-5 candidates with score components, so it's visible in
  // the run log whether demand data is flowing (+demand should be non-zero
  // for pages matching real queries) and why the winner won.
  for (const c of ranked.slice(0, 5)) {
    const k = c.ranking;
    log.info(
      `  candidate ${c.kind}=${c.entry.slug} effective=${k.effective} ` +
      `(static=${k.staticPriority} +demand=${k.demandBonus} -cann=${k.cannibalizationPenalty} ` +
      `-noaff=${k.noAffiliatePenalty} -dup=${k.duplicationPenalty})`,
    );
  }

  // CREATE value floor: manufacturing a marginal page to fill the day is the
  // exact failure mode this engine used to have. If the best candidate is
  // below the floor and has no real search demand, decline — the caller
  // routes the slot to improve-mode instead.
  if (picked.ranking.effective < CREATE_FLOOR && picked.ranking.demandBonus < CREATE_DEMAND_OVERRIDE) {
    log.info(
      `Picker: best candidate ${picked.kind}=${picked.entry.slug} effective=${picked.ranking.effective} ` +
      `is below the create floor (${CREATE_FLOOR}) with no demand override — declining to create.`,
    );
    return null;
  }

  // Log the decision for visibility.
  const r = picked.ranking;
  log.info(
    `Picker: ${picked.kind}=${picked.entry.slug} effective=${r.effective} ` +
    `(static=${r.staticPriority} +demand=${r.demandBonus} ` +
    `-cann=${r.cannibalizationPenalty} -noaff=${r.noAffiliatePenalty} -dup=${r.duplicationPenalty})` +
    (r.matchedQueries.length ? ` topQueries=${r.matchedQueries.slice(0, 3).map((q) => `"${q.query}"(${q.impressions}imp)`).join(", ")}` : ""),
  );
  return picked.kind === "review"
    ? { kind: "review", entry: picked.entry }
    : { kind: "supporting", entry: picked.entry };
}

type ResolvedTarget =
  | { kind: "review"; entry: ReviewQueueEntry }
  | { kind: "supporting"; entry: SupportingQueueEntry };

/** Build a corrective retry hint, with strong, specific guidance for the
 *  common, fixable failures (H1 too long, meta length, thin word count). */
function buildRetryHint(lastErr: string): string {
  let hint = `Your previous attempt failed these quality checks — fix ONLY these while keeping everything else correct: ${lastErr}.`;
  if (/h1 length \d+ out of/.test(lastErr)) {
    hint += ` CRITICAL: the "h1" field MUST be 50 characters or fewer — count every character including spaces. Shorten it aggressively. For a comparison use the terse "[A] vs [B] (2026)" form (drop "Which Is Better"); for a review use "{Site} Review 2026: {2-3 word hook}" and drop the hook entirely if still over. Do NOT exceed 50 characters under any circumstances.`;
  }
  if (/meta_description length/.test(lastErr)) {
    hint += ` The "meta_description" MUST be between 120 and 165 characters.`;
  }
  const wc = lastErr.match(/word count \d+ < (\d+)/);
  if (wc) {
    hint += ` Expand the body to at least ${wc[1]} words with concrete, specific details (real features, pricing, scene specifics) — do not pad with filler.`;
  }
  return hint;
}

/**
 * Generate + quality-gate ONE queue item, up to MAX_ATTEMPTS times. Returns
 * "publish" when shippable (gate passed, or only cosmetic meta-length issues
 * remain) or "failed" with a reason when the item can't be salvaged (empty/
 * malformed/paused API responses, unfixable H1, thin content). An API error on
 * one attempt no longer aborts — it retries; only exhausting all attempts
 * fails the item. The caller decides whether to fall through to the next item.
 */
async function tryGenerateItem(
  target: ResolvedTarget,
  flags: Flags,
): Promise<
  | { status: "publish"; target: ResolvedTarget; contentType: ContentTypeKey; generated: Record<string, unknown>; gate: { ok: boolean; errors: string[] } }
  | { status: "failed"; reason: string }
> {
  const contentType: ContentTypeKey = target.kind === "review" ? "review" : (target.entry as SupportingQueueEntry).content_type;
  log.info(`Target: ${contentType} → ${target.entry.slug}`);

  // Comparisons require a real hero image from the clean cover library (the
  // page's og:image + visible hero derive from the compared sites' covers).
  // If neither site has a cover, the page can't meet the quality bar — fail
  // BEFORE burning an API call so the picker falls through to the next item.
  if (contentType === "comparison" && target.kind === "supporting") {
    const entry = target.entry as SupportingQueueEntry;
    const hero = selectGuideHero(entry.related_sites, canonicalComparePairSlug(entry.slug.replace(/^compare\//, "")));
    if (!hero) {
      return { status: "failed", reason: "no clean cover available for either compared site — hero required for comparisons" };
    }
  }

  const attemptGeneration = async (extraHint?: string): Promise<Record<string, unknown>> => {
    if (target.kind === "review") {
      const entry = target.entry as ReviewQueueEntry;
      return generate({
        contentType,
        payload: {
          name: entry.name,
          slug: entry.slug,
          homepage_url: entry.homepage_url,
          niche: entry.niche,
          affiliate_network: entry.affiliate_network,
          existing_slugs: sites.map((s) => s.slug),
          retry_hint: extraHint,
          // Switches the prompt to reviewEditorialOnlyPrompt() — no pricing
          // focus, no affiliate CTA framing, transparency about no partnership.
          editorial_only: entry.editorial_mode === "research-only",
        },
      });
    }
    const entry = target.entry as SupportingQueueEntry;
    const enriched = enrichSupportingPayload(entry);
    if (extraHint) enriched.retry_hint = extraHint;
    return generate({ contentType, payload: enriched });
  };

  let generated: Record<string, unknown> = {};
  let gate = { ok: false, errors: ["initial"] as string[] };
  let produced = false;
  const MAX_ATTEMPTS = 3;
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const hint = attempt === 1 ? undefined : buildRetryHint(lastErr);
      log.info(attempt === 1 ? "Generating…" : `Retry ${attempt - 1}/${MAX_ATTEMPTS - 1} with failure hint…`);
      generated = await attemptGeneration(hint);
      produced = true;
    } catch (e) {
      // API-shape failure (empty/paused response, timeout, rate limit).
      // generate() already logged stop_reason/blocks/usage. Don't bail the
      // item — a fresh attempt often succeeds. Record the reason and retry.
      lastErr = `API error: ${(e as Error).message}`;
      log.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} API error: ${(e as Error).message}`);
      continue;
    }

    gate = qualityGate(generated, contentType);

    // Targeted meta-only repair (cheaper than a full regeneration).
    if (!gate.ok && gate.errors.length === 1 && gate.errors[0].includes("meta_description length")) {
      const repaired = await repairMeta(generated, target);
      if (repaired) {
        generated.meta_description = repaired;
        gate = qualityGate(generated, contentType);
      }
    }

    if (gate.ok) break;
    lastErr = gate.errors.join("; ");
    log.warn(`Attempt ${attempt} failed gate: ${lastErr}`);
  }

  if (!produced) {
    return { status: "failed", reason: `no usable generation after ${MAX_ATTEMPTS} attempts (${lastErr})` };
  }

  // Per-item quality summary (reflects the final state, PASS or WARN).
  logQualityLine(generated, target, contentType, gate.ok);

  if (!gate.ok) {
    // Cosmetic = meta length just outside the band → ship it. Anything else
    // (unfixable H1, thin word count, missing fields) = this item failed; the
    // caller may fall through to the next queue item.
    const isCosmetic = (err: string) => {
      if (!err.includes("meta_description length")) return false;
      const match = err.match(/length (\d+)/);
      if (!match) return false;
      const len = parseInt(match[1], 10);
      return len >= 100 && len <= 220;
    };
    if (gate.errors.every(isCosmetic)) {
      log.warn(`Quality gate had cosmetic issues (proceeding anyway):\n  ${gate.errors.join("\n  ")}`);
    } else {
      if (flags.dryRun) log.json("Rejected JSON", generated);
      return { status: "failed", reason: gate.errors.join("; ") };
    }
  }

  return { status: "publish", target, contentType, generated, gate };
}

// ---------------------------------------------------------------------------
// Improve-existing mode (FIX 5): when no create candidate clears the value
// floor, the day's slot goes to substantively expanding an existing weak
// page. Never cosmetic: the result must clear the same quality gate AND be
// materially bigger than the current content, or nothing is persisted.
// ---------------------------------------------------------------------------
const MATERIAL_GROWTH_FACTOR = 1.3; // ≥ +30% …
const MATERIAL_GROWTH_WORDS = 300;  // … or ≥ +300 words

async function runImproveMode(
  flags: Flags,
  demand: { queries: import("../src/lib/contentRanker.js").GscQueryAggregate[]; source: string },
): Promise<boolean> {
  const { buildImprovementQueue, stampLedger } = await import("./lib/improve.js");
  const { COMPARISON_CONTENT } = await import("../src/data/comparison-content.js");
  const { GUIDE_CONTENT } = await import("../src/data/guide-content.js");
  const { reviewBodies } = await import("../src/hooks/useAIReview.js");
  const { getFeaturedComparePairsList } = await import("../src/data/featured-compare-pairs.js");

  // What the engine can actually regenerate. Compares: pairs with an existing
  // AI body (expand) plus featured keep-quality pairs (both sites top-20 —
  // these get a body ADDED, the biggest single-page upgrade available).
  const top20 = new Set([...sites].sort((a, b) => b.overall_score - a.overall_score).slice(0, 20).map((s) => s.slug));
  const keepPairs = getFeaturedComparePairsList().filter((p) => {
    const [a, b] = p.split("-vs-");
    return top20.has(a) && top20.has(b);
  });
  const improvable = {
    reviewSlugs: new Set(Object.keys(reviewBodies)),
    comparePairs: new Set([...Object.keys(COMPARISON_CONTENT).map((k) => canonicalComparePairSlug(k)), ...keepPairs]),
    guideSlugs: new Set(Object.keys(GUIDE_CONTENT)),
  };

  const tasks = buildImprovementQueue(CONTENT_AUDIT_FILE, demand.queries, IMPROVEMENT_LOG_FILE, improvable);
  if (tasks.length === 0) {
    log.info("Improve mode: no improvement candidates (audit clean or all under cooldown).");
    return false;
  }
  log.info(`Improve mode: ${tasks.length} candidates. Top 5:`);
  for (const t of tasks.slice(0, 5)) {
    log.info(`  improve ${t.contentType}=${t.route} score=${t.score} [${t.reasons.join(", ")}]`);
  }

  const MAX_IMPROVE_ATTEMPTS = 3; // distinct tasks to try before giving up
  for (const task of tasks.slice(0, MAX_IMPROVE_ATTEMPTS)) {
    log.info(`── Improving ${task.route} ──`);

    // Build the payload + existing content per type.
    let payload: Record<string, unknown>;
    let existing: unknown;
    let existingWords = 0;
    const contentType = task.contentType as ContentTypeKey;
    if (contentType === "review") {
      const site = sites.find((s) => s.slug === task.key);
      if (!site) continue;
      existing = reviewBodies[task.key] ?? "";
      existingWords = wordCount(String(existing));
      payload = {
        name: site.name,
        slug: site.slug,
        homepage_url: site.homepage_url,
        niche: site.categories,
        affiliate_network: null,
        existing_slugs: sites.map((s) => s.slug),
        editorial_only: site.editorial_status === "editorial-only",
      };
    } else if (contentType === "comparison") {
      const [a, b] = task.key.split("-vs-");
      const sa = sites.find((s) => s.slug === a);
      const sb = sites.find((s) => s.slug === b);
      if (!sa || !sb) continue;
      // Hero requirement applies to improved compares too.
      if (!selectGuideHero([a, b], task.key)) {
        log.info(`  skipping ${task.key}: no clean cover for either site (hero required)`);
        continue;
      }
      existing = COMPARISON_CONTENT[task.key] ?? COMPARISON_CONTENT[`${b}-vs-${a}`] ?? { note: "no editorial body yet — page renders the score template only" };
      existingWords = typeof existing === "object" && existing !== null && "intro" in (existing as Record<string, unknown>)
        ? wordCount(JSON.stringify(Object.values(existing as Record<string, unknown>).filter((v) => typeof v === "string").join(" ")))
        : 0;
      payload = {
        title: `${sa.name} vs ${sb.name}`,
        slug: `compare/${task.key}`,
        site_a_slug: a,
        site_b_slug: b,
        site_a_name: sa.name,
        site_b_name: sb.name,
        site_a_summary: sa.short_description ?? "",
        site_b_summary: sb.short_description ?? "",
      };
    } else {
      const g = GUIDE_CONTENT[task.key];
      if (!g) continue;
      existing = g;
      existingWords = wordCount(
        [g.intro, ...(g.sections ?? []).map((s: { content?: string }) => s?.content ?? ""), g.conclusion]
          .filter((x): x is string => typeof x === "string")
          .join(" "),
      );
      payload = {
        title: g.h1,
        slug: `guide/${task.key}`,
        target_keyword: g.h1.toLowerCase(),
        related_sites: g.related_sites ?? [],
      };
    }

    const targetWords = Math.max(
      contentType === "guide" ? 1200 : contentType === "review" ? 1000 : 900,
      Math.ceil((existingWords * MATERIAL_GROWTH_FACTOR) / 100) * 100,
    );

    // Generate with the same retry discipline as creates.
    let generated: Record<string, unknown> | null = null;
    let gate = { ok: false, errors: ["initial"] as string[] };
    let lastErr = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const base = await generateImprove(contentType, payload, existing, targetWords);
        generated = lastErr && attempt > 1 ? base : base; // hint folded into prompt below on retry
        gate = qualityGate(generated, contentType);
        if (!gate.ok) {
          lastErr = gate.errors.join("; ");
          log.warn(`  improve attempt ${attempt} failed gate: ${lastErr}`);
          // Fold gate errors into the payload as retry_hint for the next pass.
          payload.retry_hint = buildRetryHint(lastErr);
          continue;
        }
        break;
      } catch (e) {
        lastErr = `API error: ${(e as Error).message}`;
        log.warn(`  improve attempt ${attempt} API error: ${(e as Error).message}`);
      }
    }
    if (!generated || !gate.ok) {
      log.warn(`  "${task.route}" did not produce a gate-passing improvement (${lastErr}). Trying next task.`);
      continue;
    }

    // Material-change guardrail: substantive or nothing. No lastmod games.
    const newWords = bodyWordsFor(generated, contentType);
    const material = newWords >= existingWords * MATERIAL_GROWTH_FACTOR || newWords >= existingWords + MATERIAL_GROWTH_WORDS;
    if (!material) {
      log.warn(`  improvement not material (${existingWords}w → ${newWords}w) — skipping, no persist, no lastmod.`);
      continue;
    }

    const syntheticTarget: ResolvedTarget = {
      kind: "supporting",
      entry: {
        title: task.route,
        slug: contentType === "comparison" ? `compare/${task.key}` : contentType === "guide" ? `guide/${task.key}` : task.key,
        content_type: contentType === "review" ? "guide" : (contentType as SupportingContentType),
        target_keyword: "",
        related_sites: contentType === "comparison" ? task.key.split("-vs-") : [],
        priority: 0,
        status: "queued",
      },
    };
    logQualityLine(generated, syntheticTarget, contentType, true);
    log.info(`  material improvement: ${existingWords}w → ${newWords}w (+${existingWords ? Math.round(((newWords - existingWords) / Math.max(existingWords, 1)) * 100) : 100}%)`);

    if (flags.dryRun) {
      log.info("DRY RUN — improvement not persisted.");
      log.json("Improved JSON", generated);
      return true;
    }

    // ── Persist (overwrite) + stamps, with full-rollback snapshot ─────────
    const snapshots = new Map<string, string>();
    for (const f of ENGINE_SNAPSHOT_FILES()) {
      try { snapshots.set(f, readFileSync(f, "utf-8")); } catch { /* may not exist */ }
    }

    if (contentType === "review") {
      appendReviewBody(task.key, generated, { overwrite: true });
    } else if (contentType === "comparison") {
      const normalized = normalizeGeneratedFaq(generated);
      upsertContentEntry(COMPARISON_CONTENT_FILE, task.key, normalized, { overwrite: true });
    } else {
      generated.related_sites = (existing as { related_sites?: string[] }).related_sites ?? [];
      const hero = selectGuideHero(generated.related_sites as string[], task.key);
      if (hero) {
        generated.hero_image = hero.hero_image;
        generated.hero_alt = hero.hero_alt;
        generated.hero_site_slug = hero.hero_site_slug;
      }
      const normalized = normalizeGeneratedFaq(generated);
      upsertContentEntry(GUIDE_CONTENT_FILE, task.key, normalized, { overwrite: true });
    }
    stampContentLastmod(task.route);
    stampLedger(IMPROVEMENT_LOG_FILE, task.route);

    const build = runBuild();

    if (build.passed) {
      const integrity = verifyPublishIntegrity(task.route);
      if (!integrity.ok) {
        log.err(`Publish integrity FAILED for improved ${task.route}:`);
        for (const pr of integrity.problems) log.err(`  ✗ ${pr}`);
        for (const [f, content] of snapshots) {
          try { writeFileSync(f, content, "utf-8"); } catch { /* */ }
        }
        log.info("Rolled back improvement edits.");
        return false;
      }
      log.info(`Publish integrity ✓ ${task.route}`);
    }

    if (flags.inspect) {
      printInspectionReport(task.route, build.passed, generated);
      for (const [f, content] of snapshots) {
        try { writeFileSync(f, content, "utf-8"); } catch { /* */ }
      }
      log.info("Inspect mode: restored all source files. No commit, no push, no ping.");
      return true;
    }

    if (!build.passed) {
      log.err("Build failed — rolling back improvement edits.");
      for (const [f, content] of snapshots) {
        try { writeFileSync(f, content, "utf-8"); } catch { /* */ }
      }
      process.exit(1);
    }

    if (!flags.push) {
      log.info("Build passed. --push not set, skipping commit/push/ping.");
      return true;
    }

    const commitMessage = `auto(improve): expand ${task.route} — ${new Date().toISOString().slice(0, 10)}`;
    try {
      commitAndPush(commitMessage);
    } catch (e) {
      log.err(`Commit/push failed: ${(e as Error).message}`);
      process.exit(1);
    }
    const pageUrl = `${BASE_URL}${task.route}`;
    log.info(`Submitting improved page to crawlers: ${pageUrl}`);
    await Promise.all([pingGoogle(pageUrl), pingBing(pageUrl), resubmitSitemap()]);
    log.info(`Done (improve). ${pageUrl}`);
    return true;
  }

  log.warn("Improve mode: no task produced a material, gate-passing improvement.");
  return false;
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------
async function main() {
  const flags = parseFlags(process.argv.slice(2));

  // --audit short-circuits everything.
  if (flags.audit) {
    const issues = runAudit();
    printAudit(issues);
    process.exit(0);
  }

  // ── Item selection with fallback-to-next-item ──────────────────────────
  // A single problematic topic (empty/paused API response, an unfixable H1,
  // thin content) shouldn't cost the whole day. Try up to MAX_ITEMS distinct
  // queue items before giving up; only then skip the run. Explicit --site
  // pins exactly one item (no fallthrough). "Skip the day" stays the final
  // fallback — only after retries AND the next-item attempt are exhausted.
  const MAX_ITEMS = flags.site ? 1 : 2;
  const tried = new Set<string>();
  let chosen:
    | { target: ResolvedTarget; contentType: ContentTypeKey; generated: Record<string, unknown> }
    | null = null;

  // Demand data loads ONCE per run and prices both decisions — what's worth
  // creating and what's worth improving — in the same currency.
  const demand = await loadDemandQueries();

  for (let itemNo = 1; itemNo <= MAX_ITEMS; itemNo++) {
    const candidate = await resolveTarget(flags, tried, demand);
    if (!candidate) {
      log.info(itemNo === 1 ? "No create candidate clears the value floor." : "No further queued items to try.");
      break;
    }
    tried.add(candidate.entry.slug);
    if (MAX_ITEMS > 1) log.info(`── Item ${itemNo}/${MAX_ITEMS}: ${candidate.entry.slug} ──`);
    const result = await tryGenerateItem(candidate, flags);
    if (result.status === "publish") {
      chosen = { target: result.target, contentType: result.contentType, generated: result.generated };
      break;
    }
    log.warn(
      `Item "${candidate.entry.slug}" did not produce a publishable article (${result.reason}).` +
      (itemNo < MAX_ITEMS ? " Falling through to the next queue item." : " No more fallback attempts."),
    );
  }

  if (!chosen) {
    // The day's slot is NOT wasted on a marginal create: improve an existing
    // weak page instead. A clean no-op happens only when there is genuinely
    // nothing worth creating AND nothing worth improving.
    const improved = await runImproveMode(flags, demand);
    if (improved) return;
    log.warn("Nothing worth creating and nothing worth improving — clean no-op run.");
    process.exit(0);
  }

  const { target, contentType, generated } = chosen;

  if (target.kind === "review") {
    const entry = target.entry as ReviewQueueEntry;
    if (!isUrlValid(entry.affiliate_url)) {
      log.err(`Invalid affiliate URL format: ${entry.affiliate_url}`);
      process.exit(1);
    }
    if (sites.some((s) => s.slug === entry.slug)) {
      log.err(`Duplicate slug — ${entry.slug} is already in sites.ts`);
      process.exit(1);
    }
  }

  const meta = generated.meta_description as string;
  if (isDuplicateMeta(meta)) {
    log.err(`Duplicate meta description detected. Skipping.`);
    process.exit(1);
  }

  // ── Dry run: print and exit ────────────────────────────────────────────
  if (flags.dryRun) {
    log.info("DRY RUN — no files modified, no commit, no ping.");
    log.json("Generated JSON", generated);
    return;
  }

  // ── Apply: write files (with rollback on subsequent build failure) ────
  //
  // Previously the order was: persist → mark-published → build → commit.
  // If the build failed, the queue had already been flipped to "published"
  // and the data file held uncommitted edits — the entry was effectively
  // lost (next run wouldn't reattempt it because it looked published).
  // Now we snapshot the touched files, persist, build, and if the build
  // fails we restore those files before exiting so the next run can retry
  // the same queue entry cleanly.
  //
  // The snapshot set covers BOTH the data files we edit directly AND the
  // tracked files runBuild() regenerates mid-pipeline (the sitemaps via
  // generate-sitemap.ts, the audit docs via audit-content.ts --strict).
  // Without the latter, a rolled-back run left stale sitemap/audit edits
  // referencing content that was reverted.
  const snapshots = new Map<string, string>();
  for (const f of ENGINE_SNAPSHOT_FILES()) {
    try { snapshots.set(f, readFileSync(f, "utf-8")); } catch { /* file may not exist on fresh runs */ }
  }

  let imageUrl: string | null = null;
  if (target.kind === "review") {
    const entry = target.entry as ReviewQueueEntry;
    imageUrl = await fetchOgImage(entry.homepage_url);
    appendSiteEntry(entry, generated, imageUrl);
    appendReviewBody(entry.slug, generated);
    markQueuePublished(entry.slug, "review");
  } else {
    const entry = target.entry as SupportingQueueEntry;
    persistSupportingContent(entry, generated);
    markQueuePublished(entry.slug, "supporting");
  }

  // Route this publish must serve at (also used for pings below).
  const publishRoute = (() => {
    if (target.kind === "review") return `/reviews/${target.entry.slug}`;
    const slug = target.entry.slug;
    switch (contentType) {
      case "comparison": return `/compare/${canonicalComparePairSlug(slug.replace(/^compare\//, ""))}`;
      case "alternatives":
        return ["helix-studios-alternatives", "sean-cody-alternatives", "nakedsword-alternatives"].includes(slug)
          ? `/${slug}` : `/alternatives/${slug.replace(/-alternatives$/, "")}`;
      case "isworthit": return `/is-${slug}-worth-it`;
      case "guide": return `/guide/${slug.replace(/^guide\//, "")}`;
      case "discount": return `/discount/${slug}`;
      default: return `/${slug}`;
    }
  })();

  // ── Build ─────────────────────────────────────────────────────────────
  const build = runBuild();

  // ── Publish-integrity gate: the page must actually be served ──────────
  if (build.passed) {
    const integrity = verifyPublishIntegrity(publishRoute);
    if (!integrity.ok) {
      log.err(`Publish integrity FAILED for ${publishRoute} — refusing to ship invisible/broken content:`);
      for (const pr of integrity.problems) log.err(`  ✗ ${pr}`);
      for (const [f, content] of snapshots) {
        try { writeFileSync(f, content, "utf-8"); } catch { /* */ }
      }
      log.info("Rolled back all edits. Queue unchanged; fix the route/prerender wiring before this item can publish.");
      process.exit(0);
    }
    log.info(`Publish integrity ✓ ${publishRoute} (prerendered, titled, canonical, indexable, sitemapped)`);
  }

  // ── Inspect mode: report from prerendered HTML, then restore everything ─
  // True end-to-end QA — live generation + real build/prerender — but leaves
  // NO trace: all source/queue edits are reverted, nothing is committed,
  // pushed, or pinged. Runs even if the strict audit hard-failed (the
  // prerender still produced HTML to inspect).
  if (flags.inspect) {
    const slug = target.entry.slug;
    const routePath =
      target.kind === "review" ? `/reviews/${slug}`
      : contentType === "comparison" ? `/compare/${slug.replace(/^compare\//, "")}`
      : contentType === "alternatives"
        ? (["helix-studios-alternatives", "sean-cody-alternatives", "nakedsword-alternatives"].includes(slug)
            ? `/${slug}` : `/alternatives/${slug.replace(/-alternatives$/, "")}`)
      : contentType === "isworthit" ? `/is-${slug}-worth-it`
      : contentType === "guide" ? `/guide/${slug.replace(/^guide\//, "")}`
      : contentType === "discount" ? `/discount/${slug}`
      : `/${slug}`;
    printInspectionReport(routePath, build.passed, generated);
    for (const [f, content] of snapshots) {
      try { writeFileSync(f, content, "utf-8"); } catch { /* */ }
    }
    log.info("Inspect mode: restored all source files (content + queue). No commit, no push, no ping.");
    return;
  }

  if (!build.passed) {
    log.err("Build failed — rolling back data-file edits so tomorrow's run can retry.");
    for (const [f, content] of snapshots) {
      try { writeFileSync(f, content, "utf-8"); log.info(`  restored ${f.split("/").pop()}`); }
      catch (e) { log.warn(`  failed to restore ${f}: ${(e as Error).message}`); }
    }
    await logToSupabase(buildLogRow({ generated, target, contentType, imageUrl, build, commitHash: "", googleOk: false, bingOk: false, error: "build failed" }));
    process.exit(1);
  }

  if (!flags.push) {
    log.info("Build passed. --push not set, skipping commit/push/ping.");
    return;
  }

  // ── Commit + push ─────────────────────────────────────────────────────
  const commitMessage = `auto(${contentType}): add ${target.entry.slug} — ${new Date().toISOString().slice(0, 10)}`;
  let commitHash = "";
  try {
    commitHash = commitAndPush(commitMessage);
  } catch (e) {
    log.err(`Commit/push failed: ${(e as Error).message}`);
    process.exit(1);
  }

  // ── Pings ─────────────────────────────────────────────────────────────
  // URL construction must match the actual frontend route — IndexNow and
  // Google Indexing API both 404 silently on bad URLs, so getting this
  // right is the difference between a same-day crawl and a 2-week wait.
  const pageUrl = `${BASE_URL}${publishRoute}`;
  // Don't ping crawlers for a comparison that renders noindex (non-featured
  // pairs are deliberately noindex to avoid near-duplicate flagging across the
  // combinatorial pair space). Telling Google/Bing to crawl a noindex URL is
  // wasted budget. Featured pairs (and all non-comparison content) still ping.
  const isNoindexComparison =
    contentType === "comparison" && !isFeaturedComparePair(target.entry.slug.replace(/^compare\//, ""));
  if (isNoindexComparison) {
    log.info(`Skipping crawler ping for non-featured (noindex) comparison: ${pageUrl}`);
  }
  const [googleOk, bingOk] = isNoindexComparison
    ? [false, false]
    : (log.info(`Submitting to crawlers: ${pageUrl}`), await Promise.all([pingGoogle(pageUrl), pingBing(pageUrl), resubmitSitemap()]).then((r) => [r[0], r[1]] as [boolean, boolean]));

  // ── Supabase log ──────────────────────────────────────────────────────
  await logToSupabase(buildLogRow({ generated, target, contentType, imageUrl, build, commitHash, googleOk, bingOk }));

  log.info(`Done. ${pageUrl}`);
}

function enrichSupportingPayload(entry: SupportingQueueEntry): Record<string, unknown> {
  const base = { ...entry };
  if (entry.content_type === "comparison") {
    const [a, b] = entry.related_sites;
    const sa = sites.find((s) => s.slug === a);
    const sb = sites.find((s) => s.slug === b);
    return {
      ...base,
      site_a_slug: a,
      site_b_slug: b,
      site_a_name: sa?.name ?? a,
      site_b_name: sb?.name ?? b,
      site_a_summary: sa?.short_description ?? "",
      site_b_summary: sb?.short_description ?? "",
    };
  }
  if (entry.content_type === "discount") {
    const s = sites.find((x) => x.slug === entry.related_sites[0]);
    return {
      ...base,
      name: s?.name ?? entry.related_sites[0],
      price_monthly: s?.price_monthly ?? "$29.95/mo",
      price_annual: s?.price_annual ?? "$9.95/mo",
      savings_percentage: `${s?.deal_discount ?? 50}%`,
    };
  }
  if (entry.content_type === "alternatives" || entry.content_type === "isworthit") {
    const s = sites.find((x) => x.slug === entry.related_sites[0]);
    return { ...base, name: s?.name ?? entry.related_sites[0], candidates: sites.filter((x) => x.slug !== entry.related_sites[0]).slice(0, 12).map((x) => ({ slug: x.slug, name: x.name, score: x.overall_score })) };
  }
  if (entry.content_type === "bestof" || entry.content_type === "awards") {
    return { ...base, candidates: sites.slice(0, 18).map((x) => ({ slug: x.slug, name: x.name, score: x.overall_score, niche: x.categories })) };
  }
  return base as Record<string, unknown>;
}

interface LogArgs {
  generated: Record<string, unknown>;
  target: { kind: "review"; entry: ReviewQueueEntry } | { kind: "supporting"; entry: SupportingQueueEntry };
  contentType: ContentTypeKey;
  imageUrl: string | null;
  build: { passed: boolean };
  commitHash: string;
  googleOk: boolean;
  bingOk: boolean;
  error?: string;
}

function buildLogRow(a: LogArgs) {
  const meta = (a.generated.meta_description as string) ?? "";
  const wc = wordCount(JSON.stringify(a.generated));
  const network = a.target.kind === "review" ? a.target.entry.affiliate_network : null;
  const affPresent = a.target.kind === "review" ? !!a.target.entry.affiliate_url : false;
  const targetKw = a.target.kind === "supporting" ? a.target.entry.target_keyword : a.target.entry.slug;
  const faqCount = Array.isArray(a.generated.faq) ? (a.generated.faq as unknown[]).length : 0;
  const internalLinks = Array.isArray(a.generated.internal_links)
    ? (a.generated.internal_links as unknown[]).length
    : 3; // similar-sites grid is implicit on every page

  return {
    slug: a.target.entry.slug,
    content_type: a.contentType,
    page_title: (a.generated.h1 as string) ?? null,
    word_count: wc,
    affiliate_network: network,
    affiliate_url_present: affPresent,
    target_keyword: targetKw,
    meta_description_length: meta.length,
    faq_count: faqCount,
    internal_links_added: internalLinks,
    build_passed: a.build.passed,
    git_commit_hash: a.commitHash || null,
    google_ping_success: a.googleOk,
    bing_ping_success: a.bingOk,
    error_message: a.error ?? null,
  };
}

main().catch((e) => {
  log.err((e as Error).stack ?? String(e));
  process.exit(1);
});
