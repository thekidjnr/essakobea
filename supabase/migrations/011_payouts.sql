-- ─────────────────────────────────────────────────────────────────────────────
-- Essakobea — Payouts (withdrawal requests)
-- Run in Supabase SQL Editor after 010_stylist_capacity.sql
--
-- Paystack settles into an account we control, not essakobea's own. This
-- tracks essakobea's requests to withdraw from their earned balance.
-- "Earned balance" itself is NOT stored here — it's computed at query time
-- from completed bookings/orders minus payouts already paid (completed, not
-- just paid, so a later refund/cancellation can't be withdrawn against). The
-- app layer must validate requested_amount against that computed balance
-- before inserting — there's no DB constraint enforcing it here.
-- ─────────────────────────────────────────────────────────────────────────────

-- Essakobea withdraws to one account. Single row, enforced by the `singleton`
-- unique-true trick below — a second INSERT will always violate the unique
-- index. Update this row in place if the account ever changes.
CREATE TABLE IF NOT EXISTS payout_account (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  singleton      BOOLEAN     NOT NULL DEFAULT TRUE UNIQUE CHECK (singleton),
  method         TEXT        NOT NULL CHECK (method IN ('momo','bank')),
  account_name   TEXT        NOT NULL,
  momo_number    TEXT,
  momo_network   TEXT,       -- 'mtn' | 'vodafone' | 'airteltigo'
  bank_name      TEXT,
  account_number TEXT
);

CREATE TABLE IF NOT EXISTS payouts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_amount  INTEGER     NOT NULL CHECK (requested_amount > 0), -- GHS pesewas (GHS × 100)
  status            TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','paid','rejected')),
  destination       JSONB       NOT NULL, -- snapshot of payout_account at request time, so edits to the account later don't rewrite history
  requested_by      TEXT,       -- who submitted the request, since admin login is shared
  notes             TEXT,       -- requester's note
  admin_notes       TEXT,       -- internal note when approving/rejecting/paying
  payout_reference  TEXT,       -- transfer receipt / MoMo txn id once paid
  approved_at       TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  rejected_reason   TEXT
);

CREATE INDEX IF NOT EXISTS payouts_status_idx ON payouts (status);

-- RLS (all access via service_role key in API routes — bypasses RLS, same
-- as bookings/orders: no anon policies, so these tables are invisible to the
-- public API by default)
ALTER TABLE payout_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts        ENABLE ROW LEVEL SECURITY;
