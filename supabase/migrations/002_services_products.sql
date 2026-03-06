-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Services & Products
-- Run in Supabase SQL Editor after 001_initial.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Services
CREATE TABLE IF NOT EXISTS services (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT        NOT NULL UNIQUE,
  name           TEXT        NOT NULL,
  number         TEXT        NOT NULL DEFAULT '01',
  tagline        TEXT        NOT NULL DEFAULT '',
  description    TEXT        NOT NULL DEFAULT '',
  image_url      TEXT        NOT NULL DEFAULT '',
  image_position TEXT        NOT NULL DEFAULT 'object-center',
  flip           BOOLEAN     NOT NULL DEFAULT false,
  -- categories: detailed pricing for the services page
  -- shape: [{label, sublabel?, lengthBased?, lengths?, items: [{name, price?, prices?, note?}]}]
  categories     JSONB       NOT NULL DEFAULT '[]',
  -- booking_options: simplified for the booking flow
  -- shape: [{id, name, price}]
  booking_options JSONB      NOT NULL DEFAULT '[]',
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT        NOT NULL UNIQUE,
  name           TEXT        NOT NULL,
  category       TEXT        NOT NULL,
  category_label TEXT        NOT NULL,
  price_raw      INTEGER     NOT NULL DEFAULT 0,  -- GHS (whole cedis, not pesewas)
  length         TEXT,
  description    TEXT        NOT NULL DEFAULT '',
  image_url      TEXT        NOT NULL DEFAULT '',
  tag            TEXT,
  in_stock       BOOLEAN     NOT NULL DEFAULT true,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read services" ON services FOR SELECT TO anon USING (true);
CREATE POLICY "public read products" ON products FOR SELECT TO anon USING (true);

-- ─── Seed Services ────────────────────────────────────────────────────────────

INSERT INTO services (slug, name, number, tagline, description, image_url, image_position, flip, categories, booking_options, display_order) VALUES
(
  'wig-making', 'Wig Making', '01',
  'Built for you. Only you.',
  'Every unit we make starts with a consultation — your texture, your density, your aesthetic. We source quality hair and construct each wig by hand from cap construction to knot bleaching, plucking, and finish.',
  'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90',
  'object-top', false,
  '[
    {"label":"Wig Construction","items":[
      {"name":"Frontal Wig Making","price":"₵300"},
      {"name":"Closure (5×5 / 6×6 / Mini Frontal)","price":"₵250"},
      {"name":"Closure (4×4, 2×4, 2×6)","price":"₵200"},
      {"name":"Express Service","price":"₵100 – ₵300"},
      {"name":"Express Color","price":"₵200 – ₵500","note":"1–3 days"},
      {"name":"Bleach Only","price":"₵100"},
      {"name":"Plucking Only","price":"₵100 – ₵200","note":"Depends on fullness"}
    ]},
    {"label":"Styling Only","items":[
      {"name":"Straightening","price":"₵150 – ₵250"},
      {"name":"Curling","price":"₵150 – ₵250"},
      {"name":"Layering","price":"₵100 – ₵200"},
      {"name":"Crimping","price":"₵200 – ₵600"},
      {"name":"Fringe","price":"₵150"},
      {"name":"Wand Curls","price":"₵200 – ₵600"}
    ]}
  ]',
  '[
    {"id":"frontal-wig","name":"Frontal Wig Making","price":"₵300"},
    {"id":"closure-mini","name":"Closure (5×5 / 6×6 / Mini Frontal)","price":"₵250"},
    {"id":"closure-standard","name":"Closure (4×4, 2×4, 2×6)","price":"₵200"},
    {"id":"express","name":"Express Service","price":"₵100 – ₵300"},
    {"id":"bleach","name":"Bleach Only","price":"₵100"},
    {"id":"plucking","name":"Plucking Only","price":"₵100 – ₵200"}
  ]',
  0
),
(
  'installations', 'Installations', '02',
  'Seamless. Undetectable. Natural.',
  'A great unit deserves a great install. We use professional technique — proper lace melting, edge styling, and adhesive or glueless methods — for a finish that looks second-skin. We also offer full revamp and treatment for existing wigs.',
  'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90',
  'object-top', true,
  '[
    {"label":"Installation","items":[
      {"name":"Glueless Frontal","price":"₵250 – ₵450"},
      {"name":"Closure (2×6, 4×4, 5×5, 6×6)","price":"₵200 – ₵550"},
      {"name":"Adhesive Frontal","price":"₵300 – ₵600"}
    ]},
    {"label":"Revamp Service","items":[
      {"name":"Wash Only","price":"₵100 – ₵150"},
      {"name":"Revamp & Treatment","price":"From ₵200","note":"Deep cleanse, restyle & treatment"}
    ]}
  ]',
  '[
    {"id":"glueless-frontal","name":"Glueless Frontal","price":"₵250 – ₵450"},
    {"id":"closure-install","name":"Closure (2×6, 4×4, 5×5, 6×6)","price":"₵200 – ₵550"},
    {"id":"adhesive-frontal","name":"Adhesive Frontal","price":"₵300 – ₵600"},
    {"id":"revamp","name":"Revamp & Treatment","price":"From ₵200"},
    {"id":"wash","name":"Wash Only","price":"₵100 – ₵150"}
  ]',
  1
),
(
  'coloring', 'Coloring', '03',
  'Rich. Dimensional. Lasting.',
  'From classic black to vibrant statement colours — our coloring service is tailored to your wig''s hair type, length, and density. All pricing is by inch range to keep it simple and transparent.',
  'https://images.pexels.com/photos/2876486/pexels-photo-2876486.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90',
  'object-center', false,
  '[
    {"label":"Color by Length","sublabel":"Prices apply across all color types below","lengthBased":true,"lengths":["10–16 inch","18–24 inch","26–30 inch"],"items":[
      {"name":"Black / Jet Black","prices":["₵400–550","₵550–650","₵650–750"]},
      {"name":"Simple Blonde Colors","prices":["₵400–550","₵550–650","₵650–750"]},
      {"name":"Black to Loud Colors (Red, Ginger etc.)","prices":["₵400–550","₵550–650","₵650–750"]},
      {"name":"Highlights","prices":["₵550–650","₵650–750","₵750–850"]},
      {"name":"Balayage with Highlights","prices":["₵650–800","₵800–850","₵850–1000"]}
    ]}
  ]',
  '[
    {"id":"black","name":"Black / Jet Black","price":"₵400 – ₵750"},
    {"id":"blonde","name":"Simple Blonde Colors","price":"₵400 – ₵750"},
    {"id":"loud-colors","name":"Loud Colors (Red, Ginger etc.)","price":"₵400 – ₵750"},
    {"id":"highlights","name":"Highlights","price":"₵550 – ₵850"},
    {"id":"balayage","name":"Balayage with Highlights","price":"₵650 – ₵1000"}
  ]',
  2
),
(
  'frontal-styling', 'Frontal Styling', '04',
  'Versatile. Elevated. Effortless.',
  'Ponytails, half-up-half-down, and frontal styles — done right on both natural and relaxed hair. Quick turnaround, clean finish, every time.',
  'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1200&q=90',
  'object-center', true,
  '[
    {"label":"Ponytails","items":[
      {"name":"Normal Ponytail — Natural Hair (no extensions)","price":"₵200"},
      {"name":"Normal Ponytail — Relaxed Hair (no extensions)","price":"₵150"},
      {"name":"Frontal Ponytail — Natural Hair","price":"₵450"},
      {"name":"Frontal Ponytail — Relaxed Hair","price":"₵400"}
    ]},
    {"label":"Half Up / Half Down","items":[
      {"name":"Half Up Half Down — Natural Hair","price":"₵270"},
      {"name":"Half Up Half Down — Relaxed Hair","price":"₵250"},
      {"name":"Frontal Half Up Half Down — Natural Hair","price":"₵500+"},
      {"name":"Frontal Half Up Half Down — Relaxed Hair","price":"₵450+"}
    ]}
  ]',
  '[
    {"id":"normal-ponytail-natural","name":"Normal Ponytail — Natural Hair","price":"₵200"},
    {"id":"normal-ponytail-relaxed","name":"Normal Ponytail — Relaxed Hair","price":"₵150"},
    {"id":"frontal-ponytail-natural","name":"Frontal Ponytail — Natural Hair","price":"₵450"},
    {"id":"frontal-ponytail-relaxed","name":"Frontal Ponytail — Relaxed Hair","price":"₵400"},
    {"id":"half-up-natural","name":"Half Up Half Down — Natural Hair","price":"₵270"},
    {"id":"half-up-relaxed","name":"Half Up Half Down — Relaxed Hair","price":"₵250"},
    {"id":"frontal-half-up-natural","name":"Frontal Half Up Half Down — Natural Hair","price":"₵500+"},
    {"id":"frontal-half-up-relaxed","name":"Frontal Half Up Half Down — Relaxed Hair","price":"₵450+"}
  ]',
  3
)
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed Products ────────────────────────────────────────────────────────────

