import { useState, useEffect } from "react";
import { SiteData } from "../data/sites";

const CACHE_KEY = (slug: string) => `tv_ai_review_${slug}`;

export function useAIReview(site: SiteData) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check cache first
    const cached = sessionStorage.getItem(CACHE_KEY(site.slug));
    if (cached) {
      setContent(cached);
      return;
    }

    setLoading(true);

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You write honest, conversational reviews for TwinkVault, a gay twink content site review platform. 
Write like a knowledgeable friend who has actually used the site — direct, specific, no fluff. 
Never use clichés like "look no further" or "in conclusion". 
Target keyword naturally: "${site.name.toLowerCase()} review".
Output plain text only — no markdown, no headers, no bullet points. Just 3 paragraphs.`,
        messages: [{
          role: "user",
          content: `Write a 3-paragraph review body for ${site.name}.

Site facts:
- Overall score: ${site.overall_score}/5
- Content Quality: ${site.content_quality}/100
- Value for Money: ${site.value_score}/100  
- Update Frequency: ${site.update_frequency}/100
- Mobile Experience: ${site.mobile_score}/100
- Monthly price: ${site.price_monthly}
- Annual price: ${site.price_annual}/mo
- Free trial: ${site.has_free_trial}
- Categories: ${site.categories.join(", ")}
- Pros: ${site.pros.join(", ")}
- Cons: ${site.cons.join(", ")}
- Description: ${site.description}

Paragraph 1: Content quality and what makes this site unique (mention the content_quality score context).
Paragraph 2: Site usability, mobile experience, and how often it updates.
Paragraph 3: Value assessment — is the price worth it given what you get? Who should subscribe?`
        }]
      })
    })
      .then(r => r.json())
      .then(data => {
        const text = data.content?.[0]?.text || "";
        sessionStorage.setItem(CACHE_KEY(site.slug), text);
        setContent(text);
      })
      .catch(() => setContent(""))
      .finally(() => setLoading(false));
  }, [site.slug]);

  return { content, loading };
}
