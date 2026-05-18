# Content Audit Report — 2026-05-18

## Critical findings

**🚨 401 / 401 routes (100.0%) are `CLIENT_SIDE_ONLY`.** The prerendered HTML for these routes contains only meta tags and an empty `<div id="root"></div>`. Body content (review prose, comparison tables, FAQs, schema markup, internal links — everything below `<head>`) is rendered client-side after JS executes. **Google sees an empty page.**

This is the single largest SEO problem on the site. It explains the GSC pattern of high impressions / low clicks: Google can't read the content the page actually shows to humans, so the page can't rank for queries that would match that content.

**AI review content (`useAIReview.ts` reviewBodies map) status:** AI_CONTENT_CLIENT_ONLY. The static reviewBodies map contains ~300 words of editorial per site for 60+ sites, but the prose is read from sessionStorage after JS executes — it never enters the prerendered HTML.

**Decision point per spec:** Banner integration on review pages is premature until the prerender pipeline is fixed. The page has no indexable content to anchor the banner to.

## Source-side editorial content (invisible to Google today)

The repo contains substantial editorial content in TS data files. None of it currently renders into the prerendered HTML.

| Source | Entries | Total words | Median words/entry |
| --- | ---: | ---: | ---: |
| `src/hooks/useAIReview.ts (reviewBodies map)` | 31 | 9,098 | 275 |
| `src/data/comparison-content.ts` | 7 | 9,971 | 1,424 |
| `src/data/blog-posts.ts` | 10 | 8,418 | 841 |
| `src/data/alternatives-content.ts` | 4 | 3,856 | 964 |

- **src/hooks/useAIReview.ts (reviewBodies map)** — Static review prose, ~3–4 paragraphs per site. Loaded into sessionStorage on first visit. NEVER appears in prerendered HTML (root div is empty until JS runs).
- **src/data/comparison-content.ts** — Per-pair compare content (likely BLUF + reasoning). Same prerender problem — body never enters static HTML.
- **src/data/blog-posts.ts** — Editorial blog content. Same prerender problem.
- **src/data/alternatives-content.ts** — Per-site alternatives content. Same prerender problem.

## Summary by page type

| Page type | Count | Median body words (prerendered) | Min | Max | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| compare | 188 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| discount | 62 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| review | 62 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| landing | 24 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| niche | 21 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| other | 16 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| blog | 10 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| legal | 6 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| category | 6 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| utility | 5 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |
| homepage | 1 | 0 | 0 | 0 | **CRITICAL_CLIENT_ONLY** |

## Flag breakdown across all routes

| Flag | Count |
| --- | ---: |
| CLIENT_SIDE_ONLY | 401 |
| THIN_DESC | 120 |
| LONG_TITLE | 114 |
| MISSING_REVIEW_SCHEMA | 62 |
| THIN_TITLE | 10 |

## Compare page deep-dive

- **Page count:** 188
- **Template source:** `src/pages/ComparePage.tsx` (runtime React component, hydrated client-side).
- **Per-pair content source:** `src/data/comparison-content.ts` (~9,971 words across all pairs combined, never prerendered).
- **All 188 compare pages render as CLIENT_SIDE_ONLY** — Google sees identical 3.7KB meta-only HTML for each pair.
- **Kill-list recommendation:** until prerendering is fixed, the kill-list question is moot. Once Google can see content, then evaluate pairs by (a) neither site in top-10, (b) <5 GSC impressions/30d.

## Review page deep-dive

- **Page count:** 62
- **AI content rendering:** `AI_CONTENT_CLIENT_ONLY`. Static reviewBodies map exists with ~275 median words per site, but the prose only mounts into the DOM after `useAIReview` runs client-side.
- **Prerendered body word counts:** every review page is in the 0–0 word range (NoScript + page chrome only).

## Worst-offender routes (smallest prerendered body)

Sorted ascending by body word count. Top 30:

