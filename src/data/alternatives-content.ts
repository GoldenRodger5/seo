/**
 * AI-generated alternatives body content, keyed by the alternatives page
 * slug (e.g. "helix-studios-alternatives"). Written by the daily content
 * engine; read by the alternatives route components.
 *
 * Schema mirrors the JSON returned by alternativesPrompt() in
 * generate-daily-content.ts.
 */

export interface AlternativeEntry {
  slug: string;
  reason: string;
}

export interface AlternativesBody {
  h1: string;
  intro: string;
  alternatives: AlternativeEntry[];
  verdict: string;
  meta_description: string;
  faq: { q: string; a: string }[];
}

export const ALTERNATIVES_CONTENT: Record<string, AlternativesBody> = {};

export const getAlternativesBody = (slug: string): AlternativesBody | undefined =>
  ALTERNATIVES_CONTENT[slug];
