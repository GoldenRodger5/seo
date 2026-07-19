# Content Audit Report — 2026-07-19

## Critical findings

**🚨 0 / 298 routes (0.0%) are `CLIENT_SIDE_ONLY`.** The prerendered HTML for these routes contains only meta tags and an empty `<div id="root"></div>`. Body content (review prose, comparison tables, FAQs, schema markup, internal links — everything below `<head>`) is rendered client-side after JS executes. **Google sees an empty page.**

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
| discount | 71 | 895 | 829 | 948 | HEALTHY |
| review | 71 | 1178 | 979 | 1941 | HEALTHY |
| compare | 51 | 749 | 626 | 2216 | HEALTHY |
| landing | 28 | 997 | 261 | 6095 | HEALTHY |
| niche | 21 | 808 | 523 | 2818 | HEALTHY |
| other | 20 | 1464 | 415 | 2514 | HEALTHY |
| guide | 8 | 2379 | 2162 | 2588 | HEALTHY |
| legal | 6 | 794 | 393 | 1038 | HEALTHY |
| blog | 6 | 1722 | 1523 | 1875 | HEALTHY |
| category | 6 | 1608 | 564 | 2884 | HEALTHY |
| utility | 5 | 337 | 266 | 12786 | HEALTHY |
| alternatives | 4 | 916 | 889 | 942 | HEALTHY |
| homepage | 1 | 884 | 884 | 884 | HEALTHY |

## Flag breakdown across all routes

| Flag | Count |
| --- | ---: |
| WORD_COUNT_LOW | 12 |
| THIN_LANDING | 5 |

## Compare page deep-dive

- **Page count:** 51
- **Template source:** `src/pages/ComparePage.tsx` (runtime React component, hydrated client-side).
- **Per-pair content source:** `src/data/comparison-content.ts` (~13,153 words across all pairs combined, never prerendered).
- **All 51 compare pages render as CLIENT_SIDE_ONLY** — Google sees identical 3.7KB meta-only HTML for each pair.
- **Kill-list recommendation:** until prerendering is fixed, the kill-list question is moot. Once Google can see content, then evaluate pairs by (a) neither site in top-10, (b) <5 GSC impressions/30d.

## Review page deep-dive

- **Page count:** 71
- **AI content rendering:** `AI_CONTENT_CLIENT_ONLY`. Static reviewBodies map exists with ~277 median words per site, but the prose only mounts into the DOM after `useAIReview` runs client-side.
- **Prerendered body word counts:** every review page is in the 979–1941 word range (NoScript + page chrome only).

## Worst-offender routes (smallest prerendered body)

Sorted ascending by body word count. Top 30:

| Route | Type | Body words | File size (KB) | Flags |
| --- | --- | ---: | ---: | --- |
| /blog/category/industry | landing | 261 | 19.7 | THIN_LANDING |
| /find-my-site | utility | 266 | 19.4 |  |
| /contact | utility | 289 | 21.8 |  |
| /ask-ai | utility | 337 | 20.6 |  |
| /blog/category/money | landing | 366 | 22.4 | THIN_LANDING |
| /blog/category/comparisons | landing | 388 | 24.1 | THIN_LANDING |
| /2257 | legal | 393 | 19.7 |  |
| /affiliate-disclosure | legal | 401 | 19.7 |  |
| /is-athletic-twinks-worth-it | other | 415 | 32.1 |  |
| /is-rawhole-worth-it | other | 428 | 32.4 |  |
| /compare | landing | 448 | 32.2 | THIN_LANDING |
| /is-sayuncle-worth-it | other | 457 | 32.5 |  |
| /blog/category/guides | landing | 467 | 26.0 | THIN_LANDING |
| /niche/military | niche | 523 | 32.0 | WORD_COUNT_LOW |
| /blog | landing | 524 | 32.2 |  |
| /niche/latin | niche | 532 | 31.9 | WORD_COUNT_LOW |
| /niche/big-dick | niche | 545 | 32.0 | WORD_COUNT_LOW |
| /category/free-trials | category | 564 | 44.3 | WORD_COUNT_LOW |
| /gay-porn-sites-ranked | other | 603 | 127.6 |  |
| /free-trial-twink-sites | landing | 606 | 43.9 |  |
| /compare/dudesraw-vs-trailertrashboys | compare | 626 | 55.5 |  |
| /compare/japanboyz-vs-peterfever | compare | 630 | 55.3 |  |
| /best-asian-gay-sites | landing | 644 | 67.6 |  |
| /niche/solo | niche | 648 | 38.3 | WORD_COUNT_LOW |
| /niche/uncut | niche | 649 | 38.0 | WORD_COUNT_LOW |
| /compare/hard-brit-lads-vs-prideflame | compare | 652 | 54.1 |  |
| /compare/breed-me-raw-vs-japanboyz | compare | 657 | 55.3 |  |
| /compare/hiroyaxxx-vs-realmenfuck | compare | 657 | 54.5 |  |
| /compare/hard-brit-lads-vs-hiroyaxxx | compare | 665 | 54.6 |  |
| /compare/bareback-that-hole-vs-brothercrush | compare | 671 | 54.5 |  |

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
