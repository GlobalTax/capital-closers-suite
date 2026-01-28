-- Añadir columnas de reglas adicionales a work_task_types
ALTER TABLE public.work_task_types
ADD COLUMN IF NOT EXISTS min_description_length integer NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS default_billable boolean NOT NULL DEFAULT true;

-- Comentarios descriptivos
COMMENT ON COLUMN public.work_task_types.min_description_length IS 
  'Longitud mínima de descripción requerida cuando require_description es true';
COMMENT ON COLUMN public.work_task_types.default_billable IS 
  'Si las entradas de tiempo de este tipo son facturables por defecto';