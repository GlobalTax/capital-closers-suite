-- Add layout variant column to presentation_slides
ALTER TABLE presentation_slides 
ADD COLUMN IF NOT EXISTS layout_variant TEXT DEFAULT 'A' 
CHECK (layout_variant IN ('A', 'B', 'C'));