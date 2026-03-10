-- Add per-slot and per-day booking capacity limits to availability schedule
alter table availability
  add column if not exists max_bookings_per_slot integer not null default 1,
  add column if not exists max_bookings_per_day  integer not null default 0;  -- 0 = unlimited
