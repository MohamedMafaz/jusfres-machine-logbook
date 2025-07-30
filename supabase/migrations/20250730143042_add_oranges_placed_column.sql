-- Add oranges_placed column to maintenance_entries table
ALTER TABLE public.maintenance_entries 
ADD COLUMN oranges_placed INTEGER;
