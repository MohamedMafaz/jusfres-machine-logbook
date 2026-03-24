-- Consolidated migration for all Apple machine support fields
ALTER TABLE maintenance_entries 
-- Count fields
ADD COLUMN IF NOT EXISTS apple_88_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS apple_113_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS apple_custom_box_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS apple_custom_count_per_box INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS apples_placed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS apple_refill INTEGER DEFAULT 0,
-- Machine stat fields
ADD COLUMN IF NOT EXISTS apple_cup_availability REAL,
ADD COLUMN IF NOT EXISTS apple_lid_availability REAL,
ADD COLUMN IF NOT EXISTS apple_tasks_completed TEXT,
ADD COLUMN IF NOT EXISTS apple_issues_errors TEXT,
ADD COLUMN IF NOT EXISTS apple_temperature REAL,
ADD COLUMN IF NOT EXISTS apple_refrigerant_water_status TEXT,
ADD COLUMN IF NOT EXISTS apple_water_cleaning_status TEXT,
ADD COLUMN IF NOT EXISTS apple_filled_cleaning_water BOOLEAN,
ADD COLUMN IF NOT EXISTS apple_filled_refrigerant_water BOOLEAN;

-- Update existing columns to match new types (allowing decimal values for reels)
ALTER TABLE maintenance_entries 
ALTER COLUMN cup_availability TYPE REAL,
ALTER COLUMN lid_availability TYPE REAL;
