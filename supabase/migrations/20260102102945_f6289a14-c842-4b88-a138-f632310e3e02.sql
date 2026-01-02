-- =============================================
-- RLS SEGURAS POR ROL Y PROPIETARIO
-- =============================================

-- 1. FUNCIONES HELPER PARA CONTROL DE ACCESO
-- =============================================

-- Función para verificar si el usuario actual puede leer (viewer+)
CREATE OR REPLACE FUNCTION public.current_user_can_read()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND role IN ('super_admin', 'admin', 'viewer')
  );
$$;

-- Función para verificar si el usuario actual puede escribir (admin+)
CREATE OR REPLACE FUNCTION public.current_user_can_write()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
      AND role IN ('super_admin', 'admin')
  );
$$;

-- 2. POLÍTICAS PARA MANDATOS
-- =============================================

DROP POLICY IF EXISTS "Admins can manage mandatos" ON mandatos;

CREATE POLICY "mandatos_read" ON mandatos
FOR SELECT USING (current_user_can_read());

CREATE POLICY "mandatos_insert" ON mandatos
FOR INSERT WITH CHECK (current_user_can_write());

CREATE POLICY "mandatos_update" ON mandatos
FOR UPDATE USING (current_user_can_write()) WITH CHECK (current_user_can_write());

CREATE POLICY "mandatos_delete" ON mandatos
FOR DELETE USING (current_user_can_write());

-- 3. POLÍTICAS PARA CONTACTOS
-- =============================================

DROP POLICY IF EXISTS "Only admins can read contactos" ON contactos;
DROP POLICY IF EXISTS "Only admins can insert contactos" ON contactos;
DROP POLICY IF EXISTS "Only admins can update contactos" ON contactos;
DROP POLICY IF EXISTS "Only admins can delete contactos" ON contactos;

CREATE POLICY "contactos_read" ON contactos
FOR SELECT USING (current_user_can_read());

CREATE POLICY "contactos_insert" ON contactos
FOR INSERT WITH CHECK (current_user_can_write());

CREATE POLICY "contactos_update" ON contactos
FOR UPDATE USING (current_user_can_write()) WITH CHECK (current_user_can_write());

CREATE POLICY "contactos_delete" ON contactos
FOR DELETE USING (current_user_can_write());

-- 4. POLÍTICAS PARA EMPRESAS
-- =============================================

DROP POLICY IF EXISTS "Only admins can read empresas" ON empresas;
DROP POLICY IF EXISTS "Only admins can insert empresas" ON empresas;
DROP POLICY IF EXISTS "Only admins can update empresas" ON empresas;
DROP POLICY IF EXISTS "Only admins can delete empresas" ON empresas;

CREATE POLICY "empresas_read" ON empresas
FOR SELECT USING (current_user_can_read());

CREATE POLICY "empresas_insert" ON empresas
FOR INSERT WITH CHECK (current_user_can_write());

CREATE POLICY "empresas_update" ON empresas
FOR UPDATE USING (current_user_can_write()) WITH CHECK (current_user_can_write());

CREATE POLICY "empresas_delete" ON empresas
FOR DELETE USING (current_user_can_write());

-- 5. LIMPIAR Y CREAR POLÍTICAS PARA MANDATO_CONTACTOS
-- =============================================

DROP POLICY IF EXISTS "Admins can manage mandato_contactos" ON mandato_contactos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver contactos de mandatos" ON mandato_contactos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear contactos de mandatos" ON mandato_contactos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar contactos de mandatos" ON mandato_contactos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar contactos de mandatos" ON mandato_contactos;

CREATE POLICY "mandato_contactos_read" ON mandato_contactos
FOR SELECT USING (current_user_can_read());

CREATE POLICY "mandato_contactos_insert" ON mandato_contactos
FOR INSERT WITH CHECK (current_user_can_write());

CREATE POLICY "mandato_contactos_update" ON mandato_contactos
FOR UPDATE USING (current_user_can_write()) WITH CHECK (current_user_can_write());

CREATE POLICY "mandato_contactos_delete" ON mandato_contactos
FOR DELETE USING (current_user_can_write());

-- 6. LIMPIAR Y CREAR POLÍTICAS PARA MANDATO_EMPRESAS
-- =============================================

DROP POLICY IF EXISTS "Admins can manage mandato_empresas" ON mandato_empresas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver empresas de mandatos" ON mandato_empresas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear empresas de mandatos" ON mandato_empresas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar empresas de mandatos" ON mandato_empresas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar empresas de mandatos" ON mandato_empresas;

CREATE POLICY "mandato_empresas_read" ON mandato_empresas
FOR SELECT USING (current_user_can_read());

CREATE POLICY "mandato_empresas_insert" ON mandato_empresas
FOR INSERT WITH CHECK (current_user_can_write());

CREATE POLICY "mandato_empresas_update" ON mandato_empresas
FOR UPDATE USING (current_user_can_write()) WITH CHECK (current_user_can_write());

CREATE POLICY "mandato_empresas_delete" ON mandato_empresas
FOR DELETE USING (current_user_can_write());

-- 7. POLÍTICAS PARA INTERACCIONES (OWNER-BASED)
-- =============================================

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver interacciones" ON interacciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear interacciones" ON interacciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias interacciones" ON interacciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias interacciones" ON interacciones;

CREATE POLICY "interacciones_read" ON interacciones
FOR SELECT USING (current_user_can_read());

CREATE POLICY "interacciones_insert" ON interacciones
FOR INSERT WITH CHECK (
  current_user_can_read() AND created_by = auth.uid()
);

CREATE POLICY "interacciones_update" ON interacciones
FOR UPDATE 
USING (created_by = auth.uid() OR current_user_can_write())
WITH CHECK (created_by = auth.uid() OR current_user_can_write());

CREATE POLICY "interacciones_delete" ON interacciones
FOR DELETE USING (created_by = auth.uid() OR current_user_can_write());

-- 8. POLÍTICAS PARA MANDATO_DOCUMENTOS
-- =============================================

DROP POLICY IF EXISTS "Admins can view all documents" ON mandato_documentos;
DROP POLICY IF EXISTS "Admins can insert documents" ON mandato_documentos;
DROP POLICY IF EXISTS "Admins can delete documents" ON mandato_documentos;
DROP POLICY IF EXISTS "Admins can update documents" ON mandato_documentos;

CREATE POLICY "mandato_documentos_read" ON mandato_documentos
FOR SELECT USING (current_user_can_read());

CREATE POLICY "mandato_documentos_insert" ON mandato_documentos
FOR INSERT WITH CHECK (
  current_user_can_write() AND uploaded_by = auth.uid()
);

CREATE POLICY "mandato_documentos_update" ON mandato_documentos
FOR UPDATE USING (current_user_can_write()) WITH CHECK (current_user_can_write());

CREATE POLICY "mandato_documentos_delete" ON mandato_documentos
FOR DELETE USING (current_user_can_write());