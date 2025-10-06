-- ============================================
-- TABLA: mandato_time_entries
-- ============================================

CREATE TABLE public.mandato_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  task_id UUID NOT NULL REFERENCES public.mandato_checklist_tasks(id) ON DELETE CASCADE,
  mandato_id UUID NOT NULL REFERENCES public.mandatos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información del tiempo
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Detalles del trabajo
  description TEXT NOT NULL CHECK (length(trim(description)) >= 10),
  work_type TEXT NOT NULL CHECK (work_type IN (
    'Análisis', 
    'Reunión', 
    'Due Diligence', 
    'Documentación', 
    'Negociación', 
    'Marketing', 
    'Research', 
    'Otro'
  )),
  
  -- Estado
  is_billable BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  
  -- Notas y metadata
  notes TEXT,
  rejection_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Validaciones
  CHECK (end_time IS NULL OR end_time > start_time),
  CHECK (duration_minutes IS NULL OR duration_minutes <= 1440) -- Máximo 24 horas
);

-- ============================================
-- FUNCIÓN: Auto-calcular duración
-- ============================================

CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE ON public.mandato_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_duration();

-- ============================================
-- FUNCIÓN: Actualizar updated_at
-- ============================================

CREATE TRIGGER trigger_time_entries_updated_at
  BEFORE UPDATE ON public.mandato_time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.mandato_time_entries ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias entradas y las de su mandato
CREATE POLICY "Users can view own time entries"
  ON public.mandato_time_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR current_user_is_admin());

-- Los usuarios pueden crear sus propias entradas
CREATE POLICY "Users can create own time entries"
  ON public.mandato_time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden editar sus propias entradas en estado 'draft'
CREATE POLICY "Users can update own draft entries"
  ON public.mandato_time_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- Los usuarios pueden eliminar sus propias entradas en estado 'draft'
CREATE POLICY "Users can delete own draft entries"
  ON public.mandato_time_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- Solo admins pueden aprobar/rechazar y ver todas
CREATE POLICY "Admins can manage all entries"
  ON public.mandato_time_entries
  FOR ALL
  TO authenticated
  USING (current_user_is_admin());

-- ============================================
-- VISTAS: Agregaciones
-- ============================================

CREATE VIEW mandato_time_summary AS
SELECT 
  m.id as mandato_id,
  m.tipo,
  m.descripcion,
  COUNT(DISTINCT te.user_id) as trabajadores_asignados,
  COUNT(te.id) as total_entradas,
  COALESCE(SUM(te.duration_minutes), 0) / 60.0 as total_horas,
  COALESCE(SUM(CASE WHEN te.is_billable THEN te.duration_minutes ELSE 0 END), 0) / 60.0 as horas_facturables,
  COALESCE(AVG(te.duration_minutes), 0) / 60.0 as promedio_horas_por_entrada
FROM mandatos m
LEFT JOIN mandato_time_entries te ON te.mandato_id = m.id AND te.status != 'rejected'
GROUP BY m.id, m.tipo, m.descripcion;

CREATE VIEW task_time_summary AS
SELECT 
  t.id as task_id,
  t.tarea,
  t.fase,
  t.mandato_id,
  COUNT(te.id) as total_entradas,
  COALESCE(SUM(te.duration_minutes), 0) / 60.0 as total_horas,
  COUNT(DISTINCT te.user_id) as usuarios_trabajando
FROM mandato_checklist_tasks t
LEFT JOIN mandato_time_entries te ON te.task_id = t.id AND te.status != 'rejected'
GROUP BY t.id, t.tarea, t.fase, t.mandato_id;

-- ============================================
-- ÍNDICES para Rendimiento
-- ============================================

CREATE INDEX idx_time_entries_mandato ON public.mandato_time_entries(mandato_id);
CREATE INDEX idx_time_entries_task ON public.mandato_time_entries(task_id);
CREATE INDEX idx_time_entries_user ON public.mandato_time_entries(user_id);
CREATE INDEX idx_time_entries_status ON public.mandato_time_entries(status);
CREATE INDEX idx_time_entries_start_time ON public.mandato_time_entries(start_time);