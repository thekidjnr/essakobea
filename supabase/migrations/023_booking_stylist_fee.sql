-- The fee a chosen stylist adds to a booking (negative for a discount), in
-- pesewas. Kept apart from the deposit so the salon and the client can see it
-- is charged on top of the service price, not taken off the balance.
alter table bookings add column if not exists stylist_fee integer not null default 0;