INSERT INTO products (slug, name, category, category_label, price_raw, length, description, image_url, tag, in_stock, display_order) VALUES
('obsidian-lace',   'The Obsidian',       'lace-front', 'Lace Front',    1200, '22 inch', 'Jet black, straight, silky texture. Natural hairline, pre-plucked.', 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=800&q=85',  'Bestseller', true, 0),
('silk-press-unit', 'The Silk Press',     'lace-front', 'Lace Front',    1400, '26 inch', 'Blown-out silk press finish. Long, voluminous, and flawless.',        'https://images.pexels.com/photos/2065195/pexels-photo-2065195.jpeg?auto=compress&cs=tinysrgb&w=800&q=85',  NULL,         true, 1),
('chestnut-bob',    'The Chestnut Bob',   'lace-front', 'Lace Front',     800, '10 inch', 'Classic bob cut, chestnut brown. Clean lines, bold presence.',        'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=800&q=85',  'New',        true, 2),
('midnight-wave',   'The Midnight Wave',  'lace-front', 'Lace Front',    1100, '20 inch', 'Deep body wave, natural black. Movement, dimension, and depth.',       'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&q=85&cs=tinysrgb&w=800',   NULL,         true, 3),
('ginger-goddess',  'The Ginger Goddess', 'full-lace',  'Full Lace',     1800, '24 inch', 'Rich ginger auburn, full lace construction. Wear it up, wear it down — anywhere.', 'https://images.pexels.com/photos/2876486/pexels-photo-2876486.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', 'New', true, 4),
('golden-hour',     'The Golden Hour',    'full-lace',  'Full Lace',     1650, '22 inch', 'Honey blonde, full lace. Catches the light exactly the way it should.', 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', 'Bestseller', true, 5),
('deep-curl-queen', 'The Deep Curl',      'full-lace',  'Full Lace',     1900, '20 inch', 'Defined deep curls, full lace. Bouncy, moisturised texture right out of the box.', 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', NULL, true, 6),
('natural-wave',    'The Natural Wave',   'closure',    'Closure Unit',   750, '16 inch', 'Natural texture body wave. 4×4 closure, soft density, everyday-ready.', 'https://images.pexels.com/photos/3765114/pexels-photo-3765114.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', NULL, true, 7),
('classic-straight','The Classic',        'closure',    'Closure Unit',   680, '18 inch', 'Jet black, bone straight. 5×5 closure. The everyday essential.',        'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', 'Bestseller', true, 8),
('edge-control-kit','Edge Control Kit',   'accessories','Accessories',     80, NULL,      'Long-hold edge control. No flaking, no white cast — clean finish every time.', 'https://images.pexels.com/photos/5069432/pexels-photo-5069432.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', NULL, true, 9),
('wig-grip-band',   'Wig Grip Band',      'accessories','Accessories',     60, NULL,      'Velvet grip band. Keeps your unit secure all day — no glue needed.',    'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', NULL, true, 10),
('lace-tint-spray', 'Lace Tint Spray',    'accessories','Accessories',    120, NULL,      'Tints transparent lace to match your skin tone in seconds.',           'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', 'New', true, 11),
('maintenance-kit', 'Wig Maintenance Kit','accessories','Accessories',    350, NULL,      'Everything you need to keep your unit fresh — shampoo, conditioner, detangler & stand.', 'https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=800&q=85', NULL, true, 12)
ON CONFLICT (slug) DO NOTHING;
