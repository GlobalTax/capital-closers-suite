-- Actualizar políticas RLS de storage para mandato-documentos
-- Los admins deben poder leer TODOS los archivos del bucket (no solo los propios)

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admins can read files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read mandato documents" ON storage.objects;

-- Crear política de SELECT que permite a admins leer todos los archivos del bucket
CREATE POLICY "Admins can read mandato documents"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'mandato-documentos' 
  AND public.current_user_is_admin()
);

-- Eliminar y recrear política de INSERT para que admins puedan subir
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload mandato documents" ON storage.objects;

CREATE POLICY "Admins can upload mandato documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'mandato-documentos' 
  AND public.current_user_is_admin()
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Política de DELETE para admins
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete mandato documents" ON storage.objects;

CREATE POLICY "Admins can delete mandato documents"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'mandato-documentos' 
  AND public.current_user_is_admin()
);