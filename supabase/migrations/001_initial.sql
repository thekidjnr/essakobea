-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Initial Schema
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_name      TEXT        NOT NULL,
  client_email     TEXT        NOT NULL,
  client_phone     TEXT        NOT NULL,
  service_id       TEXT        NOT NULL,
  service_name     TEXT        NOT NULL,
  treatment        TEXT        NOT NULL,
  booking_date     DATE        NOT NULL,
  time_slot        TEXT        NOT NULL,
  notes            TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','cancelled','completed')),
  payment_status   TEXT        NOT NULL DEFAULT 'unpaid'
                   CHECK (payment_status IN ('unpaid','paid','refunded')),
  payment_reference TEXT,
  amount           INTEGER     NOT NULL DEFAULT 0, -- GHS pesewas (GHS × 100)
  cancellation_reason TEXT,
  cancelled_at     TIMESTAMPTZ,
  cancel_token     TEXT        UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex')
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_name      TEXT        NOT NULL,
  client_email     TEXT        NOT NULL,
  client_phone     TEXT        NOT NULL,
  items            JSONB       NOT NULL DEFAULT '[]',
  subtotal         INTEGER     NOT NULL DEFAULT 0,
  total            INTEGER     NOT NULL DEFAULT 0,
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  payment_status   TEXT        NOT NULL DEFAULT 'unpaid'
                   CHECK (payment_status IN ('unpaid','paid')),
  payment_reference TEXT,
  delivery_method  TEXT        NOT NULL DEFAULT 'pickup'
                   CHECK (delivery_method IN ('pickup','delivery')),
  delivery_address TEXT,
  notes            TEXT
);

-- Blocked dates (admin sets these)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE        NOT NULL UNIQUE,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Working hours per day of week
CREATE TABLE IF NOT EXISTS availability (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week  INTEGER NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  is_available BOOLEAN NOT NULL DEFAULT true,
  open_time    TEXT    NOT NULL DEFAULT '09:00',
  close_time   TEXT    NOT NULL DEFAULT '18:00'
);

-- Product stock overrides
CREATE TABLE IF NOT EXISTS product_stock (
  product_id TEXT    PRIMARY KEY,
  in_stock   BOOLEAN NOT NULL DEFAULT true
);

-- Seed default availability (Sun closed, Mon–Fri 9–6, Sat 9–4)
INSERT INTO availability (day_of_week, is_available, open_time, close_time) VALUES
  (0, false, '09:00', '18:00'),
  (1, true,  '09:00', '18:00'),
  (2, true,  '09:00', '18:00'),
  (3, true,  '09:00', '18:00'),
  (4, true,  '09:00', '18:00'),
  (5, true,  '09:00', '18:00'),
  (6, true,  '09:00', '16:00')
ON CONFLICT (day_of_week) DO NOTHING;

-- RLS (all access via service_role key in API routes — bypasses RLS)
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;

-- Allow public to read availability + blocked_dates (for booking calendar)
CREATE POLICY "public read availability"   ON availability   FOR SELECT TO anon USING (true);
CREATE POLICY "public read blocked_dates"  ON blocked_dates  FOR SELECT TO anon USING (true);
CREATE POLICY "public read product_stock"  ON product_stock  FOR SELECT TO anon USING (true);
