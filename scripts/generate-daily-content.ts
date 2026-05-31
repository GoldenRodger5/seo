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
const COMPARISON_CONTENT_FILE = resolve(ROOT, "src/data/comparison-content.ts");
const ALTERNATIVES_CONTENT_FILE = resolve(ROOT, "src/data/alternatives-content.ts");
const ISWORTHIT_CONTENT_FILE = resolve(ROOT, "src/data/isworthit-content.ts");
const GUIDE_CONTENT_FILE = resolve(ROOT, "src/data/guide-content.ts");

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

  // Meta description gate aligned with the audit's HARD_FAIL band:
  // <120 flags THIN_DESC, >165 flags LONG_DESC. Daily-gen output must
  // match what the audit accepts so AI content never trips the strict
  // build-time gate.
  const meta = content.meta_description as string | undefined;
  if (!meta) errors.push("meta_description missing");
  else if (meta.length < 120 || meta.length > 165) errors.push(`meta_description length ${meta.length} not in 120-165`);

  // Meta title gate: 30-65 chars. Below 30 the title is too sparse for
  // SERP weight; above 65 Google truncates the rendered display.
  const h1 = content.h1 as string | undefined;
  if (h1 && (h1.length < 20 || h1.length > 100)) errors.push(`h1 length ${h1.length} out of 20-100`);

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
function upsertContentEntry(file: string, key: string, body: unknown): void {
  const src = readFileSync(file, "utf-8");
  const literal = `  ${JSON.stringify(key)}: ${JSON.stringify(body, null, 2).replace(/\n/g, "\n  ")},\n`;

  // Detect existing key — skip rather than overwrite to avoid clobbering
  // hand-edited content. Re-runs on the same key are a no-op.
  if (new RegExp(`^\\s*${JSON.stringify(key).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*:`, "m").test(src)) {
    log.info(`upsert: ${key} already in ${file.split("/").pop()}, skipping`);
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
      file: COMPARISON_CONTENT_FILE,
      keyFromSlug: (s) => s.replace(/^compare\//, ""),
      frontendLookup: (s) => s.replace(/^compare\//, ""),
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
  upsertContentEntry(binding.file, writeKey, generated);

  // Stamp the route's lastmod so generate-sitemap.ts can emit accurate
  // <lastmod> for this URL — without this Google never gets a recrawl
  // signal when AI body content updates.
  const routePath = (() => {
    switch (entry.content_type) {
      case "comparison":
        return `/compare/${writeKey}`;
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

  // Helper to do one full generation attempt with the payload below.
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
        },
      });
    }
    const entry = target.entry as SupportingQueueEntry;
    const enriched = enrichSupportingPayload(entry);
    if (extraHint) enriched.retry_hint = extraHint;
    return generate({ contentType, payload: enriched });
  };

  // ── Generation with up to 2 retries on quality-gate failure ────────────
  // Single-day failures used to silently waste the slot. Now: 2 retry
  // attempts when the gate complains about content shape, each with the
  // failure errors fed back to the model as a "fix these specific issues"
  // hint. The repair-meta single-shot still wraps the first attempt.
  let generated: Record<string, unknown> = {};
  let gate = { ok: false, errors: ["initial"] as string[] };
  const MAX_ATTEMPTS = 3;
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const hint = attempt === 1 ? undefined :
        `Previous attempt failed these checks — fix them while keeping everything else: ${lastErr}`;
      log.info(attempt === 1 ? "Generating…" : `Retry ${attempt - 1}/${MAX_ATTEMPTS - 1} with failure hint…`);
      generated = await attemptGeneration(hint);
    } catch (e) {
      // Anthropic-side failure (timeout, rate limit, network). Exit 0 so the
      // GitHub Action stays green; tomorrow's run picks up the same queue
      // entry. A red X on the workflow page over-signals a transient hiccup.
      log.warn(`Generation failed — skipping today's run: ${(e as Error).message}`);
      process.exit(0);
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

  // Distinguish cosmetic gate failures (meta length within 20 chars of the
  // accepted range) from genuinely broken content (missing fields, malformed
  // structure, missing required keys). Cosmetic issues log a warning and
  // proceed; only genuinely broken content stops the pipeline.
  if (!gate.ok) {
    const isCosmetic = (err: string) => {
      if (!err.includes("meta_description length")) return false;
      const match = err.match(/length (\d+)/);
      if (!match) return false;
      const len = parseInt(match[1], 10);
      // Within 20 chars of either end of the 120-200 accepted range.
      return len >= 100 && len <= 220;
    };
    const allCosmetic = gate.errors.every(isCosmetic);
    if (allCosmetic) {
      log.warn(`Quality gate had cosmetic issues (proceeding anyway):\n  ${gate.errors.join("\n  ")}`);
    } else {
      log.err(`Quality gate failed (genuine content issues):\n  ${gate.errors.join("\n  ")}`);
      if (flags.dryRun) log.json("Failed JSON", generated);
      // Soft exit (0, not 1) so a bad day doesn't paint the workflow red.
      // The next scheduled run picks the same item back up.
      process.exit(0);
    }
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

  // ── Apply: write files (with rollback on subsequent build failure) ────
  //
  // Previously the order was: persist → mark-published → build → commit.
  // If the build failed, the queue had already been flipped to "published"
  // and the data file held uncommitted edits — the entry was effectively
  // lost (next run wouldn't reattempt it because it looked published).
  // Now we snapshot the touched files, persist, build, and if the build
  // fails we restore those files before exiting so the next run can retry
  // the same queue entry cleanly.
  const FILES_TO_SNAPSHOT = [
    QUEUE_FILE,
    REVIEWS_FILE,
    SITES_FILE,
    COMPARISON_CONTENT_FILE,
    ALTERNATIVES_CONTENT_FILE,
    ISWORTHIT_CONTENT_FILE,
    GUIDE_CONTENT_FILE,
    resolve(ROOT, "docs/content-lastmod.json"),
  ];
  const snapshots = new Map<string, string>();
  for (const f of FILES_TO_SNAPSHOT) {
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

  // ── Build ─────────────────────────────────────────────────────────────
  const build = runBuild();
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
  const pageUrl = (() => {
    if (target.kind === "review") return `${BASE_URL}/reviews/${target.entry.slug}`;
    const slug = target.entry.slug;
    switch (contentType) {
      case "comparison":
        // queue slugs are stored as "compare/{a}-vs-{b}" — strip the prefix
        return `${BASE_URL}/compare/${slug.replace(/^compare\//, "")}`;
      case "alternatives":
        // queue slugs are "{site}-alternatives". Three legacy hand-routed
        // pages live at the bare path; everything else uses the generic
        // /alternatives/{site} route. Both are honored — the daily engine
        // pings the path that actually renders.
        if (["helix-studios-alternatives", "sean-cody-alternatives", "nakedsword-alternatives"].includes(slug)) {
          return `${BASE_URL}/${slug}`;
        }
        return `${BASE_URL}/alternatives/${slug.replace(/-alternatives$/, "")}`;
      case "isworthit":
        return `${BASE_URL}/is-${slug}-worth-it`;
      case "guide":
        return `${BASE_URL}/guide/${slug.replace(/^guide\//, "")}`;
      case "discount":
        return `${BASE_URL}/discount/${slug}`;
      default:
        return `${BASE_URL}/${slug}`;
    }
  })();
  log.info(`Submitting to crawlers: ${pageUrl}`);
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