| Route | Type | Body words | File size (KB) | Flags |
| --- | --- | ---: | ---: | --- |
| /2257 | legal | 0 | 3.4 | CLIENT_SIDE_ONLY, THIN_DESC |
| /about | legal | 0 | 3.5 | CLIENT_SIDE_ONLY, THIN_TITLE, THIN_DESC |
| /affiliate-disclosure | legal | 0 | 3.4 | CLIENT_SIDE_ONLY, THIN_TITLE, THIN_DESC |
| /ask-ai | utility | 0 | 3.5 | CLIENT_SIDE_ONLY, THIN_DESC |
| /best-amateur-gay-sites | landing | 0 | 3.7 | CLIENT_SIDE_ONLY, THIN_DESC |
| /best-asian-gay-sites | landing | 0 | 3.6 | CLIENT_SIDE_ONLY, THIN_DESC |
| /best-bareback-gay-sites | landing | 0 | 3.6 | CLIENT_SIDE_ONLY, THIN_DESC |
| /best-bareback-twink-sites | landing | 0 | 3.8 | CLIENT_SIDE_ONLY |
| /best-cheap-gay-porn-sites | landing | 0 | 3.8 | CLIENT_SIDE_ONLY |
| /best-daddy-twink-sites | landing | 0 | 3.7 | CLIENT_SIDE_ONLY |
| /best-deals | landing | 0 | 3.6 | CLIENT_SIDE_ONLY, THIN_DESC |
| /best-gay-porn-sites | landing | 0 | 3.7 | CLIENT_SIDE_ONLY |
| /best-gay-porn-subscription | landing | 0 | 3.8 | CLIENT_SIDE_ONLY |
| /best-gay-sites-for-beginners | landing | 0 | 3.7 | CLIENT_SIDE_ONLY |
| /best-gay-sites-under-10 | landing | 0 | 3.7 | CLIENT_SIDE_ONLY |
| /best-gay-sites-with-downloads | landing | 0 | 3.6 | CLIENT_SIDE_ONLY, THIN_DESC |
| /best-gay-twink-sites-2026 | landing | 0 | 3.6 | CLIENT_SIDE_ONLY, THIN_DESC |
| /best-premium-gay-sites | landing | 0 | 3.7 | CLIENT_SIDE_ONLY |
| /best-twink-porn-sites | landing | 0 | 3.7 | CLIENT_SIDE_ONLY |
| /best-twink-porn-sites-with-free-trials | landing | 0 | 3.8 | CLIENT_SIDE_ONLY |
| /best-twink-sites | landing | 0 | 3.6 | CLIENT_SIDE_ONLY, THIN_DESC |
| /best-value-gay-porn-sites | landing | 0 | 3.8 | CLIENT_SIDE_ONLY |
| /blog/bareback-vs-condom-gay-porn | blog | 0 | 3.8 | CLIENT_SIDE_ONLY, LONG_TITLE |
| /blog/best-gay-porn-sites-2026-top-10 | blog | 0 | 3.9 | CLIENT_SIDE_ONLY, LONG_TITLE |
| /blog/category/comparisons | blog | 0 | 3.5 | CLIENT_SIDE_ONLY, THIN_TITLE, THIN_DESC |
| /blog/category/guides | blog | 0 | 3.5 | CLIENT_SIDE_ONLY, THIN_TITLE, THIN_DESC |
| /blog/category/industry | blog | 0 | 3.6 | CLIENT_SIDE_ONLY, THIN_TITLE, THIN_DESC |
| /blog/category/money | blog | 0 | 3.6 | CLIENT_SIDE_ONLY, THIN_TITLE, THIN_DESC |
| /blog/gay-porn-free-trials-explained | blog | 0 | 3.9 | CLIENT_SIDE_ONLY, LONG_TITLE, THIN_DESC |
| /blog/how-much-to-pay-for-gay-porn-subscription | blog | 0 | 3.9 | CLIENT_SIDE_ONLY, LONG_TITLE, THIN_DESC |

## Auto-generation pipeline assessment

Scripts present:

- `scripts/generate-daily-content.ts` — daily content generator (need source inspection to assess).
- `scripts/generate-comparison-pages.ts` — comparison page generator.
- Generated output lands in `src/data/comparison-content.ts`, `alternatives-content.ts`, etc.

**Quality assessment is blocked by the prerender problem:** even if these scripts produce excellent content, none of it is visible to Google today. Fixing prerendering must come before evaluating prompt/output quality.

## Recommended fix order

1. **Prerender React components to HTML at build time.** Replace the current "meta-only" prerender step with a true SSR/SSG pass (`react-dom/server.renderToString` per route, or migrate to a framework with built-in SSG like Astro/Next). This single change moves ~60,000 words of existing editorial into the indexable HTML and is the highest-leverage SEO fix available.
2. **Move `useAIReview` content into the prerendered HTML.** Once SSG is in place, render the `reviewBodies` map directly in the React tree instead of reading from sessionStorage. Drops the client roundtrip and gives Google the prose.
3. **Inline the `comparison-content.ts` entries into ComparePage.tsx render tree** (or generate per-pair HTML files at build time).
4. **Audit content depth AFTER prerendering is in place.** Real "thin content" measurement is only meaningful once the prerendered HTML reflects what humans see. Re-run this audit and use the type-level thresholds to drive a content-improvement sprint.
5. **Kill-list pruning** of low-impression compare pages — defer until SSG ships and GSC data has 30+ days to reflect the new indexable content.
