-- Drop the restrictive policy that required status change
DROP POLICY IF EXISTS "Users can edit own approved entries" ON mandato_time_entries;

-- Create new policy: users can edit their own entries with mandatory traceability
-- Status remains unchanged, but edit_reason is always required
CREATE POLICY "Users can edit own entries with tracking"
ON mandato_time_entries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
  AND edit_reason IS NOT NULL
  AND length(trim(edit_reason)) >= 5
  AND edited_at IS NOT NULL
  AND edited_by = auth.uid()
);