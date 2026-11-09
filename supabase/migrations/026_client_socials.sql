-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea: Client socials
-- Run in Supabase SQL Editor after 025_reschedule.sql
--
-- Clients can optionally leave their Instagram and TikTok handles when they
-- book, so the stylists can see their page. Stored as bare handles with no
-- "@" or URL. Nullable, so existing rows and every current flow are unchanged.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS client_instagram text,
  ADD COLUMN IF NOT EXISTS client_tiktok text;

COMMIT;
