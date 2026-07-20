import { sites } from "../src/data/sites.js";

/**
 * Shared guts for the AI endpoints (/api/recommend, /api/chat).
 * Files prefixed with _ are not deployed as functions by Vercel.
 */

// Hard content screen — the LEGALITY line, phrased as requests: explicit
// under-18 references, real-world non-consent, covert recording, animals.
// Legal adult-category vocabulary ("teen" 18-19, step-fantasy, roleplay
// themes the catalog carries) is NOT blocked; the model prompt handles
// nuance there.
export const BLOCKED = new RegExp(
  [
    "minor|minors|underage|under.?age|under.?1[0-8]",
    "child|children|preteen|pre.?teen|jail.?bait|loli|shota",
    "\\b(?:1[0-7]|[1-9])\\s?(?:yo|y/o|yr|yrs|year.?old|years.?old)\\b",
    "\\b(?:thirteen|fourteen|fifteen|sixteen|seventeen)\\b",
    "school.?boy|high.?school|middle.?school",
    "rape|non.?consensual|against (?:his|her|their) will|drugged|unconscious|passed.?out|sleep(?:ing)? assault",
    "hidden.?cam|spy.?cam|secret(?:ly)? (?:filmed|recorded)|locker.?room cam",
    "bestiality|zoophil|beast",
  ].join("|"),
  "i"
);

export const RECOMMENDABLE = sites.filter(
  (s) => s.affiliate_url && (s.editorial_status ?? "reviewed") === "reviewed"
);
export const VALID_SLUGS = new Set(RECOMMENDABLE.map((s) => s.slug));
export const DEAL_SLUGS = new Set(RECOMMENDABLE.filter((s) => s.deal_discount > 0).map((s) => s.slug));

export const SITE_CONTEXT = RECOMMENDABLE.map((s) => {
  const bits = [
    `${s.name} (slug: ${s.slug})`,
    `Score ${s.overall_score}/5`,
    `${s.price_monthly}/mo or ${s.price_annual}/mo annual`,
    s.deal_discount > 0 ? `${s.deal_discount}% deal` : "",
    s.has_free_trial ? "has trial" : "",
    s.library_size ?? "",
    s.best_for ? `Best for: ${s.best_for}` : s.short_description,
  ].filter(Boolean);
  return bits.join(". ");
}).join("\n");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export type LLMMessage = { role: "user" | "assistant"; content: string };

/** True if at least one LLM provider is configured. */
export const HAS_LLM_KEY = Boolean(ANTHROPIC_API_KEY || OPENAI_API_KEY);

/**
 * Calls the primary LLM (Anthropic) and transparently falls back to OpenAI
 * when Anthropic is unconfigured, errors (5xx / 429 / overloaded), throws, or
 * returns empty content. Both providers get the same system + messages; OpenAI
 * takes the system prompt as its first message. Returns the text and which
 * provider answered (useful for logging). Throws "all_llm_failed" only if every
 * configured provider fails — callers should map that to a 502.
 */
export async function callLLM(opts: {
  system: string;
  messages: LLMMessage[];
  maxTokens: number;
}): Promise<{ text: string; provider: "anthropic" | "openai" }> {
  const { system, messages, maxTokens } = opts;

  if (ANTHROPIC_API_KEY) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: maxTokens, system, messages }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = (data.content ?? [])
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("")
          .trim();
        if (text) return { text, provider: "anthropic" };
        console.error("Anthropic returned empty content; falling back to OpenAI");
      } else {
        console.error("Anthropic API error:", r.status, (await r.text().catch(() => "")).slice(0, 300));
      }
    } catch (e) {
      console.error("Anthropic request threw; falling back to OpenAI:", e);
    }
  }

  if (OPENAI_API_KEY) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          max_tokens: maxTokens,
          messages: [{ role: "system", content: system }, ...messages],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = String(data.choices?.[0]?.message?.content ?? "").trim();
        if (text) return { text, provider: "openai" };
        console.error("OpenAI returned empty content");
      } else {
        console.error("OpenAI API error:", r.status, (await r.text().catch(() => "")).slice(0, 300));
      }
    } catch (e) {
      console.error("OpenAI request threw:", e);
    }
  }

  throw new Error("all_llm_failed");
}

export function makeRateLimiter(limit: number, windowMs: number) {
  const map = new Map<string, { count: number; resetAt: number }>();
  return (ip: string): boolean => {
    const now = Date.now();
    const entry = map.get(ip);
    if (!entry || now > entry.resetAt) {
      map.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count++;
    return entry.count > limit;
  };
}

/**
 * Server-side link laundering: only whitelisted internal routes with valid
 * slugs survive; anything else (external URLs, hallucinated slugs, weird
 * paths) is stripped to plain text. The model is TOLD the rules, but output
 * is never trusted.
 */
const LINK_OK = (href: string): boolean => {
  const path = href.replace(/^https?:\/\/(www\.)?twinkvault\.com/, "");
  if (["/best-deals", "/top-sites", "/gay-porn-pricing-index", "/gay-porn-awards-2026", "/guides", "/reviews", "/compare"].includes(path)) return true;
  let m = path.match(/^\/reviews\/([a-z0-9-]+)$/);
  if (m) return VALID_SLUGS.has(m[1]);
  m = path.match(/^\/discount\/([a-z0-9-]+)$/);
  if (m) return DEAL_SLUGS.has(m[1]);
  m = path.match(/^\/compare\?sites=([a-z0-9-]+),([a-z0-9-]+)$/);
  if (m) return VALID_SLUGS.has(m[1]) && VALID_SLUGS.has(m[2]);
  return false;
};

export function sanitizeLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
    if (LINK_OK(href)) {
      const path = href.replace(/^https?:\/\/(www\.)?twinkvault\.com/, "");
      return `[${label}](${path})`;
    }
    return label;
  });
}
