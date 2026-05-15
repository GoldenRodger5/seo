-- ───────────────────────────────────────────────────────────────────────────
-- Phase 4: Analytics depth
-- ───────────────────────────────────────────────────────────────────────────
-- 1. clicks.cta_position  — which UI affordance produced the click
--    (hero / mid-content-1 / sidebar / sticky-mobile / inline-blog etc.)
-- 2. page_engagement      — scroll depth + time-on-page per session/page
-- 3. gsc_queries / gsc_pages / gsc_daily_totals — Search Console mirror
-- 4. Backfill source_type for legacy "other" rows that have a source_page
-- ───────────────────────────────────────────────────────────────────────────

-- ── 1. cta_position column ───────────────────────────────────────────────
ALTER TABLE IF EXISTS clicks ADD COLUMN IF NOT EXISTS cta_position text;
CREATE INDEX IF NOT EXISTS idx_clicks_cta_position ON clicks(cta_position);

-- ── 2. page_engagement table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_engagement (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  session_id text,
  visitor_id text,
  path text NOT NULL,
  page_type text,
  max_scroll_pct int CHECK (max_scroll_pct >= 0 AND max_scroll_pct <= 100),
  time_on_page_ms int,
  reached_25 boolean DEFAULT false,
  reached_50 boolean DEFAULT false,
  reached_75 boolean DEFAULT false,
  reached_100 boolean DEFAULT false,
  country text
);

CREATE INDEX IF NOT EXISTS idx_page_engagement_created_at ON page_engagement(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_engagement_path ON page_engagement(path);
CREATE INDEX IF NOT EXISTS idx_page_engagement_session ON page_engagement(session_id);

ALTER TABLE page_engagement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert page_engagement" ON page_engagement;
CREATE POLICY "anon insert page_engagement" ON page_engagement FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "admin select page_engagement" ON page_engagement;
CREATE POLICY "admin select page_engagement" ON page_engagement FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

-- ── 3. GSC mirror tables ─────────────────────────────────────────────────
-- One row per (date, query, page) — primary GSC analytics surface.
CREATE TABLE IF NOT EXISTS gsc_queries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  query text NOT NULL,
  page text,
  clicks int DEFAULT 0,
  impressions int DEFAULT 0,
  ctr numeric(6, 4) DEFAULT 0,
  position numeric(6, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (date, query, page)
);
CREATE INDEX IF NOT EXISTS idx_gsc_queries_date ON gsc_queries(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_queries_query ON gsc_queries(query);

-- One row per (date, page) — aggregated across queries.
CREATE TABLE IF NOT EXISTS gsc_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  page text NOT NULL,
  clicks int DEFAULT 0,
  impressions int DEFAULT 0,
  ctr numeric(6, 4) DEFAULT 0,
  position numeric(6, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (date, page)
);
CREATE INDEX IF NOT EXISTS idx_gsc_pages_date ON gsc_pages(date DESC);

-- Site-wide daily totals.
CREATE TABLE IF NOT EXISTS gsc_daily_totals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  clicks int DEFAULT 0,
  impressions int DEFAULT 0,
  ctr numeric(6, 4) DEFAULT 0,
  avg_position numeric(6, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_totals_date ON gsc_daily_totals(date DESC);

-- RLS on GSC tables — admin-only SELECT, service-role writes via cron.
ALTER TABLE gsc_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_daily_totals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin select gsc_queries" ON gsc_queries;
CREATE POLICY "admin select gsc_queries" ON gsc_queries FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

DROP POLICY IF EXISTS "admin select gsc_pages" ON gsc_pages;
CREATE POLICY "admin select gsc_pages" ON gsc_pages FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

DROP POLICY IF EXISTS "admin select gsc_daily_totals" ON gsc_daily_totals;
CREATE POLICY "admin select gsc_daily_totals" ON gsc_daily_totals FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_users));

-- ── 4. Backfill source_type for legacy "other" rows ──────────────────────
-- Re-classify any clicks where source_page is set but source_type was
-- left as "other" (from before the classifier handled all current paths).
UPDATE clicks
SET source_type = CASE
  WHEN source_page IN ('/', '') THEN 'homepage'
  WHEN source_page LIKE '/reviews/%' THEN 'review'
  WHEN source_page = '/reviews' THEN 'reviews-index'
  WHEN source_page LIKE '/compare/%' THEN 'compare'
  WHEN source_page = '/compare' THEN 'compare-index'
  WHEN source_page LIKE '/discount/%' THEN 'discount'
  WHEN source_page LIKE '/niche/%' THEN 'niche'
  WHEN source_page LIKE '/category/%' THEN 'category'
  WHEN source_page = '/best-deals' THEN 'best-deals'
  WHEN source_page LIKE '/best-%' OR source_page LIKE '/cheapest-%'
    OR source_page LIKE '/free-trial-%' OR source_page LIKE '/gay-porn-%'
    OR source_page LIKE '/gay-dating-%' OR source_page LIKE '/helix-studios-%'
    OR source_page LIKE '/sean-cody-%' OR source_page LIKE '/nakedsword-%'
    OR source_page LIKE '/is-%' THEN 'landing'
  WHEN source_page LIKE '/blog/%' THEN 'blog'
  WHEN source_page = '/blog' THEN 'blog-index'
  WHEN source_page = '/top-sites' THEN 'top-sites'
  WHEN source_page IN ('/find-my-site', '/ask-ai') THEN 'tool'
  WHEN source_page IN ('/about', '/methodology', '/privacy-policy',
                       '/affiliate-disclosure', '/contact', '/terms',
                       '/2257', '/sitemap') THEN 'info'
  ELSE source_type  -- keep whatever was there if no rule matches
END
WHERE source_page IS NOT NULL
  AND (source_type IS NULL OR source_type = 'other');

-- Delete any leaked /admin clicks (admin paths should never be in the
-- conversion funnel; this catches anything that slipped through before
-- the client-side guard was in place).
DELETE FROM clicks WHERE source_page LIKE '/admin%';
DELETE FROM page_views WHERE path LIKE '/admin%';
DELETE FROM impressions WHERE source_page LIKE '/admin%';
