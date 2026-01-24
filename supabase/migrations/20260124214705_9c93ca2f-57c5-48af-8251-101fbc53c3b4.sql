-- =====================================================
-- Fix Storage RLS Policy Conflict for mandato-documentos
-- The ALL policy was conflicting with the SELECT policy
-- =====================================================

-- Step 1: Drop the conflicting ALL policy
DROP POLICY IF EXISTS "Admins can manage mandato documents" ON storage.objects;

-- Step 2: Create separate policies by operation (SELECT already exists)

-- INSERT: only active admins can upload
CREATE POLICY "Admins can insert mandato documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mandato-documentos'
  AND public.current_user_can_write()
);

-- UPDATE: only active admins can modify
CREATE POLICY "Admins can update mandato documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mandato-documentos'
  AND public.current_user_can_write()
)
WITH CHECK (
  bucket_id = 'mandato-documentos'
  AND public.current_user_can_write()
);

-- DELETE: only active admins can delete
CREATE POLICY "Admins can delete mandato documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mandato-documentos'
  AND public.current_user_can_write()
);