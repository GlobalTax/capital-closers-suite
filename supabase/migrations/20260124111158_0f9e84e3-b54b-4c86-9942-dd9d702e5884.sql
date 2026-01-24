-- Fix RLS policy for mandato-documentos bucket to allow signed URL generation
-- The current policy uses current_user_is_admin() which doesn't resolve correctly in Storage context

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can read mandato documents" ON storage.objects;

-- Create new policy with direct query (same pattern that works in other buckets)
CREATE POLICY "Admins can read mandato documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mandato-documentos' 
  AND auth.uid() IN (
    SELECT user_id 
    FROM public.admin_users 
    WHERE is_active = true
  )
);