-- Añadir política SELECT explícita para signed URLs
-- Esto permite que createSignedUrl funcione correctamente para admins
CREATE POLICY "Admins can read mandato documents for signed urls"
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