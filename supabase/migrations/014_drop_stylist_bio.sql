-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Drop stylists.bio (roster simplified to name + title only)
-- Run in Supabase SQL Editor after 013_seed_stylists.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE stylists DROP COLUMN IF EXISTS bio;
