-- =====================================================
-- Task AI Support Migration
-- =====================================================

-- 1. Create task_events table for AI history
CREATE TABLE IF NOT EXISTS public.task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('tarea', 'checklist')),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'AI_CREATED', 'AI_SPLIT', 'AI_REASSIGNED', 
    'AI_REPRIORITIZED', 'MANUAL_EDIT', 'STATUS_CHANGE'
  )),
  payload JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_task_events_task ON public.task_events(task_id, task_type);
CREATE INDEX IF NOT EXISTS idx_task_events_created ON public.task_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_events
CREATE POLICY "Admins can view all task events"
ON public.task_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can create task events"
ON public.task_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 2. Add skills and capacity to admin_users
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS daily_capacity_hours NUMERIC(4,2) DEFAULT 8.0;

COMMENT ON COLUMN public.admin_users.skills IS 
'Skills del usuario: M&A, Legal, Fiscal, Marketing, Operaciones, etc.';

COMMENT ON COLUMN public.admin_users.daily_capacity_hours IS 
'Capacidad diaria en horas para asignación de tareas';

-- 3. Add AI flags to tareas table
ALTER TABLE public.tareas 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS source_text TEXT;

COMMENT ON COLUMN public.tareas.ai_generated IS 'Indica si la tarea fue creada por IA';
COMMENT ON COLUMN public.tareas.ai_confidence IS 'Nivel de confianza de la IA (0-1)';
COMMENT ON COLUMN public.tareas.source_text IS 'Texto original del que se generó la tarea';

-- 4. Add AI flag to mandato_checklist_tasks
ALTER TABLE public.mandato_checklist_tasks
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_text TEXT;

COMMENT ON COLUMN public.mandato_checklist_tasks.ai_generated IS 'Indica si fue creada por IA';