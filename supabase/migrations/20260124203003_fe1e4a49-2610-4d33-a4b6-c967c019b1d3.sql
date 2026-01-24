-- Create task_ai_feedback table for storing user feedback on AI-generated tasks
CREATE TABLE IF NOT EXISTS public.task_ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.task_events(id) ON DELETE CASCADE,
  task_id UUID NOT NULL,
  is_useful BOOLEAN,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_task_ai_feedback_event ON public.task_ai_feedback(event_id);
CREATE INDEX idx_task_ai_feedback_task ON public.task_ai_feedback(task_id);
CREATE INDEX idx_task_ai_feedback_user ON public.task_ai_feedback(user_id);

-- RLS
ALTER TABLE public.task_ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view feedback" 
  ON public.task_ai_feedback FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert feedback"
  ON public.task_ai_feedback FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.task_ai_feedback FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.task_ai_feedback IS 'Stores user feedback on AI-generated task interpretations for quality improvement';