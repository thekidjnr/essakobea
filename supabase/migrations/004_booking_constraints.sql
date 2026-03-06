-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Booking slot uniqueness + price_raw on booking options
-- Run in Supabase SQL Editor after 002_services_products.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Prevent double-booking: only one active (non-cancelled) booking per slot per day
CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_unique
  ON bookings (booking_date, time_slot)
  WHERE status NOT IN ('cancelled');

-- ─── Add price_raw (deposit amount) to existing seeded booking options ────────
-- price_raw = the online deposit in GHS cedis.
-- For fixed-price services, this is the full price.
-- For variable-price services, this is a reasonable deposit (usually the minimum).

UPDATE services SET booking_options = '[
  {"id":"frontal-wig","name":"Frontal Wig Making","price":"₵300","price_raw":300},
  {"id":"closure-mini","name":"Closure (5×5 / 6×6 / Mini Frontal)","price":"₵250","price_raw":250},
  {"id":"closure-standard","name":"Closure (4×4, 2×4, 2×6)","price":"₵200","price_raw":200},
  {"id":"express","name":"Express Service","price":"₵100 – ₵300","price_raw":100},
  {"id":"bleach","name":"Bleach Only","price":"₵100","price_raw":100},
  {"id":"plucking","name":"Plucking Only","price":"₵100 – ₵200","price_raw":100}
]'::jsonb WHERE slug = 'wig-making';

UPDATE services SET booking_options = '[
  {"id":"glueless-frontal","name":"Glueless Frontal","price":"₵250 – ₵450","price_raw":250},
  {"id":"closure-install","name":"Closure (2×6, 4×4, 5×5, 6×6)","price":"₵200 – ₵550","price_raw":200},
  {"id":"adhesive-frontal","name":"Adhesive Frontal","price":"₵300 – ₵600","price_raw":300},
  {"id":"revamp","name":"Revamp & Treatment","price":"From ₵200","price_raw":200},
  {"id":"wash","name":"Wash Only","price":"₵100 – ₵150","price_raw":100}
]'::jsonb WHERE slug = 'installations';

UPDATE services SET booking_options = '[
  {"id":"black","name":"Black / Jet Black","price":"₵400 – ₵750","price_raw":400},
  {"id":"blonde","name":"Simple Blonde Colors","price":"₵400 – ₵750","price_raw":400},
  {"id":"loud-colors","name":"Loud Colors (Red, Ginger etc.)","price":"₵400 – ₵750","price_raw":400},
  {"id":"highlights","name":"Highlights","price":"₵550 – ₵850","price_raw":550},
  {"id":"balayage","name":"Balayage with Highlights","price":"₵650 – ₵1000","price_raw":650}
]'::jsonb WHERE slug = 'coloring';

UPDATE services SET booking_options = '[
  {"id":"normal-ponytail-natural","name":"Normal Ponytail — Natural Hair","price":"₵200","price_raw":200},
  {"id":"normal-ponytail-relaxed","name":"Normal Ponytail — Relaxed Hair","price":"₵150","price_raw":150},
  {"id":"frontal-ponytail-natural","name":"Frontal Ponytail — Natural Hair","price":"₵450","price_raw":450},
  {"id":"frontal-ponytail-relaxed","name":"Frontal Ponytail — Relaxed Hair","price":"₵400","price_raw":400},
  {"id":"half-up-natural","name":"Half Up Half Down — Natural Hair","price":"₵270","price_raw":270},
  {"id":"half-up-relaxed","name":"Half Up Half Down — Relaxed Hair","price":"₵250","price_raw":250},
  {"id":"frontal-half-up-natural","name":"Frontal Half Up Half Down — Natural Hair","price":"₵500+","price_raw":500},
  {"id":"frontal-half-up-relaxed","name":"Frontal Half Up Half Down — Relaxed Hair","price":"₵450+","price_raw":450}
]'::jsonb WHERE slug = 'frontal-styling';
