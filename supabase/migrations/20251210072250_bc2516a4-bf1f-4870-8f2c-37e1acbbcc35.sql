-- =====================================================
-- SECURITY FIX: Privatizar storage buckets sensibles
-- =====================================================

-- 1. Privatizar buckets
UPDATE storage.buckets SET public = false WHERE id = 'valuations';
UPDATE storage.buckets SET public = false WHERE id = 'rod-documents';

-- 2. Eliminar políticas públicas/inseguras existentes
DROP POLICY IF EXISTS "Public can read valuations" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete valuations" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update valuations" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload valuations" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download ROD documents" ON storage.objects;

-- 3. Crear políticas seguras para valuations
CREATE POLICY "Admins can read valuations"
ON storage.objects FOR SELECT
USING (bucket_id = 'valuations' AND public.current_user_is_admin());

CREATE POLICY "Admins can upload valuations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'valuations' AND public.current_user_is_admin());

CREATE POLICY "Admins can update valuations"
ON storage.objects FOR UPDATE
USING (bucket_id = 'valuations' AND public.current_user_is_admin());

CREATE POLICY "Super admins can delete valuations"
ON storage.objects FOR DELETE
USING (bucket_id = 'valuations' AND public.is_user_super_admin(auth.uid()));

-- 4. Crear políticas seguras para rod-documents
CREATE POLICY "Admins can read rod documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'rod-documents' AND public.current_user_is_admin());

CREATE POLICY "Admins can upload rod documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'rod-documents' AND public.current_user_is_admin());

CREATE POLICY "Admins can update rod documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'rod-documents' AND public.current_user_is_admin());

CREATE POLICY "Super admins can delete rod documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'rod-documents' AND public.is_user_super_admin(auth.uid()));