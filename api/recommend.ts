import type { VercelRequest, VercelResponse } from "@vercel/node";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Simple in-memory rate limiter (resets on cold start, which is fine for serverless)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Site data embedded here so the serverless function is self-contained
const SITE_CONTEXT = `Helix Studios (slug: helix-studios): Score 4.8/5. Premium cinematic twink content since 2002. 4,000+ scenes, exclusive performers, Las Vegas. Categories: premium-studios, hd-quality, mobile-friendly. Price: $34.95/mo or $11.99/mo annual. Pros: 4,000+ exclusive scenes, cinematic production, exclusive performers. Cons: Higher price, older content in 480p.
Next Door Twink (slug: next-door-twink): Score 4.6/5. ASGmax network, 12,500+ videos across 45+ channels. Categories: amateur-twinks, best-value, mobile-friendly. Price: $24.95/mo or $10.95/mo annual. $2.95 three-day trial. Pros: 45+ channels, 720p-4K, weekly updates. Cons: Not all content is twink-focused.
Next Door World (slug: next-door-world): Score 4.5/5. Full ASGmax network — 45+ channels, 12,500+ videos. Categories: best-value, hd-quality, premium-studios, mobile-friendly. Price: $24.95/mo or $10.95/mo annual. $2.95 three-day trial. Pros: 45+ channels for one price, 720p-4K. Cons: Not exclusively twink-focused.
Twinks in Shorts (slug: twinks-in-shorts): Score 4.4/5. Authentic amateur content, unscripted scenes. Categories: amateur-twinks, best-value, mobile-friendly. Price: $29.95/mo or $9.95/mo annual. Pros: Authentic amateur feel, affordable. Cons: Lower production than premium studios.
Athletic Twinks (slug: athletic-twinks): Score 4.3/5. Fit sporty performers, high-energy scenes. Categories: amateur-twinks, hd-quality. Price: $29.95/mo or $9.95/mo annual. Pros: Unique athletic niche, HD. Cons: Narrow niche, smaller library.
Southern Strokes (slug: southern-strokes): Score 4.1/5. All-American Southern charm, great value. Categories: amateur-twinks, best-value. Price: $29.95/mo or $9.95/mo annual. Pros: Great value, natural performers. Cons: Production quality varies.
Daddy on Twink (slug: daddy-on-twink): Score 4.1/5. Intergenerational content with strong chemistry. Categories: premium-studios. Price: $29.95/mo or $9.95/mo annual. Pros: Unique niche, strong chemistry. Cons: Niche not for everyone.
Touch That Boy (slug: touch-that-boy): Score 4.0/5. Sensual intimate content, genuine connection. Categories: amateur-twinks, premium-studios. Price: $29.95/mo or $9.95/mo annual. Pros: Intimate scenes, strong chemistry. Cons: Slower update schedule.
Breed Me Raw (slug: breed-me-raw): Score 3.9/5. Raw unfiltered bareback content. Categories: amateur-twinks. Price: $29.95/mo or $9.95/mo annual. Pros: Authentic raw content, passionate performers. Cons: Very niche, basic design.
Hard Brit Lads (slug: hard-brit-lads): Score 3.9/5. Leading British site, exclusively UK performers. Categories: amateur-twinks, hd-quality. Price: $29.95/mo or $9.95/mo annual. Pros: Exclusive UK performers, unique niche. Cons: Geographic niche appeal.
Bareback That Hole (slug: bareback-that-hole): Score 3.8/5. High-intensity raw scenes. Categories: amateur-twinks. Price: $29.95/mo or $9.95/mo annual. Pros: Raw authentic scenes, affordable. Cons: Very specific niche.
Prideflame (slug: prideflame): Score 3.7/5. Diverse inclusive content, Latino and mixed performers. Categories: amateur-twinks, best-value. Price: $29.95/mo or $9.95/mo annual. Pros: Diverse roster, affordable. Cons: Smaller library, less frequent updates.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://twinkvault.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit by IP
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in a minute." });
  }

  const { query } = req.body || {};
  if (!query || typeof query !== "string" || query.length > 500) {
    return res.status(400).json({ error: "Invalid query" });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: `You are TwinkVault's recommendation engine. A user will describe what they want from a gay twink content site. Recommend the top 2-3 best matches from our database.

Available sites:
${SITE_CONTEXT}

Respond ONLY with valid JSON:
{"recommendations":[{"slug":"site-slug","match":"95% match","reason":"One sentence why."}]}

Rules:
- 2-3 recommendations max, use exact slugs
- Keep reasons concise and reference the user's words
- Order by best match first`,
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", response.status, err);
      return res.status(502).json({ error: "AI service error" });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Recommend error:", err);
    return res.status(500).json({ error: "Failed to get recommendation" });
  }
}
