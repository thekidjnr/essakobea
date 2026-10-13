-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Manual bookings and home service
-- Run in Supabase SQL Editor after 023_booking_stylist_fee.sql
--
-- The salon can now add bookings from the admin: walk-ins, WhatsApp bookings,
-- clients who pay cash, MoMo or bank transfer, and home service visits. They
-- sit in the same table as online bookings so they block the stylist's time
-- and count in Finance.
--
--   source          'online' (booking form + Paystack) or 'manual' (admin)
--   payment_method  how the money came in. Null on online bookings, which
--                   are always Paystack, and on manual ones not yet paid.
--   location_type   'salon' or 'home'
--   home_address    where the stylist goes, for home service
--   travel_fee      pesewas, agreed with the client, part of total_price
--   total_price     pesewas, the full agreed price of a manual booking.
--                   amount stays "paid so far", so total_price - amount is
--                   the balance still to collect.
--
-- Only adds columns with defaults, so existing rows and the online booking
-- flow are unchanged.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'online'
    CHECK (source IN ('online', 'manual')),
  ADD COLUMN IF NOT EXISTS payment_method text
    CHECK (payment_method IN ('paystack', 'cash', 'momo', 'bank_transfer', 'card', 'other')),
  ADD COLUMN IF NOT EXISTS location_type text NOT NULL DEFAULT 'salon'
    CHECK (location_type IN ('salon', 'home')),
  ADD COLUMN IF NOT EXISTS home_address text,
  ADD COLUMN IF NOT EXISTS travel_fee integer NOT NULL DEFAULT 0
    CHECK (travel_fee >= 0),
  ADD COLUMN IF NOT EXISTS total_price integer
    CHECK (total_price >= 0);

COMMIT;
