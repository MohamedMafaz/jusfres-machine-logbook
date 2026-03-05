-- Add new columns for Apple machine specific statistics
ALTER TABLE maintenance_entries 
ADD COLUMN IF NOT EXISTS apple_cup_availability REAL,
ADD COLUMN IF NOT EXISTS apple_lid_availability REAL,
ADD COLUMN IF NOT EXISTS apple_tasks_completed TEXT,
ADD COLUMN IF NOT EXISTS apple_issues_errors TEXT,
ADD COLUMN IF NOT EXISTS apple_temperature REAL,
ADD COLUMN IF NOT EXISTS apple_refrigerant_water_status TEXT,
ADD COLUMN IF NOT EXISTS apple_water_cleaning_status TEXT,
ADD COLUMN IF NOT EXISTS apple_filled_cleaning_water BOOLEAN,
ADD COLUMN IF NOT EXISTS apple_filled_refrigerant_water BOOLEAN;
