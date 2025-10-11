-- Tabla de logs de importación
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type TEXT NOT NULL CHECK (import_type IN ('mandatos', 'contactos', 'empresas', 'mixed')),
  total_records INTEGER NOT NULL DEFAULT 0,
  successful INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  config JSONB,
  errors JSONB,
  file_name TEXT,
  imported_by UUID REFERENCES admin_users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver logs
CREATE POLICY "Admins can view import logs"
  ON public.import_logs
  FOR SELECT
  TO authenticated
  USING (current_user_is_admin());

-- Sistema puede insertar
CREATE POLICY "System can insert import logs"
  ON public.import_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (current_user_is_admin());

-- Admins pueden actualizar
CREATE POLICY "Admins can update import logs"
  ON public.import_logs
  FOR UPDATE
  TO authenticated
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Índices para mejorar performance
CREATE INDEX idx_import_logs_type ON public.import_logs(import_type);
CREATE INDEX idx_import_logs_status ON public.import_logs(status);
CREATE INDEX idx_import_logs_created_at ON public.import_logs(created_at DESC);
CREATE INDEX idx_import_logs_imported_by ON public.import_logs(imported_by);

-- Agregar campo import_log_id a mandatos, contactos y empresas para poder hacer rollback
ALTER TABLE public.mandatos ADD COLUMN IF NOT EXISTS import_log_id UUID REFERENCES public.import_logs(id);
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS import_log_id UUID REFERENCES public.import_logs(id);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS import_log_id UUID REFERENCES public.import_logs(id);

-- Crear índices para facilitar rollback
CREATE INDEX IF NOT EXISTS idx_mandatos_import_log ON public.mandatos(import_log_id);
CREATE INDEX IF NOT EXISTS idx_contactos_import_log ON public.contactos(import_log_id);
CREATE INDEX IF NOT EXISTS idx_empresas_import_log ON public.empresas(import_log_id);

-- Función para rollback de importaciones
CREATE OR REPLACE FUNCTION public.rollback_import(p_import_log_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_mandatos INTEGER := 0;
  deleted_contactos INTEGER := 0;
  deleted_empresas INTEGER := 0;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT current_user_is_admin() THEN
    RAISE EXCEPTION 'Solo administradores pueden hacer rollback de importaciones';
  END IF;
  
  -- Soft delete de mandatos
  UPDATE public.mandatos
  SET is_deleted = true, deleted_at = now(), deleted_by = auth.uid()
  WHERE import_log_id = p_import_log_id AND is_deleted = false;
  GET DIAGNOSTICS deleted_mandatos = ROW_COUNT;
  
  -- Soft delete de contactos
  UPDATE public.contactos
  SET is_deleted = true, deleted_at = now(), deleted_by = auth.uid()
  WHERE import_log_id = p_import_log_id AND is_deleted = false;
  GET DIAGNOSTICS deleted_contactos = ROW_COUNT;
  
  -- Soft delete de empresas
  UPDATE public.empresas
  SET is_deleted = true, deleted_at = now(), deleted_by = auth.uid()
  WHERE import_log_id = p_import_log_id AND is_deleted = false;
  GET DIAGNOSTICS deleted_empresas = ROW_COUNT;
  
  -- Actualizar estado del import_log
  UPDATE public.import_logs
  SET status = 'cancelled', completed_at = now()
  WHERE id = p_import_log_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_mandatos', deleted_mandatos,
    'deleted_contactos', deleted_contactos,
    'deleted_empresas', deleted_empresas
  );
END;
$$;