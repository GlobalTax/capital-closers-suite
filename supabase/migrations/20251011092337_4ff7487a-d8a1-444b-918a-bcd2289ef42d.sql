-- Crear tabla de configuración de fases Kanban
CREATE TABLE public.mandato_kanban_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  orden INTEGER NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para ordenar
CREATE INDEX idx_kanban_config_orden ON public.mandato_kanban_config(orden);

-- Trigger para updated_at
CREATE TRIGGER update_mandato_kanban_config_updated_at
  BEFORE UPDATE ON public.mandato_kanban_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_general_contact_leads();

-- Poblar con fases actuales
INSERT INTO public.mandato_kanban_config (fase_id, label, color, orden) VALUES
  ('prospecto', 'Prospecto', 'bg-slate-100 dark:bg-slate-800', 1),
  ('activo', 'Activo', 'bg-blue-50 dark:bg-blue-950', 2),
  ('en_negociacion', 'En Negociación', 'bg-amber-50 dark:bg-amber-950', 3),
  ('cerrado', 'Cerrado', 'bg-green-50 dark:bg-green-950', 4),
  ('cancelado', 'Cancelado', 'bg-red-50 dark:bg-red-950', 5);

-- Habilitar RLS
ALTER TABLE public.mandato_kanban_config ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer las fases activas
CREATE POLICY "Anyone can view active kanban config"
  ON public.mandato_kanban_config
  FOR SELECT
  USING (activo = true);

-- Política: Solo admins pueden modificar
CREATE POLICY "Admins can manage kanban config"
  ON public.mandato_kanban_config
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Función para actualizar orden de fases
CREATE OR REPLACE FUNCTION public.update_kanban_order(updates JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_item JSONB;
BEGIN
  -- Solo admins pueden reordenar
  IF NOT current_user_is_admin() THEN
    RAISE EXCEPTION 'Solo administradores pueden reordenar fases';
  END IF;

  -- Actualizar cada fase
  FOR update_item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE public.mandato_kanban_config
    SET orden = (update_item->>'orden')::INTEGER,
        updated_at = now()
    WHERE id = (update_item->>'id')::UUID;
  END LOOP;
END;
$$;