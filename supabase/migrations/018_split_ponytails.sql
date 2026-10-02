-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Split Ponytails into Regular Ponytails and Frontal Ponytails
-- Run in Supabase SQL Editor after 017_rename_ponytails_slug.sql
--
-- Every option whose name starts with "Frontal" moves to a new
-- frontal-ponytails service, which gets the hair unit flow (new / existing /
-- just the service, then Standard or Express). The rest stay on the old row,
-- renamed to regular-ponytails, which keeps the extensions flow. Both flows
-- are keyed by slug in lib/service-rules.ts. Bookings store the slug in
-- service_id, so they're updated too. Old /works/ponytails and
-- /book?service=ponytails links are redirected in next.config.ts.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

INSERT INTO services (
  slug, name, number, tagline, description, image_url, image_position, flip,
  categories, booking_options, is_active, display_order
)
SELECT
  'frontal-ponytails',
  'FRONTAL PONYTAILS',
  '05',
  tagline,
  'Frontal ponytails and half-up-half-down styles with a clean, natural hairline, on natural or relaxed hair.',
  image_url,
  image_position,
  NOT flip,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_set(c, '{items}', (
        SELECT jsonb_agg(i ORDER BY n)
        FROM jsonb_array_elements(c->'items') WITH ORDINALITY AS x(i, n)
        WHERE i->>'name' ILIKE 'frontal%'
      ))
      ORDER BY cn
    )
    FROM jsonb_array_elements(categories) WITH ORDINALITY AS y(c, cn)
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements(c->'items') i WHERE i->>'name' ILIKE 'frontal%'
    )
  ), '[]'::jsonb),
  COALESCE((
    SELECT jsonb_agg(o ORDER BY n)
    FROM jsonb_array_elements(booking_options) WITH ORDINALITY AS z(o, n)
    WHERE o->>'name' ILIKE 'frontal%'
  ), '[]'::jsonb),
  is_active,
  display_order + 1
FROM services
WHERE slug = 'ponytails'
ON CONFLICT (slug) DO NOTHING;

UPDATE services SET
  slug        = 'regular-ponytails',
  name        = 'REGULAR PONYTAILS',
  description = 'Ponytails and half-up-half-down styles, done right on both natural and relaxed hair.',
  categories  = COALESCE((
    SELECT jsonb_agg(
      jsonb_set(c, '{items}', (
        SELECT jsonb_agg(i ORDER BY n)
        FROM jsonb_array_elements(c->'items') WITH ORDINALITY AS x(i, n)
        WHERE i->>'name' NOT ILIKE 'frontal%'
      ))
      ORDER BY cn
    )
    FROM jsonb_array_elements(categories) WITH ORDINALITY AS y(c, cn)
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements(c->'items') i WHERE i->>'name' NOT ILIKE 'frontal%'
    )
  ), '[]'::jsonb),
  booking_options = COALESCE((
    SELECT jsonb_agg(o ORDER BY n)
    FROM jsonb_array_elements(booking_options) WITH ORDINALITY AS z(o, n)
    WHERE o->>'name' NOT ILIKE 'frontal%'
  ), '[]'::jsonb)
WHERE slug = 'ponytails';

UPDATE bookings SET service_id = 'regular-ponytails' WHERE service_id = 'ponytails';

COMMIT;
