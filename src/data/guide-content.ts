/**
 * AI-generated long-form guide body content, keyed by guide slug
 * (e.g. "guide/how-to-cancel-gay-porn-subscriptions"). Written by the
 * daily content engine.
 *
 * Guide route components don't exist yet — this file just collects
 * the content as it generates. When the route shell is built, it'll
 * read from here.
 *
 * Schema mirrors the JSON returned by guidePrompt() in
 * generate-daily-content.ts.
 */

export interface GuideSection {
  h2: string;
  content: string;
}

export interface GuideBody {
  h1: string;
  intro: string;
  sections: GuideSection[];
  conclusion: string;
  meta_description: string;
  faq: { q: string; a: string }[];
}

export const GUIDE_CONTENT: Record<string, GuideBody> = {};

export const getGuideBody = (slug: string): GuideBody | undefined =>
  GUIDE_CONTENT[slug];
