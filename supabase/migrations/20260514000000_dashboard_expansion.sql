-- ───────────────────────────────────────────────────────────────────────────
-- Dashboard expansion — Phase 2 schema fixes
-- ───────────────────────────────────────────────────────────────────────────
-- The /admin dashboard needs `subscribers.created_at` and `subscribers.source_page`
-- but the original `subscribers` table (created by an older migration) has
-- `subscribed_at` and `source` instead. The Phase 1 migration used CREATE TABLE
-- IF NOT EXISTS which is a no-op when the table already exists, so columns
-- weren't added.
--
-- This migration ensures the columns the dashboard queries against exist,
-- and backfills from legacy columns if present.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS subscribers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS subscribers ADD COLUMN IF NOT EXISTS source_page text;
ALTER TABLE IF EXISTS subscribers ADD COLUMN IF NOT EXISTS confirmed boolean DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscribers' AND column_name = 'subscribed_at'
  ) THEN
    UPDATE subscribers SET created_at = subscribed_at WHERE created_at IS NULL AND subscribed_at IS NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscribers' AND column_name = 'source'
  ) THEN
    UPDATE subscribers SET source_page = source WHERE source_page IS NULL AND source IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at DESC);
