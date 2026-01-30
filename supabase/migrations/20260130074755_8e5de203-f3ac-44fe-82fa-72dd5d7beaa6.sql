-- ============================================
-- FASE 1: CORRECCIÓN DE ISSUES CRÍTICOS
-- ============================================

-- 1.1 Eliminar tabla backup que expone 147,934 contactos sin RLS
DROP TABLE IF EXISTS public.contactos_backup_20260124;

-- 1.2 Asegurar RLS en company_acquisition_inquiries
ALTER TABLE public.company_acquisition_inquiries ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas correctamente
DROP POLICY IF EXISTS "admins_read_inquiries" ON public.company_acquisition_inquiries;
DROP POLICY IF EXISTS "Solo admins leen inquiries" ON public.company_acquisition_inquiries;
DROP POLICY IF EXISTS "admins_manage_inquiries" ON public.company_acquisition_inquiries;

-- Solo admins activos pueden leer
CREATE POLICY "admins_read_inquiries" ON public.company_acquisition_inquiries
  FOR SELECT USING (public.current_user_can_read());

-- Solo admins activos pueden insertar/actualizar/eliminar
CREATE POLICY "admins_manage_inquiries" ON public.company_acquisition_inquiries
  FOR ALL USING (public.current_user_can_write())
  WITH CHECK (public.current_user_can_write());