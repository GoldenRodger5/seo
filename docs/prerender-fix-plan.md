# Prerender Fix — Implementation Plan

## Why this matters

The content audit (`docs/content-audit-report.md`) found that 401/401 routes ship empty `<div id="root"></div>` to crawlers. ~31,000 words of editorial content in the repo are invisible to Google. This plan moves that content into the prerendered HTML.

## Current state (verified)

- React Router via `BrowserRouter` in [App.tsx](src/App.tsx). Routes are static (no `useMatch` magic, no nested async).
- `HelmetProvider` already wraps the tree → server-side meta extraction is straightforward.
- Page data comes from static `import`s (`sites.ts`, `niches.ts`, `comparison-content.ts`, `reviewBodies` map, blog posts). **No runtime API calls during render.** Supabase reads are confined to analytics tracking (post-mount) and admin dashboard (separate surface).
- Hook usage on the hot pages: ReviewPage has 6 effects/state hooks (helpful-vote UI, AI loader), ComparePage 4, Index 2. Manageable.
- `useAIReview` is a thin wrapper that returns `reviewBodies[slug]` after a `sessionStorage` round-trip. The data is **already in code** — it just runs through a hook that gates on a `useEffect`.
- Tailwind/CSS-in-JS via classnames only. No styled-components / Emotion SSR concerns.
- framer-motion is used widely — its components SSR fine but render to plain `<div>` until JS hydrates. Acceptable.

## Recommendation: Path A (in-place SSG via `react-dom/server`)

### Why not Astro/Next migration

A framework migration would deliver a cleaner long-term result (zero-JS-by-default, partial hydration, faster TTFB) but it's a 2–3 week project that touches every page, every component import, every analytics call, the admin dashboard, and the build pipeline. The SEO bleeding doesn't justify that scope when the existing setup is one well-targeted script away from indexable.

### Why Path A works here

- All page data is import-time available → `renderToString` produces real HTML with no async waiting
- React Router's `StaticRouter` is a drop-in for SSR
- React-helmet-async exposes `helmetContext` for server-side meta collection
- The build already runs `prerender-meta.ts` after `vite build` — we extend the same hook
- Hydration on the client mounts on top of the rendered HTML, preserving all existing client behavior (analytics, admin gating, etc.)

## Architecture

Add a new build step `scripts/prerender-app.ts` that runs **after** `vite build` and **before** the existing `prerender-meta.ts` (or replaces it — see below).

```
vite build                  # builds the SPA bundle into dist/
prerender-app.ts            # NEW — renders each route's React tree to HTML
                            #       writes full HTML to dist/<route>/index.html
                            #       includes route-specific meta from HelmetProvider
sitemap.ts                  # unchanged
```

The current `prerender-meta.ts` does only meta injection — `prerender-app.ts` does both meta AND body, so `prerender-meta.ts` is retired (delete + remove from `package.json` build script).

## Steps in order

1. **Add SSR entry point** `src/entry-server.tsx`
   ```tsx
   import { renderToString } from "react-dom/server";
   import { StaticRouter } from "react-router-dom/server";
   import { HelmetProvider } from "react-helmet-async";
   import App from "./App";
   
   export function render(url: string) {
     const helmetCtx: { helmet?: HelmetServerState } = {};
     const html = renderToString(
       <HelmetProvider context={helmetCtx}>
         <StaticRouter location={url}>
           <App />
         </StaticRouter>
       </HelmetProvider>
     );
     return { html, helmet: helmetCtx.helmet };
   }
   ```
   Refactor `App.tsx` to export the inner tree (without `BrowserRouter`) so both `entry-client.tsx` (BrowserRouter) and `entry-server.tsx` (StaticRouter) can mount it.

2. **Add build config** in [vite.config.ts](vite.config.ts) for an `ssr` build target that produces `dist-server/entry-server.js` consumable by Node.

3. **Write `scripts/prerender-app.ts`**:
   - Reads `dist/index.html` template
   - Builds the route list (sites × routes, niches × pages, etc.) — reuse the existing logic from `prerender-meta.ts`
   - For each route: call `render(url)`, splice the rendered HTML into the template at `<div id="root">…</div>`, splice `helmet.title`, `helmet.meta`, `helmet.script` into `<head>`
   - Writes `dist/<route>/index.html`

