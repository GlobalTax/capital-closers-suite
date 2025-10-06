-- ============================================
-- RLS POLICIES PARA mandato_contactos
-- ============================================

-- Permitir a usuarios autenticados ver contactos de mandatos
CREATE POLICY "Usuarios autenticados pueden ver contactos de mandatos"
  ON public.mandato_contactos
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir a usuarios autenticados crear relaciones
CREATE POLICY "Usuarios autenticados pueden crear contactos de mandatos"
  ON public.mandato_contactos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir a usuarios autenticados actualizar relaciones
CREATE POLICY "Usuarios autenticados pueden actualizar contactos de mandatos"
  ON public.mandato_contactos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir a usuarios autenticados eliminar relaciones
CREATE POLICY "Usuarios autenticados pueden eliminar contactos de mandatos"
  ON public.mandato_contactos
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- RLS POLICIES PARA mandato_empresas
-- ============================================

-- Permitir a usuarios autenticados ver empresas de mandatos
CREATE POLICY "Usuarios autenticados pueden ver empresas de mandatos"
  ON public.mandato_empresas
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir a usuarios autenticados crear relaciones
CREATE POLICY "Usuarios autenticados pueden crear empresas de mandatos"
  ON public.mandato_empresas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir a usuarios autenticados actualizar relaciones
CREATE POLICY "Usuarios autenticados pueden actualizar empresas de mandatos"
  ON public.mandato_empresas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir a usuarios autenticados eliminar relaciones
CREATE POLICY "Usuarios autenticados pueden eliminar empresas de mandatos"
  ON public.mandato_empresas
  FOR DELETE
  TO authenticated
  USING (true);