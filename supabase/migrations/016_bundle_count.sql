-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Bundle count on bookings
-- Run in Supabase SQL Editor after 015_refunds.sql
--
-- For services where clients bring their own extensions (Ponytails), the form
-- asks how many bundles they're bringing so the stylist can prepare. Info
-- only, it doesn't affect the price. hair_unit_type also gains the value
-- 'own_extensions' for these bookings (the column is plain text, no change).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS bundle_count SMALLINT CHECK (bundle_count BETWEEN 1 AND 6);
