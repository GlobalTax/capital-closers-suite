-- Crear tabla de configuración de columnas del Dashboard TV
CREATE TABLE IF NOT EXISTS public.tv_dashboard_fase_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_tipo TEXT NOT NULL CHECK (fase_tipo IN ('lead', 'mandato')),
  fase_id TEXT NOT NULL,
  columna_tv TEXT NOT NULL,
  color TEXT NOT NULL,
  icono TEXT NOT NULL,
  orden INTEGER NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tv_dashboard_fase_mapping ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos pueden leer, solo admins pueden modificar
CREATE POLICY "Anyone can view TV dashboard config"
  ON public.tv_dashboard_fase_mapping
  FOR SELECT
  USING (activo = true);

CREATE POLICY "Admins can manage TV dashboard config"
  ON public.tv_dashboard_fase_mapping
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Trigger para actualizar updated_at
CREATE TRIGGER update_tv_dashboard_config_updated_at
  BEFORE UPDATE ON public.tv_dashboard_fase_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_general_contact_leads();

-- Poblar con configuración inicial minimalista
INSERT INTO public.tv_dashboard_fase_mapping (fase_tipo, fase_id, columna_tv, color, icono, orden) VALUES
  ('lead', 'new', 'Nuevos Leads', 'slate', 'Inbox', 1),
  ('lead', 'contacted', 'En Contacto', 'zinc', 'Phone', 2),
  ('lead', 'qualified', 'Calificados', 'neutral', 'CheckCircle', 3),
  ('mandato', 'activo', 'Mandato Activo', 'stone', 'Briefcase', 4),
  ('mandato', 'en_negociacion', 'En Negociación', 'gray', 'Handshake', 5),
  ('mandato', 'cerrado', 'Cerrado Ganado', 'emerald', 'Trophy', 6);