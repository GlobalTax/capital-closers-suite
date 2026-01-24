-- Fix RLS policy for mandato-documentos bucket
-- Replace individual policies with unified ALL policy (same pattern as company-logos)

-- Drop all existing policies for this bucket
DROP POLICY IF EXISTS "Admins can read mandato documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete mandato documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can insert mandato documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update mandato documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage mandato documents" ON storage.objects;

-- Create unified ALL policy
CREATE POLICY "Admins can manage mandato documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'mandato-documentos' 
  AND auth.uid() IN (
    SELECT user_id 
    FROM public.admin_users 
    WHERE is_active = true
  )
)
WITH CHECK (
  bucket_id = 'mandato-documentos' 
  AND auth.uid() IN (
    SELECT user_id 
    FROM public.admin_users 
    WHERE is_active = true
  )
);