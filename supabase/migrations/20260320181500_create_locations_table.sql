
-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read
CREATE POLICY "Allow public read access" ON public.locations
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON public.locations
    FOR INSERT WITH CHECK (true);

-- Seed initial locations
INSERT INTO public.locations (name, category) VALUES
('Chevron', 'default'),
('Sabzi Mandi', 'default'),
('Translink China', 'default'),
('Metro China', 'default'),
('Capstan Station', 'default'),
('Edmonds China', 'default'),
('Surrey China', 'default'),
('Canadian Tire', 'default'),
('Rupert Station', 'default'),
('Lougheed Station', 'default'),
('UBC (Apple)', 'default'),
('UBC (Orange)', 'default'),
('Brentwood Mall', 'default'),
('Warehouse', 'default'),
("Ashok sir's House", 'default'),
("Bradner's (Cold Storage)", 'default'),
('New Westminster Sky Train Station', 'default'),
('Burnaby Refinery Area 2', 'default'),
('Kelowna', 'default'),
('Edmonton', 'default'),
("Nematullah's House", 'nematullah'),
('Humbers College Etobicoke Campus', 'nematullah'),
('University of Toronto Scarborough', 'nematullah'),
('Edward Diagnostic', 'nematullah'),
('Ontario Tech University', 'nematullah'),
('Bridlewood Mall', 'nematullah'),
('Herat Bazaar', 'nematullah'),
('Agincourt Professional Centre', 'nematullah'),
('Langham Square Mall', 'nematullah')
ON CONFLICT (name) DO NOTHING;
