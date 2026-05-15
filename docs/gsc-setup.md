# Google Search Console daily sync — setup checklist

The `/api/cron/gsc-sync` endpoint runs daily at 04:00 UTC and mirrors
yesterday's Search Console data into Supabase. Once configured, the
`/admin/seo` dashboard tab populates automatically.

This is a one-time setup. Estimated time: ~15 minutes.

## 1. Create a Google Cloud project (or reuse one)

1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top → **New Project**
3. Name it something like `twinkvault-gsc` and click Create
4. Wait ~30 seconds for the project to provision, then make sure it's
   selected in the project dropdown

## 2. Enable the Search Console API

1. In the left sidebar, go to **APIs & Services → Library**
2. Search for "Search Console API"
3. Click the result → **Enable**
4. Wait for the API to be enabled (~10s)

## 3. Create a service account

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → Service Account**
3. Name it `gsc-sync` (the rest auto-fills)
4. Click **Create and continue**
5. Skip the optional "Grant access" steps — click **Done**
6. Back on the Credentials page, click the newly-created service account
7. Go to the **Keys** tab → **Add Key → Create new key → JSON**
8. The browser downloads a JSON file — save it. It looks like:
   ```json
   {
     "type": "service_account",
     "project_id": "...",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "gsc-sync@twinkvault-gsc.iam.gserviceaccount.com",
     ...
   }
   ```
9. **Copy the `client_email`** — you'll need it in step 4

## 4. Grant the service account access in Search Console

1. Go to https://search.google.com/search-console
2. Select the `twinkvault.com` property
3. Click **Settings** (gear icon, bottom-left) → **Users and permissions**
4. Click **Add user**
5. Paste the service account email from step 3
6. Permission: **Restricted** is sufficient (it only needs read access)
7. Click **Add**

## 5. Set Vercel environment variables

In the Vercel dashboard:
1. Go to your project → **Settings → Environment Variables**
2. Add the following (all three, production scope):

| Name | Value |
|---|---|
| `GSC_SERVICE_ACCOUNT_JSON` | Paste the entire JSON file contents as a single line string |
| `GSC_SITE_URL` | `https://twinkvault.com/` (note trailing slash — required by GSC API) |
| `CRON_SECRET` | A random 32+ character string (e.g. from `openssl rand -hex 32`) |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → service_role key |

⚠️ **`SUPABASE_SERVICE_ROLE_KEY` is privileged** — it can read and write
all tables, bypassing RLS. Do NOT expose this anywhere client-side;
only the server cron uses it.

3. After adding all variables, redeploy the project so the cron picks
   them up: Vercel dashboard → Deployments → click the latest →
   **Redeploy**

## 6. Verify the cron is wired up

1. After deploy completes, in the Vercel dashboard go to **Cron Jobs**
2. You should see one entry: `/api/cron/gsc-sync · 0 4 * * *`
3. Click **Run** to test manually
4. Open the function logs — you should see something like:
   ```
   { ok: true, date: "2026-05-13", queries_synced: 47, pages_synced: 32, daily_totals: 1 }
   ```

If it errors:
- `unauthorized` → `CRON_SECRET` mismatch
- `GSC_SERVICE_ACCOUNT_JSON env var not set` → step 5 missed this var
- `GSC query failed (403)` → step 4 not done, service account doesn't have access
- `gsc_queries upsert failed` → Phase 4 migration not run; see
  `supabase/migrations/20260514200000_phase4_analytics_depth.sql`

## 7. Check `/admin/seo` populates

After the first successful cron run (or immediate manual test):
1. Visit `https://twinkvault.com/admin/seo`
2. The chart and tables should populate from the synced data
3. Daily run schedule: 04:00 UTC = ~midnight Eastern. Each run pulls
   data for the *previous* day (GSC has a 24-48h delay before data is
   final).

## Going forward

- The cron runs unattended. No further action needed.
- Data accumulates daily — after ~7 days the dashboard's 7-day query
  table is meaningful; after 30 days the trend chart is meaningful.
- If you ever rotate `CRON_SECRET` or the service account, update the
  Vercel env vars and redeploy.

## Privacy & scope

The service account has **read-only** access to your Search Console
property — it can't make changes, can't see other Google services,
can't access anyone else's data. The credentials JSON should be
treated as a secret but the impact of a leak is limited to "someone
can read your SEO numbers."
