-- Add apple_refill column to maintenance_entries
ALTER TABLE maintenance_entries 
ADD COLUMN IF NOT EXISTS apple_refill INTEGER DEFAULT 0;
