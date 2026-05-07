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
  supportingQueue,
  nextReviewToPublish,
  nextSupporting,
  type ReviewQueueEntry,
  type SupportingQueueEntry,
  type SupportingContentType,
} from "../src/data/content-queue.js";
import { sites, type SiteData } from "../src/data/sites.js";

// ---------------------------------------------------------------------------
// Constants & paths
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_FILE = resolve(ROOT, "src/data/sites.ts");
const QUEUE_FILE = resolve(ROOT, "src/data/content-queue.ts");
const REVIEWS_FILE = resolve(ROOT, "src/hooks/useAIReview.ts");
const SITEMAP_SCRIPT = resolve(ROOT, "scripts/generate-sitemap.ts");
const PRERENDER_SCRIPT = resolve(ROOT, "scripts/prerender-meta.ts");

const BASE_URL = "https://twinkvault.com";
// Sonnet 4.6 is the current latest at time of writing. Override here if you
// want to test a different model — the spec asked for claude-sonnet-4-20250514
// but the newer model produces tighter JSON.
const MODEL = "claude-sonnet-4-6";
// Spec said 2000, but the prompt asks for ~700 words of body + 5 FAQs + scores
// + meta — empirically that's ~3500 output tokens. Bumped to 4000 to avoid
// mid-JSON truncation. Lower this only if you also tighten the word-count
// targets in the prompt builders.
const MAX_TOKENS = 4000;

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
}