4. **SSR-safety pass on hot pages** — fix code that runs at render time and assumes a browser:
   - `useAIReview` → render `reviewBodies[slug]` directly. The hook stays for `loading` state during client hydration but the *initial* render returns the static prose synchronously. Removes the sessionStorage gate at first paint.
   - Anywhere using `window.` / `document.` outside `useEffect` → guard with `typeof window !== "undefined"`. Grep for callers; expected hits: localized price formatting, motion lazy loads, supabase client init. Most already deferred.
   - `useMediaQuery` / mobile-detect hooks → ensure they return a server-safe default (e.g. `false`) before hydration.
   - Anything in `useLayoutEffect` → swap to `useEffect` (React warns but doesn't crash; still worth a sweep).

5. **Per-route smoke test**
   - Build, then `grep -c "Bottom Line" dist/compare/militarydick-vs-barebackcumpigs/index.html` — should return >0.
   - `grep -c "Helix Studios has been in the game" dist/reviews/helix-studios/index.html` — should return 1.
   - Re-run `npx tsx scripts/audit-content.ts` — `CLIENT_SIDE_ONLY` count should drop from 401 → 0 (or near 0; some utility routes like /go/:slug should stay).

6. **Schema markup migration** — the Review/FAQ/Breadcrumb schema scripts are currently injected by Helmet's `<script type="application/ld+json">`. Verify these enter the prerendered HTML via the helmet context. If not (helmet-async sometimes omits script tags from `helmet.script`), inject manually in the prerender script using the same source-of-truth helpers.

7. **Cache-bust deploys** — first deploy after SSG ships, Google needs to re-crawl. Force submission via GSC `Inspect URL → Request Indexing` for the top 20 review and compare pages.

## What about useAIReview

The hook is essentially dead weight once SSR ships. The flow:
- Before: `useAIReview(site)` → useEffect → check sessionStorage → fall back to `reviewBodies[site.slug]` → `setState`
- After: render `reviewBodies[site.slug]` directly. Drop the hook, drop sessionStorage, drop the loading state.

This drops ~50 lines and 1 client-side render pass per review page. The "AI" was never live anyway — it's static prose.

## Risks and mitigations

| Risk                                       | Mitigation                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| SSR crashes on a page using `window.` at render time | Render every route in the build script; failures fail the build with a clear stack. Fix one at a time.    |
| Hydration mismatch (server HTML ≠ client first render) | Use `useEffect` for any state that depends on client-only data (window size, country detection, etc.). Standard React pattern. |
| Bundle size increase                       | Build script runs in Node; production client bundle unchanged. Hydration is the same React tree as before. |
| First build takes much longer              | 401 routes × ~50ms renderToString = ~20s added to build. Acceptable.                                       |
| Supabase analytics inits at module load    | Verify `supabaseClient.ts` is lazy/guarded. If it reads env vars during module load with no guard, wrap in `typeof window` or `typeof process`. |

## Scope of work

- 1 new file: `src/entry-server.tsx`
- 1 new file: `scripts/prerender-app.ts`
- 1 modified: [App.tsx](src/App.tsx) — split BrowserRouter out
- 1 modified: [main.tsx](src/main.tsx) (rename → `entry-client.tsx`)
- 1 modified: [vite.config.ts](vite.config.ts) — add SSR build target
- 1 modified: [package.json](package.json) — update `build` script
- 1 deleted: [scripts/prerender-meta.ts](scripts/prerender-meta.ts) (merged into prerender-app.ts)
- 1 modified: [useAIReview.ts](src/hooks/useAIReview.ts) — render synchronously
- N modified: pages that hit `window.` / `document.` at render time (count TBD, expected 3–6)

Estimated effort: **6–10 hours of focused work**, mostly on the SSR-safety pass. The renderer itself is ~150 lines.

## Definition of done

- `npm run build` succeeds
- `audit-content.ts` reports CLIENT_SIDE_ONLY = 0 for review/compare/niche/blog/landing routes
- `grep` confirms reviewBodies prose appears in `dist/reviews/<slug>/index.html`
- Site loads and hydrates identically to today in a desktop + mobile browser smoke test
- No regression in analytics events (impressions + clicks still log on first interaction)
- Deploy to production, GSC indexing requested for top routes
- Re-audit at +14 days vs the prior 14-day GSC baseline to measure ranking lift

## After this lands

Once Google can read the existing content, **then** the content-depth question becomes meaningful:
- Re-run the audit and apply the type-level thresholds (THIN_REVIEW < 600 words, etc.)
- Decide the compare-page kill list using real GSC data
- Plan the content-depth sprint informed by which pages have impressions but thin bodies
- Resume the paused banner integration sprint (Part 2 of the prior spec) — the page now has indexable content to anchor banners to
