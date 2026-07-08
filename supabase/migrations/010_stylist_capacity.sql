-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Per-stylist daily capacity + per-stylist slot uniqueness
-- Run in Supabase SQL Editor after 009_customization_and_emergency.sql
--
-- Reverses the booking flow to Stylist -> Schedule: each stylist can now hold
-- one booking per exact time slot (previously the whole salon could only take
-- ONE booking per slot, regardless of stylist), and each stylist caps out at
-- their own `daily_capacity` appointments per day.
--
-- NOTE: run this only after the `bookings` table has been cleared of rows
-- with stylist_id = null (they would violate the new unique index, since two
-- null stylist_id rows at the same slot are not caught by a unique index).
-- ─────────────────────────────────────────────────────────────────────────────

-- Max appointments this stylist can take in a single day, across all slots.
-- NULL = unlimited.
alter table stylists
  add column if not exists daily_capacity integer;

-- Drop the old salon-wide slot lock...
drop index if exists bookings_active_slot_unique;

-- ...replace with a per-stylist slot lock: a stylist can only hold one active
-- booking at a given date + time slot, but different stylists can each hold
-- their own booking at the same date + time slot.
create unique index if not exists bookings_active_stylist_slot_unique
  on bookings (booking_date, time_slot, stylist_id)
  where status not in ('cancelled');

-- `max_bookings_per_slot` used to be the ONLY gate (salon-wide, defaulted to
-- 1), which would otherwise still block multiple stylists from each taking a
-- client at the same time slot. It now represents physical station capacity
-- (how many clients the salon can seat at once) layered on top of each
-- stylist's own capacity, so raise it well above 1 by default.
update availability set max_bookings_per_slot = 10 where max_bookings_per_slot = 1;