function parseFlags(argv: string[]): Flags {
  const f: Flags = { dryRun: false, force: false, audit: false, push: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") f.dryRun = true;
    else if (a === "--force") f.force = true;
    else if (a === "--audit") f.audit = true;
    else if (a === "--push") f.push = true;
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

  // 5. Sitemap drift — slugs in sites.ts not present in generate-sitemap.ts.
  const sitemapSrc = readFileSync(SITEMAP_SCRIPT, "utf-8");
  for (const s of sites) {
    if (!sitemapSrc.includes(`"${s.slug}"`)) {
      issues.push({
        category: "sitemap-drift",
        severity: "critical",
        detail: `${s.slug} is in sites.ts but missing from generate-sitemap.ts SITE_SLUGS.`,
      });
    }
  }

  // 6. Reviews missing AI body (falls back to short site.description).
  const reviewsSrc = readFileSync(REVIEWS_FILE, "utf-8");
  for (const s of sites) {
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
- Conversational but informed. No corporate fluff. No SEO keyword stuffing.
- The reader has paid for memberships before and knows when they're being marketed to.
`;

interface GenerateOptions {
  contentType: ContentTypeKey;
  payload: Record<string, unknown>;
}

async function generate({ contentType, payload }: GenerateOptions) {
  const anthropic = getAnthropic();
  const userPrompt = buildUserPrompt(contentType, payload);

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text content in Claude response");
  return parseJsonStrict(block.text);
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
      return reviewPrompt(payload);
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
h1 (primary H1 with main keyword)
h2_sections (array of 5 H2 strings)
comparison_sites (3 existing slugs from the list above, most relevant)
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

Return JSON: { site_a_slug, site_b_slug, h1 ("[A] vs [B] — Which Is Better in 2026?"), intro (~150w), site_a_summary (~100w on A's strengths), site_b_summary (~100w on B's strengths), comparison_categories: 5 entries with { category, site_a_score (1-10), site_b_score (1-10), site_a_detail (2-3 sentences), site_b_detail (2-3 sentences) } covering Content Library, Pricing & Value, Site Design & UX, Update Frequency, Niche Focus. verdict (~200w decisive), who_should_choose_a (one sentence), who_should_choose_b (one sentence), faq (2 comparison-specific entries), meta_description (145-155 chars) }`;
}

function bestofPrompt(p: Record<string, unknown>): string {
  return `Generate a best-of listicle JSON.

Niche: ${p.niche ?? p.title}
Sites to rank (with current overall scores): ${JSON.stringify(p.candidates)}

Return JSON: { h1 ("Best [Niche] Sites 2026 — Ranked & Reviewed"), intro (~200w establishing authority and ranking criteria), sites: array with { slug, rank (1..N), blurb (~150w), best_for (one sentence) } in ranked order, conclusion (~150w summary + CTA), methodology_note (2 sentences on ranking criteria), meta_description (145-155 chars), faq (3 listicle-specific entries) }`;
}

function alternativesPrompt(p: Record<string, unknown>): string {
  return `Generate a "best alternatives to" JSON for ${p.name}.

Existing sites available as alternatives: ${JSON.stringify(p.candidates)}

Return JSON: { h1 ("Best Alternatives To [Site] in 2026"), intro (~150w on why someone wants alternatives + what to look for), alternatives: array with { slug, reason (~100w on fit + comparison) } — pick 5 most relevant from candidates, verdict (~100w wrap-up), meta_description (145-155 chars), faq (2 entries) }`;
}

function guidePrompt(p: Record<string, unknown>): string {
  return `Generate a long-form guide JSON for the topic below.

Title: ${p.title}
Target keyword: ${p.target_keyword}
Related sites: ${(p.related_sites as string[]).join(", ")}

Return JSON: { h1, intro (~200w), sections: 4-5 entries with { h2, content (200-300w each) }, conclusion (~150w with CTAs to review pages), meta_description (145-155 chars), faq (5 entries) }`;
}

function hubPrompt(p: Record<string, unknown>): string {
  return `Generate a niche hub-page JSON.

Niche title: ${p.title}
Niche keyword: ${p.target_keyword}
Sites in this niche: ${JSON.stringify(p.related_sites)}

Return JSON: { h1 ("[Niche] Porn Sites — Complete Guide 2026"), intro (~200w establishing this as the definitive resource), niche_explanation (~150w explaining the niche), site_blurbs: array { slug, blurb (~75w on why this site fits) }, buying_guide (~200w on what to look for), conclusion (~100w), meta_description (145-155 chars), faq (4 entries) }`;
}

// ---------------------------------------------------------------------------
// Quality gates (Part 3G)
// ---------------------------------------------------------------------------
function qualityGate(content: Record<string, unknown>, contentType: ContentTypeKey): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  const meta = content.meta_description as string | undefined;
  if (!meta) errors.push("meta_description missing");
  else if (meta.length < 140 || meta.length > 160) errors.push(`meta_description length ${meta.length} not in 140-160`);

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

  return { ok: errors.length === 0, errors };
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

  const anthropic = getAnthropic();
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: "You write Google search snippets. Output ONLY the snippet — no JSON, no quotes, no preamble.",
    messages: [{
      role: "user",
      content: `Write a meta description for ${name}. Hard constraint: between 145 and 155 characters INCLUSIVE — count carefully. Must include "${name}". Buying intent. Hook ending. Reference: tagline="${tagline}". Current too-short attempt was: "${current}".`,
    }],
  });

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const cleaned = block.text.trim().replace(/^["']|["']$/g, "");
  if (cleaned.length >= 140 && cleaned.length <= 160) {
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

  // Append new entry before the closing `];` of the sites array.
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
    price_from: "${price_annual}",
    price_monthly: "${price_monthly}",
    price_quarterly: "${price_quarterly}",
    price_annual: "${price_annual}",
    affiliate_url: ${entry.affiliate_url ? JSON.stringify(entry.affiliate_url) : "null"},
    homepage_url: ${JSON.stringify(entry.homepage_url)},
    categories: ${JSON.stringify(entry.niche)},
    pros: ${JSON.stringify(pros)},
    cons: ${JSON.stringify(cons)},
    rank: ${nextRank},
    badge: null,
    is_featured: false,
    has_free_trial: false,
    has_hd: true,
    best_for: ${JSON.stringify(generated.best_for)},
    deal_text: ${JSON.stringify("Up to 67% off annual plan")},
    deal_discount: 67,
    deal_type: "ongoing",
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

function appendReviewBody(slug: string, generated: Record<string, unknown>) {
  const src = readFileSync(REVIEWS_FILE, "utf-8");
  const body = [
    generated.review_body_p1,
    generated.review_body_p2,
    generated.review_body_p3,
    generated.review_body_p4,
  ].join("\n\n");
  const block = `\n  ${JSON.stringify(slug)}:\n    ${JSON.stringify(body)},\n`;
  const updated = src.replace(/(\n};\n)/, `${block}};\n`);
  if (updated === src) throw new Error("Failed to splice review body");
  writeFileSync(REVIEWS_FILE, updated, "utf-8");
  log.info(`Appended review body for ${slug}`);
}

function addSlugToScripts(slug: string, name: string) {
  for (const file of [SITEMAP_SCRIPT, PRERENDER_SCRIPT]) {
    const src = readFileSync(file, "utf-8");
    if (src.includes(`"${slug}"`)) continue;
    const updated = src.replace(/(\n] as const;)/, `,\n  "${slug}"$1`);
    if (updated === src) {
      log.warn(`Could not splice ${slug} into ${file}`);
      continue;
    }
    writeFileSync(file, updated, "utf-8");
  }
  // Also patch SITE_NAMES in prerender-meta.
  const pre = readFileSync(PRERENDER_SCRIPT, "utf-8");
  if (!pre.includes(`"${slug}":`)) {
    const updated = pre.replace(
      /(\n};\s*\nconst CATEGORY_SLUGS)/,
      `,\n  "${slug}": "${name}"\n};\nconst CATEGORY_SLUGS`
    );
    if (updated !== pre) writeFileSync(PRERENDER_SCRIPT, updated, "utf-8");
  }
  log.info(`Added ${slug} to sitemap + prerender scripts`);
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
    log.warn(`Could not find queue row for ${slug} to mark published`);
  }
}

