-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Days off that stay open for one stylist
-- Run in Supabase SQL Editor after 026_client_socials.sql
--
-- A blocked date normally closes the whole salon. When `except_stylist_id` is
-- set, the date is closed for everyone EXCEPT that stylist, who stays bookable
-- (and "Any Available" stays closed).
-- ─────────────────────────────────────────────────────────────────────────────
alter table blocked_dates
  add column if not exists except_stylist_id uuid references stylists(id) on delete cascade;
