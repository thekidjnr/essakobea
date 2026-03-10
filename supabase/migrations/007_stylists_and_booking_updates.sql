-- ─── Stylists ──────────────────────────────────────────────────────────────────
create table if not exists stylists (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  title          text not null default 'Stylist',
  bio            text,
  photo_url      text,
  fee_adjustment integer not null default 0,  -- extra GHS cedis added to deposit
  is_available   boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

alter table stylists enable row level security;

create policy "Public can read stylists"
  on stylists for select using (true);

create policy "Service role full access on stylists"
  on stylists for all using (true) with check (true);

-- ─── Booking additions ─────────────────────────────────────────────────────────
alter table bookings
  add column if not exists stylist_id    uuid references stylists(id) on delete set null,
  add column if not exists stylist_name  text,
  add column if not exists hair_unit_type text,    -- 'own_new' | 'own_existing' | 'none'
  add column if not exists unit_photos   text[] default '{}';
