-- Booking rules are no longer editable in the admin. Fix them at:
-- 30 minute slots, 6 stations at once, 20 bookings per day.
alter table availability alter column slot_interval_minutes set default 30;
alter table availability alter column max_bookings_per_slot set default 6;
alter table availability alter column max_bookings_per_day  set default 20;

update availability set
  slot_interval_minutes = 30,
  max_bookings_per_slot = 6,
  max_bookings_per_day  = 20;
