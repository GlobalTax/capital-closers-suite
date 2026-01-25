-- =====================================================
-- Alternativa: Hacer bucket mandato-documentos público para lectura
-- El control de acceso se maneja a nivel de aplicación (Edge Function)
-- Las políticas de escritura (INSERT/UPDATE/DELETE) permanecen restrictivas
-- =====================================================

-- 1. Hacer el bucket público para lectura
UPDATE storage.buckets 
SET public = true 
WHERE id = 'mandato-documentos';

-- 2. Eliminar política SELECT restrictiva (ya no es necesaria con bucket público)
DROP POLICY IF EXISTS "Users can read mandato documents" ON storage.objects;

-- 3. Mantener políticas de escritura existentes (INSERT/UPDATE/DELETE)
-- Estas ya existen y restringen escritura solo a admins activos

-- Nota: El acceso a documentos ahora se controla via:
-- a) Edge Function download-document (valida JWT + rol admin antes de generar signed URL)
-- b) La URL pública del bucket solo expone archivos si alguien conoce el path exacto
-- c) Los paths son UUIDs + timestamps, prácticamente imposibles de adivinar