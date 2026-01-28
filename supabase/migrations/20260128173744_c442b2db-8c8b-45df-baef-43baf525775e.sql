-- Add edit tracking columns to mandato_time_entries
ALTER TABLE mandato_time_entries
ADD COLUMN IF NOT EXISTS edited_at timestamptz,
ADD COLUMN IF NOT EXISTS edited_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edit_reason text,
ADD COLUMN IF NOT EXISTS edit_count integer DEFAULT 0;

-- Create RLS policy for users to edit their own approved entries
-- This policy allows UPDATE only if:
-- 1. User owns the entry
-- 2. Current status is 'approved'
-- 3. New status will be 'submitted'
-- 4. edit_reason is provided with min 5 chars
-- 5. edited_at and edited_by are set
CREATE POLICY "Users can edit own approved entries"
ON mandato_time_entries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status = 'approved'
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'submitted'
  AND edit_reason IS NOT NULL
  AND length(trim(edit_reason)) >= 5
  AND edited_at IS NOT NULL
  AND edited_by = auth.uid()
);

-- Add index for better performance on edit queries
CREATE INDEX IF NOT EXISTS idx_mandato_time_entries_edit_count 
ON mandato_time_entries(edit_count) 
WHERE edit_count > 0;