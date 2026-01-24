-- =====================================================
-- Actualizar política de lectura en Storage
-- Permitir a viewers (no solo admins) leer documentos
-- =====================================================

-- 1. Eliminar políticas restrictivas existentes (solo admins)
DROP POLICY IF EXISTS "Admins can read mandato documents" 
  ON storage.objects;

DROP POLICY IF EXISTS "Admins can read mandato documents for signed urls" 
  ON storage.objects;

-- 2. Crear nueva política que usa current_user_can_read()
-- Esto incluye: super_admin, admin, Y viewer
CREATE POLICY "Users can read mandato documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mandato-documentos'
  AND public.current_user_can_read()
);