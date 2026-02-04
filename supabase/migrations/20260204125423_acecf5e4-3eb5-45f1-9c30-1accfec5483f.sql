-- Create buyer_source_tags table for configurable origin tags
CREATE TABLE public.buyer_source_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial source tags
INSERT INTO buyer_source_tags (key, label, color) VALUES
  ('dealsuite', 'DealSuite', '#3b82f6'),
  ('arx', 'ARX', '#8b5cf6'),
  ('research', 'Research', '#10b981'),
  ('meta_compras', 'Meta Compras', '#f59e0b');

-- Add source_tag_id column to corporate_buyers
ALTER TABLE public.corporate_buyers
  ADD COLUMN source_tag_id UUID REFERENCES buyer_source_tags(id);

-- Update existing records with 'research' as default
UPDATE corporate_buyers 
SET source_tag_id = (SELECT id FROM buyer_source_tags WHERE key = 'research')
WHERE source_tag_id IS NULL;

-- Enable RLS on buyer_source_tags
ALTER TABLE buyer_source_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for buyer_source_tags
CREATE POLICY "Authenticated can view source tags"
  ON buyer_source_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert source tags"
  ON buyer_source_tags FOR INSERT TO authenticated
  WITH CHECK (current_user_can_write());

CREATE POLICY "Admins can update source tags"
  ON buyer_source_tags FOR UPDATE TO authenticated
  USING (current_user_can_write())
  WITH CHECK (current_user_can_write());

CREATE POLICY "Admins can delete source tags"
  ON buyer_source_tags FOR DELETE TO authenticated
  USING (current_user_can_write());