-- Create maintenance entries table
CREATE TABLE public.maintenance_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User and tracking
  filled_by TEXT NOT NULL,
  date_of_entry DATE NOT NULL DEFAULT CURRENT_DATE,
  current_step INTEGER NOT NULL DEFAULT 1,
  step1_completed BOOLEAN DEFAULT FALSE,
  step2_completed BOOLEAN DEFAULT FALSE,
  step3_completed BOOLEAN DEFAULT FALSE,
  
  -- Step 1: Start Details
  start_location TEXT,
  start_time TIME,
  odometer_start INTEGER,
  battery_start INTEGER,
  items_carried TEXT,
  
  -- Step 2: End Details  
  end_location TEXT,
  end_time TIME,
  odometer_end INTEGER,
  battery_end INTEGER,
  
  -- Step 3: Machine Stats
  cup_availability INTEGER,
  lid_availability INTEGER,
  tasks_completed TEXT,
  issues_errors TEXT,
  orange_refill INTEGER,
  temperature DECIMAL(5,2),
  distance DECIMAL(8,2),
  duration_minutes INTEGER,
  time_spent_machine INTEGER,
  boxes_88 INTEGER,
  boxes_113 INTEGER,
  boxes_custom INTEGER,
  water_cleaning_status TEXT,
  refrigerant_water_status TEXT,
  filled_cleaning_water BOOLEAN,
  filled_refrigerant_water BOOLEAN,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  step1_completed_at TIMESTAMP WITH TIME ZONE,
  step2_completed_at TIMESTAMP WITH TIME ZONE,
  step3_completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.maintenance_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance entries (all users can see all entries)
CREATE POLICY "Anyone can view maintenance entries" 
ON public.maintenance_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create maintenance entries" 
ON public.maintenance_entries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update maintenance entries" 
ON public.maintenance_entries 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete maintenance entries" 
ON public.maintenance_entries 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maintenance_entries_updated_at
BEFORE UPDATE ON public.maintenance_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.maintenance_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_entries;