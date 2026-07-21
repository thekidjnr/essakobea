-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Drop services.tagline (superseded by description)
-- Run in Supabase SQL Editor after 011_payouts.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE services DROP COLUMN IF EXISTS tagline;
