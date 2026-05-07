/**
 * AI-generated "is X worth it" body content, keyed by site slug
 * (e.g. "nakedsword"). Written by the daily content engine; read by
 * WorthItPage.tsx.
 *
 * The isworthit prompt currently routes through guidePrompt() in
 * generate-daily-content.ts, so the JSON shape matches the guide schema:
 * h1, intro, sections, conclusion, meta_description, faq.
 */

export interface WorthItSection {
  h2: string;
  content: string;
}

export interface WorthItBody {
  h1: string;
  intro: string;
  sections: WorthItSection[];
  conclusion: string;
  meta_description: string;
  faq: { q: string; a: string }[];
}

export const ISWORTHIT_CONTENT: Record<string, WorthItBody> = {};

export const getWorthItBody = (slug: string): WorthItBody | undefined =>
  ISWORTHIT_CONTENT[slug];
