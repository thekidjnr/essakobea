-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Appointment durations
-- Run in Supabase SQL Editor after 020_sew_in.sql
--
-- Bookings used to lock a stylist for a single start time only, so a stylist
-- with a 4 hour install at 10:00 could still be booked at 11:00. Each booking
-- option now has a duration_minutes (edited in the admin), and each booking
-- stores the duration it was made with, so a stylist is busy from the start
-- until start + duration. The overlap checks live in lib/booking-duration.ts.
--
-- Durations below are rough defaults for the salon to adjust in the admin.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Give every option without a duration a default: 1 hour for quick add-ons
-- (wash, bleach, plucking), otherwise by service. Same numbers as
-- SERVICE_DEFAULT_MINUTES in lib/booking-duration.ts.
UPDATE services SET booking_options = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN o ? 'duration_minutes' THEN o
      ELSE o || jsonb_build_object('duration_minutes',
        CASE
          WHEN o->>'name' ~* '(wash|bleach|pluck)' THEN 60
          WHEN slug = 'installations'     THEN 180
          WHEN slug = 'wig-making'        THEN 240
          WHEN slug = 'coloring'          THEN 240
          WHEN slug = 'regular-ponytails' THEN 120
          WHEN slug = 'frontal-ponytails' THEN 180
          WHEN slug = 'sew-in'            THEN 240
          ELSE 120
        END)
    END
    ORDER BY n
  ), '[]'::jsonb)
  FROM jsonb_array_elements(booking_options) WITH ORDINALITY AS x(o, n)
);

-- Upcoming bookings take their option's duration (matched by name, since
-- bookings store the option name, not its id) so they block the right hours.
UPDATE bookings b SET duration_minutes = (
  SELECT (o->>'duration_minutes')::int
  FROM services s, jsonb_array_elements(s.booking_options) o
  WHERE s.slug = b.service_id AND o->>'name' = b.treatment
  LIMIT 1
)
WHERE b.duration_minutes IS NULL
  AND b.booking_date >= CURRENT_DATE
  AND b.status IN ('pending', 'confirmed');

COMMIT;
