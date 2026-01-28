-- Añadir columna para vincular ítem del plan con tarea generada
ALTER TABLE public.daily_plan_items 
ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES public.tareas(id) ON DELETE SET NULL;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_daily_plan_items_linked_task 
ON public.daily_plan_items(linked_task_id);