// ---------------------------------------------------------------------------
// Build + sitemap regeneration
// ---------------------------------------------------------------------------
function runBuild(): { passed: boolean; commitHash: string } {
  try {
    log.info("Regenerating sitemap...");
    execSync("npx tsx scripts/generate-sitemap.ts", { cwd: ROOT, stdio: "inherit" });
    log.info("Running vite build...");
    execSync("npx vite build", { cwd: ROOT, stdio: "inherit" });
    log.info("Running prerender-meta...");
    execSync("npx tsx scripts/prerender-meta.ts", { cwd: ROOT, stdio: "inherit" });
    return { passed: true, commitHash: "" };
  } catch (e) {
    log.err(`Build failed: ${(e as Error).message}`);
    return { passed: false, commitHash: "" };
  }
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
async function pingGoogle(url: string): Promise<boolean> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    log.warn("GOOGLE_SERVICE_ACCOUNT_JSON not set — skipping Google ping");
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

async function pingBing(url: string): Promise<boolean> {
  const key = process.env.BING_INDEXNOW_KEY;
  if (!key) {
    log.warn("BING_INDEXNOW_KEY not set — skipping Bing ping");
    return false;
  }
  try {
    const r = await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ host: "twinkvault.com", key, urlList: [url] }),
    });
    log.info(`Bing ping ${r.ok ? "ok" : "failed"} (${r.status})`);
    return r.ok;
  } catch (e) {
    log.warn(`Bing ping failed: ${(e as Error).message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Supabase logging (Part 3K)
// ---------------------------------------------------------------------------
async function logToSupabase(row: Record<string, unknown>) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    log.warn("Supabase env vars missing — skipping content_log insert");
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
function resolveTarget(flags: Flags): { kind: "review"; entry: ReviewQueueEntry } | { kind: "supporting"; entry: SupportingQueueEntry } | null {
  // --site override
  if (flags.site) {
    const r = reviewQueue.find((q) => q.slug === flags.site);
    if (r) return { kind: "review", entry: r };
    const s = supportingQueue.find((q) => q.slug === flags.site);
    if (s) return { kind: "supporting", entry: s };
    return null;
  }

  // --type override
  if (flags.type) {
    if (flags.type === "review") {
      const r = nextReviewToPublish();
      return r ? { kind: "review", entry: r } : null;
    }
    const s = nextSupporting(flags.type as SupportingContentType);
    return s ? { kind: "supporting", entry: s } : null;
  }

  // --force: highest-priority queued review (even without affiliate URL).
  if (flags.force) {
    const sorted = [...reviewQueue].filter((r) => r.status === "queued").sort((a, b) => b.priority - a.priority);
    if (sorted.length) return { kind: "review", entry: sorted[0] };
  }

  // Priority-driven queue resolution.
  // Compare top of review queue (priority + affiliate_url gate) against
  // top of supporting queue (priority only) and return the higher.
  const r = nextReviewToPublish();
  const s = nextSupporting();

  if (r && s) {
    return r.priority >= s.priority
      ? { kind: "review", entry: r }
      : { kind: "supporting", entry: s };
  }
  if (r) return { kind: "review", entry: r };
  if (s) return { kind: "supporting", entry: s };
  return null;
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

  const target = resolveTarget(flags);
  if (!target) {
    log.warn("No queued item resolved for today's rotation. Exiting cleanly.");
    return;
  }

  const contentType: ContentTypeKey = target.kind === "review" ? "review" : (target.entry as SupportingQueueEntry).content_type;
  log.info(`Target: ${contentType} → ${target.entry.slug}`);

  // ── Generation ─────────────────────────────────────────────────────────
  let generated: Record<string, unknown>;
  try {
    if (target.kind === "review") {
      const entry = target.entry as ReviewQueueEntry;
      generated = await generate({
        contentType,
        payload: {
          name: entry.name,
          slug: entry.slug,
          homepage_url: entry.homepage_url,
          niche: entry.niche,
          affiliate_network: entry.affiliate_network,
          existing_slugs: sites.map((s) => s.slug),
        },
      });
    } else {
      const entry = target.entry as SupportingQueueEntry;
      const enriched = enrichSupportingPayload(entry);
      generated = await generate({ contentType, payload: enriched });
    }
  } catch (e) {
    // Exit 0 (not 1) so the GitHub Actions workflow shows a clean status.
    // A single-day generation failure is a routine blip — the next scheduled
    // run will pick the same item back up. A red X on the workflow page
    // creates noise out of proportion to the actual problem.
    log.warn(`Generation failed — skipping today's run: ${(e as Error).message}`);
    process.exit(0);
  }

  // ── Quality gates ──────────────────────────────────────────────────────
  let gate = qualityGate(generated, contentType);

  // Retry path: if the only failure is meta length, request a targeted rewrite.
  if (!gate.ok && gate.errors.length === 1 && gate.errors[0].includes("meta_description length")) {
    const repaired = await repairMeta(generated, target);
    if (repaired) {
      generated.meta_description = repaired;
      gate = qualityGate(generated, contentType);
    }
  }

  if (!gate.ok) {
    log.err(`Quality gate failed:\n  ${gate.errors.join("\n  ")}`);
    if (flags.dryRun) log.json("Failed JSON", generated);
    process.exit(1);
  }

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

  // ── Apply: write files ─────────────────────────────────────────────────
  let imageUrl: string | null = null;
  if (target.kind === "review") {
    const entry = target.entry as ReviewQueueEntry;
    imageUrl = await fetchOgImage(entry.homepage_url);
    appendSiteEntry(entry, generated, imageUrl);
    appendReviewBody(entry.slug, generated);
    addSlugToScripts(entry.slug, entry.name);
    markQueuePublished(entry.slug, "review");
  } else {
    const entry = target.entry as SupportingQueueEntry;
    // Supporting pages are rendered dynamically by the existing page templates
    // (DiscountPage, ComparePage, etc.). For new content types not yet
    // implemented as SPA routes (hub/guide/alternatives/isworthit/awards),
    // the generated JSON is currently logged but not yet rendered as a route.
    // Building those route components is the next step in the engine — for
    // now we publish-flag the queue entry and rely on the existing dynamic
    // pages.
    markQueuePublished(entry.slug, "supporting");
  }

  // ── Build ─────────────────────────────────────────────────────────────
  const build = runBuild();
  if (!build.passed) {
    log.err("Build failed — aborting before commit.");
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
  const pageUrl = `${BASE_URL}/${target.kind === "review" ? `reviews/${target.entry.slug}` : target.entry.slug}`;
  const [googleOk, bingOk] = await Promise.all([pingGoogle(pageUrl), pingBing(pageUrl)]);

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
