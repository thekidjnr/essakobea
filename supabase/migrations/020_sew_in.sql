-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Sew-in service
-- Run in Supabase SQL Editor after 019_inspo_photos.sql
--
-- Adds a sew-in service after Frontal Ponytails. Prices, deposits and the
-- photo are placeholders (the photo is borrowed from Installations); update
-- them in the admin once they're final. Clients bring their own bundles, so
-- it uses the extensions flow keyed by slug in lib/service-rules.ts.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO services (
  slug, name, number, tagline, description, image_url, image_position, flip,
  categories, booking_options, is_active, display_order
)
SELECT
  'sew-in',
  'SEW-IN',
  '06',
  'Secure. Natural. Long-lasting.',
  'Bundles sewn onto a neat braided base for a full, natural look that protects your own hair.',
  (SELECT image_url FROM services WHERE slug = 'installations'),
  'object-center',
  true,
  '[
    {"label":"Sew-in","items":[
      {"name":"Traditional Sew-in (Middle Part)","price":"₵500"},
      {"name":"Side Part Sew-in","price":"₵500"},
      {"name":"Versatile Sew-in","price":"₵600"},
      {"name":"Closure Sew-in","price":"₵600"},
      {"name":"Frontal Sew-in","price":"₵700"},
      {"name":"Closure Behind Hairline","price":"₵650"},
      {"name":"Flip Over Sew-in","price":"₵600"}
    ]}
  ]'::jsonb,
  '[
    {"id":"traditional-sew-in-middle-part","name":"Traditional Sew-in (Middle Part)","note":"A classic sew-in with a clean middle part.","price":"₵500-800","price_raw":200},
    {"id":"side-part-sew-in","name":"Side Part Sew-in","note":"A classic sew-in with a soft side part.","price":"₵500-800","price_raw":200},
    {"id":"versatile-sew-in","name":"Versatile Sew-in","note":"Leave-out at the front and sides so you can wear it up or down.","price":"₵600-900","price_raw":200},
    {"id":"closure-sew-in","name":"Closure Sew-in","note":"Bundles finished with a closure, no leave-out needed.","price":"₵600-900","price_raw":200},
    {"id":"frontal-sew-in","name":"Frontal Sew-in","note":"Bundles finished with a frontal for a full, natural hairline.","price":"₵700-1000","price_raw":250},
    {"id":"closure-behind-hairline","name":"Closure Behind Hairline","note":"A closure set behind your natural hairline for a seamless blend.","price":"₵650-950","price_raw":250},
    {"id":"flip-over-sew-in","name":"Flip Over Sew-in","note":"Braided so the hair can be flipped and parted in any direction.","price":"₵600-900","price_raw":200}
  ]'::jsonb,
  true,
  COALESCE((SELECT MAX(display_order) + 1 FROM services), 0)
ON CONFLICT (slug) DO NOTHING;
