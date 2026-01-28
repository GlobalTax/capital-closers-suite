-- Add modified_after_submit column to track post-submission edits
ALTER TABLE public.daily_plans 
ADD COLUMN IF NOT EXISTS modified_after_submit BOOLEAN DEFAULT FALSE;