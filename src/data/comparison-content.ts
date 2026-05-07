/**
 * AI-generated comparison body content, written by
 * scripts/generate-daily-content.ts after Claude generates and quality
 * gates pass. Keyed by comparison slug (e.g. "men-vs-sean-cody").
 *
 * ComparePage.tsx reads from this map; falls back to the generic
 * deterministic template when no entry exists.
 *
 * Schema mirrors the JSON returned by comparisonPrompt() in
 * generate-daily-content.ts.
 */

export interface ComparisonCategoryRow {
  category: string;
  site_a_score: number;
  site_b_score: number;
  site_a_detail: string;
  site_b_detail: string;
}

export interface ComparisonBody {
  site_a_slug: string;
  site_b_slug: string;
  h1: string;
  intro: string;
  site_a_summary: string;
  site_b_summary: string;
  comparison_categories: ComparisonCategoryRow[];
  verdict: string;
  who_should_choose_a: string;
  who_should_choose_b: string;
  faq: { q: string; a: string }[];
  meta_description: string;
}

export const COMPARISON_CONTENT: Record<string, ComparisonBody> = {};

export const getComparisonBody = (slug: string): ComparisonBody | undefined =>
  COMPARISON_CONTENT[slug];
