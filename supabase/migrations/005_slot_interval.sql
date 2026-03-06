-- Add slot interval (minutes) to availability table
-- Controls whether booking time slots are 30 or 60 minutes apart
ALTER TABLE availability ADD COLUMN IF NOT EXISTS slot_interval_minutes INTEGER DEFAULT 60;
