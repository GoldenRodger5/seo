# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TwinkVault is an SEO-driven affiliate review site for gay membership ("twink") sites. It is a **Vite + React SPA that is statically prerendered (SSG) to per-route HTML at build time** — there is no runtime server framework (not Next.js). Content is mostly data-as-code under `src/data/`, and a self-running "content engine" generates new pages daily via the Anthropic API and commits them to `main`.

## Commands

```sh
npm run dev              # Vite dev server on http://localhost:8080 (host ::)
npm run build            # Full production build — see pipeline below
npm run lint             # ESLint over the repo
npm test                 # vitest run (one-shot)
npm run test:watch       # vitest watch mode
npx vitest run src/test/example.test.ts   # run a single test file
```

`npm run build` runs this exact ordered pipeline (each step depends on the previous):

```
generate-sitemap → build:client (vite) → build:ssr (vite --ssr) → build:prerender → build:seo-preflight
```

- **build:client** → `dist/` (SPA bundle, PWA service worker via vite-plugin-pwa)
- **build:ssr** → `dist-server/entry-server.js` (ESM, dynamically imported by the prerender step)
- **build:prerender** (`scripts/prerender-app.ts`) → renders every route's React tree to HTML and writes `dist/<route>/index.html`, also overwriting `dist/index.html` for `/`
- **build:seo-preflight** / **build:audit-strict** → gate the output; the strict audit fails the build on any of ~13 hard-fail SEO flags (missing schema, thin content, empty SSR root, etc.)

Image tooling (sharp-based, separate from the main build):
```sh
npm run images:check     # audit + validate (run before committing new banners)
npm run images:process   # resize/convert source creative to WebP
npm run sitemap          # regenerate sitemap.xml standalone
```

## Build & rendering architecture

The single most important thing to understand: **routes are defined once and consumed by two renderers.**

- `src/App.tsx` exports `AppRoutes` (the `<Routes>` only) and `AppShellWithProviders` (provider stack, no router). The default `App` wraps these in `BrowserRouter` for the client.
- `src/entry-server.tsx` wraps the same shell in `StaticRouter` and `renderToString` for SSR.
- `scripts/prerender-app.ts` imports the compiled SSR entry and renders **a route list it builds itself** (NOT derived from `App.tsx`). When you add a route to `App.tsx`, you almost always must also add it to the route-list construction in `prerender-app.ts`, or it won't get prerendered HTML and will fail the strict audit / serve only the SPA shell.
- Public pages are **eager imports** in `App.tsx` on purpose — `lazy()` + `Suspense` renders the fallback during SSR, defeating prerendering. Only `/admin/*` routes are lazy (never crawled, gated client-side via `RequireAdmin`).
- `vercel.json` `cleanUrls: true` makes Vercel resolve `/reviews/helix-studios` → `dist/reviews/helix-studios/index.html` from the filesystem *before* the SPA-fallback rewrite. So prerendered routes serve their per-route HTML; only genuinely client-only routes (admin) fall through to the shell.
- The prerender step injects `<title>`, meta, canonical, OG/Twitter tags, and react-helmet JSON-LD schema into the template. Meta values are HTML-attribute-escaped (`htmlAttrEscape`) — inner double quotes in descriptions (e.g. `is "X" worth it`) would otherwise truncate attributes.
- `prerender-app.ts` boots a **jsdom** global DOM before importing the SSR bundle, because bundled libs (framer-motion, radix, recharts) probe `window`/`document` at module-init time. It `process.exit(0)`s at the end to kill queued timers.
- SSR-incompatible deps are listed in `vite.config.ts` `ssr.noExternal` so they bundle into the SSR build. Add new client-only libs there if the SSR build can't resolve them.

## Data layer (`src/data/`)

Content is TypeScript data, not a CMS. Key files:

- **`sites.ts`** — the canonical site catalog (`SiteData[]`, ~62 sites). Scores, pricing, deal fields, `editorial_status` (`reviewed` | `pending-review` | `editorial-only`), `review_depth`, etc. Read the inline doc comments on `SiteData` before changing the schema — fields like `editorial_status` drive whether ranked surfaces, affiliate CTAs, and `AggregateOffer` schema render.
- **`content-queue.ts`** — the work queue for the autonomous engine (reviews + supporting content). `editorial_mode` mirrors `editorial_status`.
- Review prose lives in **`src/hooks/useAIReview.ts`** (`reviewBodies` map), not in `sites.ts`. Other generated content: `comparison-content.ts`, `alternatives-content.ts`, `isworthit-content.ts`, `guide-content.ts`, `blog-posts.ts`.
- `site-verdicts.ts`, `site-imagery.ts`, `niches.ts`, `site-niches.ts`, `site-brands.ts` are supporting maps keyed by site slug.

