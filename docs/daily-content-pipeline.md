# Daily Content Pipeline — How It Works

## What runs and when

GitHub Action `Daily Content Generation` ([.github/workflows/daily-content.yml](.github/workflows/daily-content.yml)) fires at **6am EST every day** (10:00 UTC cron) and on `workflow_dispatch` for manual triggers.

It runs `npx tsx scripts/generate-daily-content.ts --push` which:
1. Picks the highest-priority unpublished item from `content-queue.ts`.
2. Calls Anthropic with web-search grounding to generate content.
3. Runs quality gates (with auto-retry).
4. Persists the result to the right data file.
5. Marks the queue entry published.
6. Runs the full build (sitemap → vite client → vite SSR → prerender-app → strict audit).
7. Commits + pushes to main.
8. Pings Google Indexing API + Bing IndexNow with the new URL.

If anything between step 3 and 6 fails, the data files are rolled back to the pre-step-4 state and the queue entry stays `queued` so tomorrow's run retries it.

## Retry logic by failure type

| Failure                                          | Behavior today                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Anthropic API timeout / rate limit / 5xx         | Exit 0 (workflow green). Queue entry stays `queued`. Tomorrow's run re-attempts the same item.            |
| Quality gate: meta description length            | **Targeted repair** — single LLM call that rewrites only the meta. Re-gates. If still bad, falls into the regenerate loop. |
| Quality gate: any other field (word count, missing schema fields, etc.) | **Up to 2 regeneration retries**, each fed back the gate errors as a "fix these specific issues" hint. If all 3 attempts fail → exit 0, queue stays `queued`, tomorrow retries. |
| Duplicate meta detected across recently-published content | Exit 1, the day's slot is wasted. Queue entry stays `queued`.                                       |
| Build fails (vite, SSR, prerender)               | **Rollback data files** to pre-persist state → queue entry restored to `queued` → exit 1. Next run retries the same item cleanly. |
| Strict audit fails (any of 13 hard-fail flags)   | Same as build fail — rollback + exit 1.                                                                  |
| Commit / push fails (e.g. branch protection)     | Exit 1. Content is in workspace but uncommitted. Files NOT rolled back (the content itself was good — only git failed). |
| Indexing API / IndexNow ping fails               | Warn only. The commit already shipped — Google's sitemap re-crawl will pick up the new URL on its normal cadence. |

## Quality gate (hard-fail conditions)

The gate runs immediately after generation. If any of these fire, the attempt fails and the retry loop activates:

- **meta_description length** outside 120–165 chars
- **h1 length** outside 20–100 chars
- **review word count** < 800 (review type only)
- **discount word count** < 400 (discount type only)
- **scores** missing or out of 1–10 range (review type only)
- **faq** < 3 entries (review type only)
- **h1** missing (review type only)

These gates match the audit's HARD_FAIL flags, so AI output that passes the gate won't get rejected by the strict audit later.

## Strict audit (final gate)

After the build, [`audit-content.ts --strict`](../scripts/audit-content.ts) walks every prerendered route and fails on any of these flags:

| Flag                          | What it catches                                                       |
| ----------------------------- | --------------------------------------------------------------------- |
| `CLIENT_SIDE_ONLY`            | Empty `<div id="root">` — SSR didn't render the React tree            |
| `MISSING_REVIEW_SCHEMA`       | `/reviews/{slug}` without Review or Product schema                    |
| `MISSING_COMPARE_SCHEMA`      | `/compare/{pair}` without Review or Product schema                    |
| `MISSING_ARTICLE_SCHEMA`      | `/blog/{slug}` without Article or BlogPosting schema                  |
| `MISSING_LIST_SCHEMA`         | `/niche/{slug}` or `/category/{slug}` without ItemList or CollectionPage |
| `MISSING_HOMEPAGE_SCHEMA`     | `/` without WebSite or Organization                                   |
| `MISSING_BREADCRUMB_SCHEMA`   | review/compare/discount/niche/category/blog pages without BreadcrumbList |
| `INVALID_JSON_LD`             | Any JSON-LD block fails `JSON.parse` (breaks ALL schema on that page) |
| `THIN_REVIEW`                 | Review page body < 600 words                                          |
| `THIN_COMPARE`                | Compare page body < 500 words                                         |
| `THIN_HOMEPAGE`               | Homepage body < 400 words                                             |
| `THIN_DESC`                   | Meta description < 120 chars                                          |
| `LONG_TITLE`                  | Title > 65 chars                                                      |

