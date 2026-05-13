-- ───────────────────────────────────────────────────────────────────────────
-- Analytics + admin schema
-- ───────────────────────────────────────────────────────────────────────────
-- This migration adds the tables that back the /admin dashboard:
--   • Expanded clicks columns (the existing table has a sparse schema)
--   • New page_views table for traffic logging
--   • New admin_users allowlist for /admin route protection
--   • Verifies subscribers + contact_submissions exist (creates if missing)
--
-- RLS pattern:
--   • clicks + page_views: INSERT-only for anon (logging),
--     SELECT-only for authenticated users in admin_users allowlist
--   • subscribers + contact_submissions: same pattern
--   • admin_users: SELECT-only for the user matching their own email
--
-- Apply via: supabase db push OR paste into Supabase SQL Editor.
-- ───────────────────────────────────────────────────────────────────────────

-- ── Expand existing clicks table ──────────────────────────────────────────
-- The current `clicks` table has (id, site_slug, referrer_page, clicked_at).
-- Add the columns the new tracking module needs. Existing rows get nulls
-- for the new columns — fine for backward compatibility.
ALTER TABLE IF EXISTS clicks
  ADD COLUMN IF NOT EXISTS source_page text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS destination_slug text,
  ADD COLUMN IF NOT EXISTS destination_url text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS session_id text;

-- If the table doesn't exist yet (first time setup), create with full shape.
CREATE TABLE IF NOT EXISTS clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  source_page text,
  source_type text,
  destination_slug text,
  destination_url text,
  referrer text,
  country text,
  session_id text,
  -- legacy columns retained for backward compatibility with existing rows
  site_slug text,
  referrer_page text,
  clicked_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_destination_slug ON clicks(destination_slug);
CREATE INDEX IF NOT EXISTS idx_clicks_source_page ON clicks(source_page);

ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert clicks" ON clicks;
CREATE POLICY "anon insert clicks" ON clicks FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "admin select clicks" ON clicks;
CREATE POLICY "admin select clicks" ON clicks FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users)
  );

-- ── New page_views table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  path text NOT NULL,
  page_type text,
  referrer text,
  country text,
  session_id text
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert page_views" ON page_views;
CREATE POLICY "anon insert page_views" ON page_views FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "admin select page_views" ON page_views;
CREATE POLICY "admin select page_views" ON page_views FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users)
  );

-- ── subscribers (ensure exists) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  email text NOT NULL,
  source_page text,
  confirmed boolean DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(lower(email));

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert subscribers" ON subscribers;
CREATE POLICY "anon insert subscribers" ON subscribers FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "admin select subscribers" ON subscribers;
CREATE POLICY "admin select subscribers" ON subscribers FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users)
  );

-- ── contact_submissions (ensure exists) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  ip_hash text
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon insert contact_submissions" ON contact_submissions;
CREATE POLICY "anon insert contact_submissions" ON contact_submissions FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "admin select contact_submissions" ON contact_submissions;
CREATE POLICY "admin select contact_submissions" ON contact_submissions FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_users)
  );

-- ── admin_users — allowlist for /admin access ─────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Each authenticated user can read their own admin_users row (used by the
-- RequireAdmin client guard to verify allowlist membership). No anon access.
DROP POLICY IF EXISTS "user reads own admin_users row" ON admin_users;
CREATE POLICY "user reads own admin_users row" ON admin_users FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- ── Seed the single admin ─────────────────────────────────────────────────
INSERT INTO admin_users (email)
VALUES ('isaac.m.builds@gmail.com')
ON CONFLICT (email) DO NOTHING;
