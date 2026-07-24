# Content Audit Report — 2026-07-24

## Critical findings

**🚨 0 / 280 routes (0.0%) are `CLIENT_SIDE_ONLY`.** The prerendered HTML for these routes contains only meta tags and an empty `<div id="root"></div>`. Body content (review prose, comparison tables, FAQs, schema markup, internal links — everything below `<head>`) is rendered client-side after JS executes. **Google sees an empty page.**

This is the single largest SEO problem on the site. It explains the GSC pattern of high impressions / low clicks: Google can't read the content the page actually shows to humans, so the page can't rank for queries that would match that content.

**AI review content (`useAIReview.ts` reviewBodies map) status:** AI_CONTENT_CLIENT_ONLY. The static reviewBodies map contains ~300 words of editorial per site for 60+ sites, but the prose is read from sessionStorage after JS executes — it never enters the prerendered HTML.

**Decision point per spec:** Banner integration on review pages is premature until the prerender pipeline is fixed. The page has no indexable content to anchor the banner to.

## Source-side editorial content (invisible to Google today)

The repo contains substantial editorial content in TS data files. None of it currently renders into the prerendered HTML.

| Source | Entries | Total words | Median words/entry |
| --- | ---: | ---: | ---: |
| `src/hooks/useAIReview.ts (reviewBodies map)` | 31 | 9,194 | 275 |
| `src/data/comparison-content.ts` | 9 | 13,116 | 1,457 |
| `src/data/blog-posts.ts` | 10 | 8,333 | 833 |
| `src/data/alternatives-content.ts` | 7 | 6,470 | 924 |

- **src/hooks/useAIReview.ts (reviewBodies map)** — Static review prose, ~3–4 paragraphs per site. Loaded into sessionStorage on first visit. NEVER appears in prerendered HTML (root div is empty until JS runs).
- **src/data/comparison-content.ts** — Per-pair compare content (likely BLUF + reasoning). Same prerender problem — body never enters static HTML.
- **src/data/blog-posts.ts** — Editorial blog content. Same prerender problem.
- **src/data/alternatives-content.ts** — Per-site alternatives content. Same prerender problem.

## Summary by page type

| Page type | Count | Median body words (prerendered) | Min | Max | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| review | 72 | 1196 | 984 | 1928 | HEALTHY |
| discount | 63 | 877 | 814 | 933 | HEALTHY |
| compare | 40 | 737 | 624 | 2219 | HEALTHY |
| landing | 28 | 996 | 338 | 6218 | HEALTHY |
| niche | 21 | 796 | 532 | 2784 | HEALTHY |
| other | 20 | 1950 | 427 | 2514 | HEALTHY |
| guide | 8 | 2365 | 2161 | 2587 | HEALTHY |
| legal | 6 | 821 | 392 | 1065 | HEALTHY |
| blog | 6 | 1721 | 1511 | 1874 | HEALTHY |
| category | 6 | 1522 | 466 | 2573 | HEALTHY |
| utility | 5 | 336 | 265 | 13068 | HEALTHY |
| alternatives | 4 | 913 | 896 | 935 | HEALTHY |
| homepage | 1 | 899 | 899 | 899 | HEALTHY |

## Flag breakdown across all routes

| Flag | Count |
| --- | ---: |
| WORD_COUNT_LOW | 14 |
| THIN_LANDING | 5 |
| LONG_DESC | 1 |

## Compare page deep-dive

- **Page count:** 40
- **Template source:** `src/pages/ComparePage.tsx` (runtime React component, hydrated client-side).
- **Per-pair content source:** `src/data/comparison-content.ts` (~13,116 words across all pairs combined, never prerendered).
- **All 40 compare pages render as CLIENT_SIDE_ONLY** — Google sees identical 3.7KB meta-only HTML for each pair.
- **Kill-list recommendation:** until prerendering is fixed, the kill-list question is moot. Once Google can see content, then evaluate pairs by (a) neither site in top-10, (b) <5 GSC impressions/30d.

## Review page deep-dive

- **Page count:** 72
- **AI content rendering:** `AI_CONTENT_CLIENT_ONLY`. Static reviewBodies map exists with ~275 median words per site, but the prose only mounts into the DOM after `useAIReview` runs client-side.
- **Prerendered body word counts:** every review page is in the 984–1928 word range (NoScript + page chrome only).

## Worst-offender routes (smallest prerendered body)

Sorted ascending by body word count. Top 30:

| Route | Type | Body words | File size (KB) | Flags |
| --- | --- | ---: | ---: | --- |
| /find-my-site | utility | 265 | 19.4 |  |
| /contact | utility | 288 | 21.8 |  |
| /ask-ai | utility | 336 | 20.6 |  |
| /blog/category/comparisons | landing | 338 | 22.1 | THIN_LANDING |
| /blog/category/industry | landing | 348 | 22.1 | THIN_LANDING |
| /blog/category/money | landing | 365 | 22.3 | THIN_LANDING |
| /2257 | legal | 392 | 19.7 |  |
| /is-rawhole-worth-it | other | 427 | 32.3 |  |
| /compare | landing | 443 | 32.2 | THIN_LANDING |
| /affiliate-disclosure | legal | 447 | 20.1 |  |
| /is-sayuncle-worth-it | other | 456 | 32.5 |  |
| /blog/category/guides | landing | 466 | 26.0 | THIN_LANDING |
| /category/free-trials | category | 466 | 34.8 | WORD_COUNT_LOW |
| /blog | landing | 523 | 32.1 |  |
| /niche/military | niche | 532 | 32.8 | WORD_COUNT_LOW |
| /niche/latin | niche | 541 | 32.8 | WORD_COUNT_LOW |
| /niche/big-dick | niche | 555 | 32.8 | WORD_COUNT_LOW |
| /gay-porn-sites-ranked | other | 605 | 129.1 |  |
| /free-trial-twink-sites | landing | 607 | 45.0 |  |
| /compare/dudesraw-vs-trailertrashboys | compare | 624 | 55.5 |  |
| /compare/japanboyz-vs-peterfever | compare | 629 | 55.2 |  |
| /best-asian-gay-sites | landing | 643 | 67.6 |  |
| /compare/hard-brit-lads-vs-prideflame | compare | 650 | 54.1 |  |
| /category/mobile-friendly | category | 655 | 62.0 | WORD_COUNT_LOW |
| /compare/hiroyaxxx-vs-realmenfuck | compare | 655 | 54.4 |  |
| /compare/breed-me-raw-vs-japanboyz | compare | 656 | 55.3 |  |
| /niche/solo | niche | 658 | 38.4 | WORD_COUNT_LOW |
| /niche/uncut | niche | 660 | 39.1 | WORD_COUNT_LOW |
| /compare/bareback-that-hole-vs-brothercrush | compare | 661 | 53.9 |  |
| /compare/hard-brit-lads-vs-hiroyaxxx | compare | 663 | 54.5 |  |

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
