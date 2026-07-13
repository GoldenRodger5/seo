# Content Audit Report — 2026-07-13

## Critical findings

**🚨 0 / 398 routes (0.0%) are `CLIENT_SIDE_ONLY`.** The prerendered HTML for these routes contains only meta tags and an empty `<div id="root"></div>`. Body content (review prose, comparison tables, FAQs, schema markup, internal links — everything below `<head>`) is rendered client-side after JS executes. **Google sees an empty page.**

This is the single largest SEO problem on the site. It explains the GSC pattern of high impressions / low clicks: Google can't read the content the page actually shows to humans, so the page can't rank for queries that would match that content.

**AI review content (`useAIReview.ts` reviewBodies map) status:** AI_CONTENT_CLIENT_ONLY. The static reviewBodies map contains ~300 words of editorial per site for 60+ sites, but the prose is read from sessionStorage after JS executes — it never enters the prerendered HTML.

**Decision point per spec:** Banner integration on review pages is premature until the prerender pipeline is fixed. The page has no indexable content to anchor the banner to.

## Source-side editorial content (invisible to Google today)

The repo contains substantial editorial content in TS data files. None of it currently renders into the prerendered HTML.

| Source | Entries | Total words | Median words/entry |
| --- | ---: | ---: | ---: |
| `src/hooks/useAIReview.ts (reviewBodies map)` | 31 | 9,098 | 275 |
| `src/data/comparison-content.ts` | 8 | 11,544 | 1,443 |
| `src/data/blog-posts.ts` | 10 | 8,395 | 839 |
| `src/data/alternatives-content.ts` | 7 | 6,456 | 922 |

- **src/hooks/useAIReview.ts (reviewBodies map)** — Static review prose, ~3–4 paragraphs per site. Loaded into sessionStorage on first visit. NEVER appears in prerendered HTML (root div is empty until JS runs).
- **src/data/comparison-content.ts** — Per-pair compare content (likely BLUF + reasoning). Same prerender problem — body never enters static HTML.
- **src/data/blog-posts.ts** — Editorial blog content. Same prerender problem.
- **src/data/alternatives-content.ts** — Per-site alternatives content. Same prerender problem.

## Summary by page type

| Page type | Count | Median body words (prerendered) | Min | Max | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| compare | 161 | 753 | 667 | 1967 | HEALTHY |
| discount | 68 | 835 | 774 | 889 | HEALTHY |
| review | 68 | 1097 | 730 | 1855 | HEALTHY |
| landing | 29 | 943 | 228 | 5084 | HEALTHY |
| niche | 21 | 765 | 488 | 2691 | HEALTHY |
| other | 16 | 904 | 382 | 2023 | HEALTHY |
| guide | 7 | 2346 | 2129 | 2555 | HEALTHY |
| legal | 6 | 761 | 360 | 1005 | HEALTHY |
| blog | 6 | 1689 | 1490 | 1842 | HEALTHY |
| category | 6 | 1537 | 531 | 2683 | HEALTHY |
| utility | 5 | 275 | 233 | 11715 | HEALTHY |
| alternatives | 4 | 731 | 719 | 751 | HEALTHY |
| homepage | 1 | 653 | 653 | 653 | HEALTHY |

## Flag breakdown across all routes

| Flag | Count |
| --- | ---: |
| WORD_COUNT_LOW | 16 |
| THIN_LANDING | 6 |
| ORPHAN_PAGE | 1 |

## Compare page deep-dive

- **Page count:** 161
- **Template source:** `src/pages/ComparePage.tsx` (runtime React component, hydrated client-side).
- **Per-pair content source:** `src/data/comparison-content.ts` (~11,544 words across all pairs combined, never prerendered).
- **All 161 compare pages render as CLIENT_SIDE_ONLY** — Google sees identical 3.7KB meta-only HTML for each pair.
- **Kill-list recommendation:** until prerendering is fixed, the kill-list question is moot. Once Google can see content, then evaluate pairs by (a) neither site in top-10, (b) <5 GSC impressions/30d.

## Review page deep-dive

- **Page count:** 68
- **AI content rendering:** `AI_CONTENT_CLIENT_ONLY`. Static reviewBodies map exists with ~275 median words per site, but the prose only mounts into the DOM after `useAIReview` runs client-side.
- **Prerendered body word counts:** every review page is in the 730–1855 word range (NoScript + page chrome only).

## Worst-offender routes (smallest prerendered body)

Sorted ascending by body word count. Top 30:

| Route | Type | Body words | File size (KB) | Flags |
| --- | --- | ---: | ---: | --- |
| /blog/category/industry | landing | 228 | 19.0 | THIN_LANDING |
| /find-my-site | utility | 233 | 18.7 |  |
| /contact | utility | 256 | 21.1 |  |
| /ask-ai | utility | 275 | 21.7 |  |
| /blog/category/money | landing | 333 | 21.7 | THIN_LANDING |
| /blog/category/comparisons | landing | 355 | 23.4 | THIN_LANDING |
| /2257 | legal | 360 | 19.0 |  |
| /affiliate-disclosure | legal | 368 | 19.0 |  |
| /is-athletic-twinks-worth-it | other | 382 | 31.4 |  |
| /is-rawhole-worth-it | other | 395 | 31.7 |  |
| /compare | landing | 415 | 31.6 | THIN_LANDING |
| /is-sayuncle-worth-it | other | 424 | 31.8 |  |
| /blog/category/guides | landing | 434 | 25.4 | THIN_LANDING |
| /niche/military | niche | 488 | 31.1 | WORD_COUNT_LOW |
| /blog | landing | 491 | 31.5 | THIN_LANDING |
| /niche/latin | niche | 497 | 31.1 | WORD_COUNT_LOW |
| /niche/big-dick | niche | 510 | 31.1 | WORD_COUNT_LOW |
| /category/free-trials | category | 531 | 43.6 | WORD_COUNT_LOW |
| /gay-porn-sites-ranked | other | 549 | 120.7 |  |
| /free-trial-twink-sites | landing | 573 | 43.2 |  |
| /best-asian-gay-sites | landing | 611 | 66.9 |  |
| /niche/solo | niche | 611 | 37.3 | WORD_COUNT_LOW |
| /niche/uncut | niche | 612 | 37.0 | WORD_COUNT_LOW |
| /best-daddy-twink-sites | landing | 640 | 67.1 |  |
| /gay-dating-sites | utility | 645 | 27.0 |  |
| / | homepage | 653 | 84.3 |  |
| /compare/bigstr-vs-twinktrade | compare | 667 | 55.7 |  |
| /compare/alternadudes-vs-bigstr | compare | 668 | 55.9 |  |
| /compare/bigstr-vs-trailertrashboys | compare | 669 | 56.1 |  |
| /compare/dudesraw-vs-spicevidsgay | compare | 675 | 56.6 |  |

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
