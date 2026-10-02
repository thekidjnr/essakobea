-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Rename the Ponytails service slug
-- Run in Supabase SQL Editor after 016_bundle_count.sql
--
-- The service was first called "Frontal Styling" and kept that slug after
-- being renamed to Ponytails. Bookings store the slug in service_id (text,
-- no foreign key), so they're updated too. service_works links by uuid and
-- needs no change. Old /works/frontal-styling and /book?service=frontal-styling
-- links are redirected in next.config.ts.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

UPDATE services SET slug = 'ponytails' WHERE slug = 'frontal-styling';
UPDATE bookings SET service_id = 'ponytails' WHERE service_id = 'frontal-styling';

COMMIT;
 