-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Inspo photos on bookings
-- Run in Supabase SQL Editor after 018_split_ponytails.sql
--
-- Coloring asks for two uploads: the client's unit (unit_photos) and the
-- color they'd like (inspo_photos). The bookings API only sends inspo_photos
-- for coloring, so other bookings work before this has run.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS inspo_photos text[] NOT NULL DEFAULT '{}';
