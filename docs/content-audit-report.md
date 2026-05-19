# Content Audit Report — 2026-05-19

## Critical findings

**🚨 0 / 401 routes (0.0%) are `CLIENT_SIDE_ONLY`.** The prerendered HTML for these routes contains only meta tags and an empty `<div id="root"></div>`. Body content (review prose, comparison tables, FAQs, schema markup, internal links — everything below `<head>`) is rendered client-side after JS executes. **Google sees an empty page.**

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
| `src/data/alternatives-content.ts` | 5 | 4,713 | 942 |

- **src/hooks/useAIReview.ts (reviewBodies map)** — Static review prose, ~3–4 paragraphs per site. Loaded into sessionStorage on first visit. NEVER appears in prerendered HTML (root div is empty until JS runs).
- **src/data/comparison-content.ts** — Per-pair compare content (likely BLUF + reasoning). Same prerender problem — body never enters static HTML.
- **src/data/blog-posts.ts** — Editorial blog content. Same prerender problem.
- **src/data/alternatives-content.ts** — Per-site alternatives content. Same prerender problem.

## Summary by page type

| Page type | Count | Median body words (prerendered) | Min | Max | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| compare | 188 | 628 | 557 | 1957 | HEALTHY |
| discount | 62 | 763 | 698 | 813 | HEALTHY |
| review | 62 | 1086 | 887 | 1309 | HEALTHY |
| landing | 24 | 1167 | 413 | 4240 | HEALTHY |
| niche | 21 | 640 | 486 | 2073 | HEALTHY |
| other | 16 | 445 | 380 | 882 | HEALTHY |
| blog | 10 | 1499 | 226 | 1826 | HEALTHY |
| legal | 6 | 759 | 358 | 1003 | HEALTHY |
| category | 6 | 1112 | 389 | 1917 | HEALTHY |
| utility | 5 | 273 | 231 | 9709 | HEALTHY |
| homepage | 1 | 702 | 702 | 702 | HEALTHY |

## Flag breakdown across all routes

| Flag | Count |
| --- | ---: |
| THIN_DESC | 121 |
| LONG_TITLE | 114 |
| MISSING_REVIEW_SCHEMA | 62 |
| THIN_TITLE | 10 |
| THIN_BLOG | 4 |
| THIN_LANDING | 1 |

## Compare page deep-dive

- **Page count:** 188
- **Template source:** `src/pages/ComparePage.tsx` (runtime React component, hydrated client-side).
- **Per-pair content source:** `src/data/comparison-content.ts` (~9,971 words across all pairs combined, never prerendered).
- **All 188 compare pages render as CLIENT_SIDE_ONLY** — Google sees identical 3.7KB meta-only HTML for each pair.
- **Kill-list recommendation:** until prerendering is fixed, the kill-list question is moot. Once Google can see content, then evaluate pairs by (a) neither site in top-10, (b) <5 GSC impressions/30d.

## Review page deep-dive

- **Page count:** 62
- **AI content rendering:** `AI_CONTENT_CLIENT_ONLY`. Static reviewBodies map exists with ~275 median words per site, but the prose only mounts into the DOM after `useAIReview` runs client-side.
- **Prerendered body word counts:** every review page is in the 887–1309 word range (NoScript + page chrome only).

## Worst-offender routes (smallest prerendered body)

Sorted ascending by body word count. Top 30:

| Route | Type | Body words | File size (KB) | Flags |
| --- | --- | ---: | ---: | --- |
| /blog/category/industry | blog | 226 | 17.9 | THIN_BLOG, THIN_TITLE, THIN_DESC |
| /find-my-site | utility | 231 | 18.3 | THIN_DESC |
| /contact | utility | 254 | 20.6 | THIN_TITLE, THIN_DESC |
| /blog/category/money | blog | 270 | 19.8 | THIN_BLOG, THIN_TITLE, THIN_DESC |
| /ask-ai | utility | 273 | 21.3 | THIN_DESC |
| /blog/category/comparisons | blog | 301 | 21.4 | THIN_BLOG, THIN_TITLE, THIN_DESC |
| /2257 | legal | 358 | 18.5 | THIN_DESC |
| /affiliate-disclosure | legal | 366 | 18.5 | THIN_TITLE, THIN_DESC |
| /blog/category/guides | blog | 367 | 23.2 | THIN_BLOG, THIN_TITLE, THIN_DESC |
| /is-athletic-twinks-worth-it | other | 380 | 31.0 | THIN_DESC |
| /is-twinks-in-shorts-worth-it | other | 384 | 31.1 | THIN_DESC |
| /category/free-trials | category | 389 | 38.5 | THIN_DESC |
| /is-nakedsword-worth-it | other | 389 | 31.4 | THIN_DESC |
| /is-southern-strokes-worth-it | other | 390 | 31.1 | THIN_DESC |
| /is-rawhole-worth-it | other | 393 | 31.4 | THIN_DESC |
| /is-peterfever-worth-it | other | 395 | 31.4 | THIN_DESC |
| /compare | landing | 413 | 31.2 | THIN_LANDING, THIN_DESC |
| /is-sayuncle-worth-it | other | 422 | 31.5 | THIN_DESC |
| /is-men-worth-it | other | 438 | 31.8 | THIN_DESC |
| /is-sean-cody-worth-it | other | 445 | 31.9 | THIN_DESC |
| /is-helix-studios-worth-it | other | 470 | 32.6 | THIN_DESC |
| /niche/military | niche | 486 | 28.6 |  |
| /niche/latin | niche | 495 | 28.5 |  |
| /niche/big-dick | niche | 508 | 28.5 |  |
| /blog | landing | 512 | 29.2 |  |
| /niche/uncut | niche | 529 | 32.1 | THIN_DESC |
| /niche/solo | niche | 530 | 32.3 | THIN_DESC |
| /gay-porn-sites-ranked | other | 531 | 113.5 | LONG_TITLE, THIN_DESC |
| /category/mobile-friendly | category | 550 | 62.5 | THIN_DESC |
| /compare/bigstr-vs-dirtyboyvideo | compare | 557 | 46.9 |  |

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
