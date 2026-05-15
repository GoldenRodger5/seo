-- ───────────────────────────────────────────────────────────────────────────
-- Phase 3: Impressions + visitor IDs
-- ───────────────────────────────────────────────────────────────────────────
-- impressions:  logged each time an OutboundLink is mounted on a page.
--               Deduped client-side per (session, page, destination) tuple.
--               Enables CTR per destination = clicks ÷ impressions.
--
-- visitor_id:   localStorage UUID that survives across sessions. Lets us
--               distinguish "returning" from "new" visitors (session_id
--               rotates per browser session, visitor_id does not).
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS impressions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  source_page text,
  source_type text,
  destination_slug text,
  session_id text,
  visitor_id text,
  country text
);

CREATE INDEX IF NOT EXISTS idx_impressions_created_at ON impressions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impressions_destination_slug ON impressions(destination_slug);
CREATE INDEX IF NOT EXISTS idx_impressions_session ON impressions(session_id);

ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert impressions" ON impressions;
CREATE POLICY "anon insert impressions" ON impressions FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "admin select impressions" ON impressions;
CREATE POLICY "admin select impressions" ON impressions FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users)
  );

-- ── visitor_id columns ────────────────────────────────────────────────────
ALTER TABLE IF EXISTS page_views ADD COLUMN IF NOT EXISTS visitor_id text;
ALTER TABLE IF EXISTS clicks ADD COLUMN IF NOT EXISTS visitor_id text;

CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_clicks_visitor ON clicks(visitor_id);
