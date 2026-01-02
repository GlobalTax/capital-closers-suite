-- Tabla para el catálogo de tipos de tarea (work types)
CREATE TABLE public.work_task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para ordenar
CREATE INDEX idx_work_task_types_sort ON public.work_task_types(sort_order, name);

-- RLS
ALTER TABLE public.work_task_types ENABLE ROW LEVEL SECURITY;

-- Policy: Admins pueden gestionar tipos de tarea
CREATE POLICY "Admins can manage work task types" ON public.work_task_types
  FOR ALL USING (public.is_user_admin(auth.uid()));

-- Policy: Usuarios autenticados pueden leer tipos activos
CREATE POLICY "Authenticated users can read work task types" ON public.work_task_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_work_task_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_work_task_types_updated_at
  BEFORE UPDATE ON public.work_task_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_work_task_types_updated_at();

-- Añadir columna work_task_type_id a mandato_time_entries
ALTER TABLE public.mandato_time_entries 
ADD COLUMN work_task_type_id UUID REFERENCES public.work_task_types(id);

-- Índice para la FK
CREATE INDEX idx_time_entries_work_task_type ON public.mandato_time_entries(work_task_type_id);

-- Seed inicial con las tareas solicitadas (en el orden especificado)
INSERT INTO public.work_task_types (name, sort_order) VALUES
  ('Potenciales Compradores / Vendedores', 1),
  ('Reunión / Puesta en Contacto', 2),
  ('IM', 3),
  ('Teaser', 4),
  ('Datapack', 5),
  ('Leads', 6),
  ('Material Interno', 7),
  ('Estudios Sectoriales', 8),
  ('Outbound', 9);