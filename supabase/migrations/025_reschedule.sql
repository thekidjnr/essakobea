-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea: Rescheduling
-- Run in Supabase SQL Editor after 024_manual_bookings.sql
--
-- A booking can be moved to a new date and time without cancelling it, so it
-- keeps its payment, stylist and manage link.
--
--   reschedule_count       times the CLIENT moved it from their manage link.
--                          They get one; moves made by the salon don't count.
--   rescheduled_at         when it was last moved, by anyone
--   rescheduled_by         'client' or 'salon', for the last move
--   previous_booking_date  where it was before the last move, so the salon
--   previous_time_slot     can see "moved from Tue 3 Nov, 10:00 AM"
--
-- Only adds columns with defaults, so existing rows and every current flow
-- are unchanged.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS reschedule_count integer NOT NULL DEFAULT 0
    CHECK (reschedule_count >= 0),
  ADD COLUMN IF NOT EXISTS rescheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS rescheduled_by text
    CHECK (rescheduled_by IN ('client', 'salon')),
  ADD COLUMN IF NOT EXISTS previous_booking_date date,
  ADD COLUMN IF NOT EXISTS previous_time_slot text;

COMMIT;
