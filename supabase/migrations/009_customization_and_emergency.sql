-- ─── Customization type, emergency bookings, and fee breakdown ─────────────────
alter table bookings
  add column if not exists customization_type  text,            -- 'standard' | 'express' | null
  add column if not exists is_emergency        boolean not null default false,
  add column if not exists customization_fee   integer not null default 0,  -- in pesewas
  add column if not exists emergency_fee       integer not null default 0,  -- in pesewas
  add column if not exists service_charge      integer not null default 0;  -- in pesewas (5% platform fee)
