-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Seed initial stylist roster
-- Run in Supabase SQL Editor after 012_drop_tagline.sql
--
-- Christina Bile Meizan (manager / complaints) is intentionally not included
-- here since she is not a bookable stylist.
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove the placeholder test entry.
delete from stylists where name = 'Akua' and title = 'Stylist';

insert into stylists (name, title, is_available, display_order)
values
  ('Chioma Uche',        'Sew-in Specialist',              true, 1),
  ('Nugbemado Mercy',    'Wig Specialist & Bridal Stylist',true, 2),
  ('Julia Konadu Boadu', 'Lead Wig Specialist',            true, 3),
  ('Nura Abdul Karim',   'Wig Specialist',                 true, 4),
  ('Elizabeth Dorgu',    'Revamp & Styling Specialist',    true, 5)
on conflict do nothing;
