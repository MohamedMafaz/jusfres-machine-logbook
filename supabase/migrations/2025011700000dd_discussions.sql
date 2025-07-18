-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES maintenance_entries(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_discussions_entry_id ON discussions(entry_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at);

-- Enable Row Level Security
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read discussions
CREATE POLICY "Allow all users to read discussions ON discussions
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert discussions
CREATE POLICY "Allow authenticated users to insert discussions ON discussions
  FOR INSERT WITH CHECK (true);

-- Create policy to allow users to update their own discussions
CREATE POLICY "Allow users to update own discussions ON discussions
  FOR UPDATE USING (author_id = auth.uid()::text);

-- Create policy to allow users to delete their own discussions
CREATE POLICY "Allow users to delete own discussions ON discussions
  FOR DELETE USING (author_id = auth.uid()::text);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 