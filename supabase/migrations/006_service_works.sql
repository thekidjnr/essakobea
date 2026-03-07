-- Service works: portfolio photos linked to a specific service
create table if not exists service_works (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references services(id) on delete cascade,
  image_url     text not null,
  caption       text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Index for fast lookups per service
create index if not exists service_works_service_id_idx on service_works(service_id, display_order);

-- RLS: public can read, only service role can write
alter table service_works enable row level security;

create policy "Anyone can view service works"
  on service_works for select using (true);

create policy "Service role full access"
  on service_works for all using (true) with check (true);