Soft flags (`THIN_TITLE`, `LONG_DESC`, `THIN_LANDING`, `THIN_BLOG`) warn but don't block the commit.

## Where content lands

| Queue `content_type` | Data file persisted to                  | URL pattern                                 | Route renders via                  |
| -------------------- | --------------------------------------- | ------------------------------------------- | ---------------------------------- |
| `review`             | `src/data/sites.ts` + `src/hooks/useAIReview.ts` (reviewBodies map) | `/reviews/{slug}`                  | `src/pages/ReviewPage.tsx`         |
| `comparison`         | `src/data/comparison-content.ts`        | `/compare/{a}-vs-{b}`                       | `src/pages/ComparePage.tsx`        |
| `alternatives`       | `src/data/alternatives-content.ts`      | `/alternatives/{site}` (generic) OR `/{legacy-slug}-alternatives` | `src/pages/seo/GenericAlternatives.tsx` |
| `isworthit`          | `src/data/isworthit-content.ts`         | `/is-{slug}-worth-it`                       | `src/components/WorthItPage.tsx`   |
| `guide`              | `src/data/guide-content.ts`             | `/guide/{slug}`                             | `src/pages/GuidePage.tsx`          |

Every persist also stamps the route's `lastmod` in `docs/content-lastmod.json`, which `generate-sitemap.ts` reads to emit accurate `<lastmod>` tags for AI-content routes.

## Per-URL crawler submission

After the commit, [`pingGoogle`](../scripts/generate-daily-content.ts) and [`pingBing`](../scripts/generate-daily-content.ts) submit the exact rendered URL:

- **Google Indexing API**: `urlNotifications:publish` with `type: URL_UPDATED`. Requires `GOOGLE_SERVICE_ACCOUNT_JSON` secret.
- **Bing IndexNow**: POST to `bing.com/indexnow` with the URL list. Requires `BING_INDEXNOW_KEY` secret.

URL construction is content-type-aware so the submitted URL matches what the route actually renders at — wrong URLs 404 silently and waste the ping.

## What you'd see on a failing day

Healthy run log:
```
[content] Target: alternatives → twinks-in-shorts-alternatives
[content] Generating…
[content] Writing key: "twinks-in-shorts-alternatives" to alternatives-content.ts
[content] upsert: wrote twinks-in-shorts-alternatives to alternatives-content.ts
[content] Marked queue entry supporting:twinks-in-shorts-alternatives as published
[content] Running prerender-app...
[content] Running audit-content (strict)...
✓ Strict audit passed: no hard-fail flags.
[content] Submitting to crawlers: https://twinkvault.com/alternatives/twinks-in-shorts
Google ping ok (200)
Bing ping ok (200)
[content] Done. https://twinkvault.com/alternatives/twinks-in-shorts
```

Build-failure run log:
```
[content] Target: comparison → compare/men-vs-twinks-in-shorts
[content] Generating…
[content] Attempt 1 failed gate: review word count 712 < 800
[content] Retry 1/2 with failure hint…
[content] Generating…
[content] (succeeds)
[content] Running audit-content (strict)...
✗ Strict audit FAILED: 1 route(s) have hard-fail flags.
   /compare/men-vs-twinks-in-shorts → INVALID_JSON_LD
[content] Build failed — rolling back data-file edits so tomorrow's run can retry.
  restored content-queue.ts
  restored comparison-content.ts
  restored content-lastmod.json
[content] Logged to content_log
Error: Process completed with exit code 1.
```

The queue entry comes back to life — tomorrow's run picks it up at the same priority and retries with a fresh generation attempt.

## Verifying daily output is healthy

After any auto-commit lands on main, check:
- `docs/content-audit-report.md` — top section shows 0 hard-fail flags
- The new URL's prerendered HTML: `grep "@type" dist/<route>/index.html` should list the expected schemas
- GSC Indexing → check the new URL was crawled within 24h (the Indexing API ping accelerates this from days to hours)
- `content_log` table in Supabase — each run inserts a row with success/failure state for dashboarding
