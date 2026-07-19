# Content Audit Report — 2026-07-19

## Critical findings

**🚨 0 / 291 routes (0.0%) are `CLIENT_SIDE_ONLY`.** The prerendered HTML for these routes contains only meta tags and an empty `<div id="root"></div>`. Body content (review prose, comparison tables, FAQs, schema markup, internal links — everything below `<head>`) is rendered client-side after JS executes. **Google sees an empty page.**

This is the single largest SEO problem on the site. It explains the GSC pattern of high impressions / low clicks: Google can't read the content the page actually shows to humans, so the page can't rank for queries that would match that content.

**AI review content (`useAIReview.ts` reviewBodies map) status:** AI_CONTENT_CLIENT_ONLY. The static reviewBodies map contains ~300 words of editorial per site for 60+ sites, but the prose is read from sessionStorage after JS executes — it never enters the prerendered HTML.

**Decision point per spec:** Banner integration on review pages is premature until the prerender pipeline is fixed. The page has no indexable content to anchor the banner to.

## Source-side editorial content (invisible to Google today)

The repo contains substantial editorial content in TS data files. None of it currently renders into the prerendered HTML.

| Source | Entries | Total words | Median words/entry |
| --- | ---: | ---: | ---: |
| `src/hooks/useAIReview.ts (reviewBodies map)` | 31 | 9,115 | 277 |
| `src/data/comparison-content.ts` | 9 | 13,153 | 1,461 |
| `src/data/blog-posts.ts` | 10 | 8,395 | 839 |
| `src/data/alternatives-content.ts` | 7 | 6,456 | 922 |

- **src/hooks/useAIReview.ts (reviewBodies map)** — Static review prose, ~3–4 paragraphs per site. Loaded into sessionStorage on first visit. NEVER appears in prerendered HTML (root div is empty until JS runs).
- **src/data/comparison-content.ts** — Per-pair compare content (likely BLUF + reasoning). Same prerender problem — body never enters static HTML.
- **src/data/blog-posts.ts** — Editorial blog content. Same prerender problem.
- **src/data/alternatives-content.ts** — Per-site alternatives content. Same prerender problem.

## Summary by page type

| Page type | Count | Median body words (prerendered) | Min | Max | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| discount | 71 | 894 | 828 | 947 | HEALTHY |
| review | 71 | 1176 | 977 | 1940 | HEALTHY |
| compare | 44 | 737 | 625 | 2215 | HEALTHY |
| landing | 28 | 996 | 260 | 6092 | HEALTHY |
| niche | 21 | 782 | 521 | 2770 | HEALTHY |
| other | 20 | 1950 | 427 | 2513 | HEALTHY |
| guide | 8 | 2378 | 2161 | 2587 | HEALTHY |
| legal | 6 | 793 | 392 | 1037 | HEALTHY |
| blog | 6 | 1721 | 1522 | 1874 | HEALTHY |
| category | 6 | 1517 | 461 | 2568 | HEALTHY |
| utility | 5 | 336 | 265 | 12785 | HEALTHY |
| alternatives | 4 | 915 | 888 | 941 | HEALTHY |
| homepage | 1 | 881 | 881 | 881 | HEALTHY |

## Flag breakdown across all routes

| Flag | Count |
| --- | ---: |
| WORD_COUNT_LOW | 14 |
| THIN_LANDING | 5 |

## Compare page deep-dive

- **Page count:** 44
- **Template source:** `src/pages/ComparePage.tsx` (runtime React component, hydrated client-side).
- **Per-pair content source:** `src/data/comparison-content.ts` (~13,153 words across all pairs combined, never prerendered).
- **All 44 compare pages render as CLIENT_SIDE_ONLY** — Google sees identical 3.7KB meta-only HTML for each pair.
- **Kill-list recommendation:** until prerendering is fixed, the kill-list question is moot. Once Google can see content, then evaluate pairs by (a) neither site in top-10, (b) <5 GSC impressions/30d.

## Review page deep-dive

- **Page count:** 71
- **AI content rendering:** `AI_CONTENT_CLIENT_ONLY`. Static reviewBodies map exists with ~277 median words per site, but the prose only mounts into the DOM after `useAIReview` runs client-side.
- **Prerendered body word counts:** every review page is in the 977–1940 word range (NoScript + page chrome only).

## Worst-offender routes (smallest prerendered body)

Sorted ascending by body word count. Top 30:

| Route | Type | Body words | File size (KB) | Flags |
| --- | --- | ---: | ---: | --- |
| /blog/category/industry | landing | 260 | 19.7 | THIN_LANDING |
| /find-my-site | utility | 265 | 19.4 |  |
| /contact | utility | 288 | 21.8 |  |
| /ask-ai | utility | 336 | 20.6 |  |
| /blog/category/money | landing | 365 | 22.3 | THIN_LANDING |
| /blog/category/comparisons | landing | 387 | 24.1 | THIN_LANDING |
| /2257 | legal | 392 | 19.7 |  |
| /affiliate-disclosure | legal | 400 | 19.7 |  |
| /is-rawhole-worth-it | other | 427 | 32.3 |  |
| /compare | landing | 447 | 32.2 | THIN_LANDING |
| /is-sayuncle-worth-it | other | 456 | 32.5 |  |
| /category/free-trials | category | 461 | 34.0 | WORD_COUNT_LOW |
| /blog/category/guides | landing | 466 | 26.0 | THIN_LANDING |
| /niche/military | niche | 521 | 31.9 | WORD_COUNT_LOW |
| /blog | landing | 523 | 32.2 |  |
| /niche/latin | niche | 530 | 31.9 | WORD_COUNT_LOW |
| /niche/big-dick | niche | 543 | 31.9 | WORD_COUNT_LOW |
| /gay-porn-sites-ranked | other | 602 | 127.5 |  |
| /free-trial-twink-sites | landing | 607 | 45.0 |  |
| /compare/dudesraw-vs-trailertrashboys | compare | 625 | 55.5 |  |
| /compare/japanboyz-vs-peterfever | compare | 629 | 55.2 |  |
| /best-asian-gay-sites | landing | 643 | 67.6 |  |
| /niche/solo | niche | 645 | 38.2 | WORD_COUNT_LOW |
| /niche/uncut | niche | 646 | 37.9 | WORD_COUNT_LOW |
| /category/mobile-friendly | category | 650 | 61.2 | WORD_COUNT_LOW |
| /compare/hard-brit-lads-vs-prideflame | compare | 651 | 54.1 |  |
| /compare/breed-me-raw-vs-japanboyz | compare | 656 | 55.3 |  |
| /compare/hiroyaxxx-vs-realmenfuck | compare | 656 | 54.4 |  |
| /compare/hard-brit-lads-vs-hiroyaxxx | compare | 664 | 54.5 |  |
| /compare/bareback-that-hole-vs-brothercrush | compare | 670 | 54.5 |  |

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
