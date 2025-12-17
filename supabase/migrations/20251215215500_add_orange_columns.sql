-- Add Orange count columns to match the application code
ALTER TABLE maintenance_entries 
ADD COLUMN IF NOT EXISTS orange_88_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS orange_113_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS orange_custom_box_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS orange_custom_count_per_box INTEGER DEFAULT 0;