When adding a site or content piece by hand, the same files the engine writes to must be updated, plus `prerender-app.ts`'s route list and `docs/content-lastmod.json` (sitemap `<lastmod>`).

## Autonomous content engine

`scripts/generate-daily-content.ts` is run daily by `.github/workflows/daily-content.yml` (6am EST). It picks the next queue item, generates a page via the Anthropic API (`claude-sonnet-4-6`), runs quality gates with auto-retry, persists to the right data file, runs the full build, commits/pushes to `main`, and pings Google Indexing API + Bing IndexNow. On build/audit failure it **rolls back the data-file edits** and leaves the queue entry `queued` for retry.

```sh
npx tsx scripts/generate-daily-content.ts --dry-run --site men   # generate + log JSON only, no writes
npx tsx scripts/generate-daily-content.ts --force                # ignore day rotation, take top priority
npx tsx scripts/generate-daily-content.ts --audit                # scan for SEO gaps, generate nothing
npx tsx scripts/generate-daily-content.ts --inspect              # full live E2E QA, then restore (see below)
# --push adds commit + push + crawler ping (off by default; safe to run locally without it)
```

`--inspect` is the end-to-end QA mode: it picks the next queued item, **generates it live via the Anthropic API**, persists it, runs the real build + SSR + prerender, then prints an inspection report read from the prerendered `dist/<route>/index.html` — the `[content][quality]` line, the chosen hero image + alt, the contextual internal links in the article body, and the FAQ (visible HTML + FAQPage JSON-LD) — and a PASS/WARN gate verdict. It then **restores every file in `FILES_TO_SNAPSHOT`** (data files, queue, both sitemaps, audit docs) and **never commits, pushes, or pings**, so it leaves the working tree clean. Needs `ANTHROPIC_API_KEY` in the env:

```sh
ANTHROPIC_API_KEY=sk-ant-… npx tsx scripts/generate-daily-content.ts --inspect
```

`src/lib/contentRanker.ts` re-ranks the queue by layering GSC search-demand on top of static editorial priority (never publishes anything not queued — only re-orders). Full details in `docs/daily-content-pipeline.md` (quality gates, retry behavior, strict-audit flags).

## Backend surfaces

- **`api/`** — Vercel serverless functions: `recommend.ts` (AI site recommender, in-memory IP rate limiting, Anthropic key server-side only), `geo.ts`, `cron/gsc-sync.ts` (daily GSC→Supabase mirror, cron in `vercel.json`, bearer-auth via `CRON_SECRET`).
- **`middleware.ts`** — edge middleware that copies Vercel's `x-vercel-ip-country` header onto a `tv_country` cookie for client-side localization/tracking.
- **Supabase** — first-party analytics + admin data. Client in `src/integrations/supabase/client.ts` (anon key, `import.meta.env.VITE_*`). Migrations in `supabase/migrations/`. `src/integrations/supabase/types.ts` is generated — don't hand-edit.
- **Admin** (`src/pages/admin/`, `/admin/*`) — magic-link auth, `admin_users` allowlist, analytics/SEO dashboards. Lazy-loaded, never prerendered.

### Two analytics systems (don't conflate)

- `src/lib/analytics.ts` — **GA4** (gtag.js), consent-gated, loads only after cookie accept; no-op if `VITE_GA4_ID` unset.
- `src/lib/tracking.ts` — **first-party** analytics writing directly to Supabase `clicks` / `page_views` / `impressions` tables. No PII; session/visitor IDs are random UUIDs.

## Conventions

- Import alias `@/` → `src/` (configured in both `vite.config.ts` and `vitest.config.ts`).
- shadcn/ui components in `src/components/ui/` (config in `components.json`); app components alongside in `src/components/`. Tailwind, `class-variance-authority`, `tailwind-merge`.
- Package manager: a `bun.lock` and `package-lock.json` both exist; the GitHub workflow and these scripts use `npm`/`npx tsx`.
- Env vars: client-exposed ones are `VITE_*` (anon Supabase key, GA4 id — safe to expose). `ANTHROPIC_API_KEY`, `*_SERVICE_ROLE_KEY`, `CRON_SECRET`, indexing-API creds are **server-only** — never reference them from `src/`. See `.env.example`.
- Adult-content SEO constraints: alt text must be SFW (Google penalizes graphic adult alt copy) — see the README's image-guidelines section.

## Reference docs

`docs/` holds operational runbooks worth reading before touching the relevant subsystem: `daily-content-pipeline.md`, `gsc-setup.md`, `seo-pipeline-setup.md`, `image-guidelines.md`, and audit reports/JSON snapshots regenerated by the build.
