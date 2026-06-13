# SEO Pipeline Setup

What you need configured for the daily content engine + manual recovery scripts to ping Google and Bing.

## Required GitHub Actions secrets

Go to **GitHub → Repository → Settings → Secrets and variables → Actions** and add both:

### `GOOGLE_SERVICE_ACCOUNT_JSON`

Google Indexing API service-account credentials JSON. The Indexing API nudges Google to crawl a specific URL within hours instead of days.

Setup:
1. Open https://console.cloud.google.com/
2. Create a new project (or reuse an existing one) and enable the **Web Search Indexing API**.
3. Go to **IAM & Admin → Service Accounts**. Create a service account, e.g. `twinkvault-indexing`.
4. Generate a JSON key for the service account. Download it.
5. In **Google Search Console**, open the `twinkvault.com` property → **Settings → Users and permissions → Add user**. Add the service account's email (looks like `twinkvault-indexing@…iam.gserviceaccount.com`) as an **Owner**. Owner is required — Editor isn't enough for Indexing API access.
6. Paste the entire JSON file contents into the GitHub secret value. Both raw JSON and base64-encoded JSON are accepted (the script auto-detects).

Quota: 200 URL submissions per day per property (default; can be raised via Google Cloud Console quota request).

### `BING_INDEXNOW_KEY`

Bing IndexNow key (a GUID-style string). IndexNow accepts batches of up to 10,000 URLs per request.

Setup:
1. Generate a random 8–128 character key (lowercase alphanumeric). Recommended: `node -p "crypto.randomUUID().replace(/-/g, '')"`.
2. Copy that string into the GitHub secret value.
3. **Critical:** also host the same string as a static file at `https://twinkvault.com/{the-key}.txt`. Bing fetches this file to verify ownership before accepting any submissions. To do this:
   - Create `public/{the-key}.txt` containing nothing but the key (no whitespace, no newline).
   - The file is copied to `dist/{the-key}.txt` automatically on `npm run build`.
   - Verify after deploy: `curl https://twinkvault.com/{the-key}.txt` returns the key.

Bing accepts the submission only when the static file matches the key. Mismatched key → 422 errors and zero indexing acceleration.

## Verifying the secrets work

After both are set, manually trigger the daily content workflow from GitHub → Actions → **Daily Content Generation** → **Run workflow** on `main`. The run log should show:

```
Google ping ok (200)
Bing ping ok (200)
```

If you see either of:
```
🚨 GOOGLE_SERVICE_ACCOUNT_JSON is NOT SET …
🚨 BING_INDEXNOW_KEY is NOT SET …
```

the secret isn't set or isn't visible to the workflow. Check the secret name spelling — they must match exactly.

## Manual mass-reindex (after a crawl incident)

When something like the June 2026 robots.txt regression interrupts crawling and you want to nudge Google + Bing to recrawl the top pages immediately:

```bash
# Run from a local checkout with the env vars set
GOOGLE_SERVICE_ACCOUNT_JSON='{...}' \
BING_INDEXNOW_KEY=abc123… \
npx tsx scripts/request-reindex-all.ts
```

This submits ~68 URLs covering:
- Homepage + 19 SEO landing pages (best-*, /top-sites, /reviews, /best-deals)
- 21 niche pages
- Top 10 reviews by score (pending-review brands skipped)
- 10 featured compare pages
- Every alternatives page with AI body content

Truncated to 200 URLs to fit Google's daily quota. Bing IndexNow accepts the full list in a single batch.

Dry-run preview:
```bash
npx tsx scripts/request-reindex-all.ts --dry-run
```

## What the daily engine does already

Every successful daily run:
1. Generates one new content page via Anthropic + web search.
2. Persists to the right data file (comparison/alternatives/isworthit/guide).
3. Regenerates the sitemap with the new URL.
4. Builds + prerenders + audits (strict gate).
5. Commits + pushes (triggers Vercel deploy).
6. Pings Google Indexing API + Bing IndexNow with the new URL.

The pings use the same `pingGoogle` / `pingBing` functions the manual script uses, so verifying the secrets via the manual script also verifies the daily flow.

## Troubleshooting

| Symptom                                 | Cause                                                                 |
| --------------------------------------- | --------------------------------------------------------------------- |
| `Google ping failed: PERMISSION_DENIED` | Service account not added as Owner of the GSC property                |
| `Google ping failed: 403 forbidden`     | Web Search Indexing API not enabled in the Cloud project              |
| `Bing IndexNow rejected (422)`          | The key file at `/{key}.txt` doesn't match the submitted key          |
| `Bing IndexNow rejected (400)`          | URL list contains non-twinkvault.com URLs (IndexNow is host-scoped)   |
| Both pings silently absent              | Secrets not set on the GitHub Action. The script will now log this loudly with 🚨 markers — re-run and check the log. |

## Related files

- [scripts/generate-daily-content.ts](../scripts/generate-daily-content.ts) — daily engine
- [scripts/request-reindex-all.ts](../scripts/request-reindex-all.ts) — manual recovery script
- [docs/daily-content-pipeline.md](daily-content-pipeline.md) — full pipeline reference
