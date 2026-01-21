-- Add last_activity_at and health_status to tareas for Phase 4
ALTER TABLE tareas 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS health_status TEXT CHECK (health_status IN ('healthy', 'at_risk', 'blocked', 'overdue')) DEFAULT 'healthy';

-- Create trigger function to update last_activity_at
CREATE OR REPLACE FUNCTION public.update_tarea_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = now();
  
  -- Auto-update health status based on due date
  IF NEW.estado = 'completada' THEN
    NEW.health_status = 'healthy';
  ELSIF NEW.fecha_vencimiento IS NOT NULL AND NEW.fecha_vencimiento < CURRENT_DATE THEN
    NEW.health_status = 'overdue';
  ELSIF NEW.last_activity_at < now() - INTERVAL '7 days' AND NEW.estado != 'completada' THEN
    NEW.health_status = 'at_risk';
  ELSE
    NEW.health_status = 'healthy';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_tarea_activity ON tareas;
CREATE TRIGGER update_tarea_activity
BEFORE UPDATE ON tareas
FOR EACH ROW
EXECUTE FUNCTION public.update_tarea_last_activity();

-- Add index for health status queries
CREATE INDEX IF NOT EXISTS idx_tareas_health_status ON tareas(health_status) WHERE estado != 'completada';