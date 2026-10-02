-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Refund tracking on bookings
-- Run in Supabase SQL Editor after 014_drop_stylist_bio.sql
--
-- When a paid booking is cancelled we record how much of the payment is owed
-- back (refund_amount, pesewas). Whatever isn't refunded (a forfeited deposit)
-- is kept by the salon and counts toward earnings. payment_status flips to
-- 'refunded' once an admin marks the refund as sent.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS refund_amount    INTEGER     NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  ADD COLUMN IF NOT EXISTS refunded_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_reference TEXT;

-- Lock down storage uploads to the admin API (service role). Previously any
-- signed-in user could write to the public media bucket directly.
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;
