-- Permitir que task_id sea NULL (vinculación opcional a tarea del checklist)
ALTER TABLE public.mandato_time_entries 
ALTER COLUMN task_id DROP NOT NULL;

-- Añadir comentario explicativo
COMMENT ON COLUMN public.mandato_time_entries.task_id IS 
  'Referencia opcional a una tarea del checklist del mandato. Puede ser NULL cuando el tiempo se registra sin vinculación a una tarea específica.';