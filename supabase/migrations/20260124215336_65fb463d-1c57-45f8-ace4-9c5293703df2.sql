-- =====================================================
-- Simplify SELECT policy on storage.objects
-- Use inline expression instead of SECURITY DEFINER function
-- to resolve 400 errors during document downloads
-- =====================================================

-- 1. Drop the existing policy that uses current_user_can_read()
DROP POLICY IF EXISTS "Users can read mandato documents" ON storage.objects;

-- 2. Create new policy with inline logic (no SECURITY DEFINER function)
CREATE POLICY "Users can read mandato documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mandato-documentos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND role IN ('super_admin', 'admin', 'viewer')
  )
);