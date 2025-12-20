-- ============================================
-- SISTEMA DE ALERTAS M&A
-- ============================================

-- Tabla de alertas
CREATE TABLE IF NOT EXISTS mandato_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id uuid REFERENCES mandatos(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  description text,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Tipos de alertas:
-- 'inactive_mandate': Mandato sin actividad
-- 'overdue_task': Tarea vencida
-- 'stuck_deal': Deal estancado en una fase
-- 'upcoming_deadline': Fecha límite próxima
-- 'missing_document': Documento pendiente
-- 'low_probability': Probabilidad baja de cierre

-- Severidad: 'info', 'warning', 'critical'

-- Habilitar RLS
ALTER TABLE mandato_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can view alerts"
ON mandato_alerts FOR SELECT
USING (current_user_is_admin());

CREATE POLICY "Admins can manage alerts"
ON mandato_alerts FOR ALL
USING (current_user_is_admin());

-- Índices
CREATE INDEX IF NOT EXISTS idx_mandato_alerts_mandato ON mandato_alerts(mandato_id);
CREATE INDEX IF NOT EXISTS idx_mandato_alerts_type ON mandato_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_mandato_alerts_unread ON mandato_alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_mandato_alerts_active ON mandato_alerts(is_dismissed) WHERE is_dismissed = false;

-- Función para generar alertas automáticas
CREATE OR REPLACE FUNCTION generate_mandato_alerts()
RETURNS void AS $$
DECLARE
  mandato_record RECORD;
  task_record RECORD;
BEGIN
  -- Limpiar alertas antiguas (más de 30 días y ya leídas)
  DELETE FROM mandato_alerts 
  WHERE is_read = true 
  AND created_at < now() - interval '30 days';
  
  -- 1. Alertas por mandatos inactivos (sin actividad en 14+ días)
  FOR mandato_record IN 
    SELECT m.id, m.descripcion, m.last_activity_at, m.pipeline_stage,
           e.nombre as empresa_nombre,
           EXTRACT(DAY FROM (now() - m.last_activity_at)) as days_inactive
    FROM mandatos m
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    WHERE m.estado NOT IN ('cerrado', 'cancelado')
    AND m.last_activity_at < now() - interval '14 days'
  LOOP
    INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
    VALUES (
      mandato_record.id,
      'inactive_mandate',
      CASE 
        WHEN mandato_record.days_inactive > 30 THEN 'critical'
        WHEN mandato_record.days_inactive > 21 THEN 'warning'
        ELSE 'info'
      END,
      'Mandato sin actividad',
      format('%s días sin actividad en %s', 
        mandato_record.days_inactive::int, 
        COALESCE(mandato_record.empresa_nombre, mandato_record.descripcion, 'mandato')),
      jsonb_build_object('days_inactive', mandato_record.days_inactive)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- 2. Alertas por deals estancados (30+ días en la misma fase)
  FOR mandato_record IN 
    SELECT m.id, m.descripcion, m.days_in_stage, m.pipeline_stage,
           ps.stage_name,
           e.nombre as empresa_nombre
    FROM mandatos m
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    LEFT JOIN pipeline_stages ps ON ps.stage_key = m.pipeline_stage
    WHERE m.estado NOT IN ('cerrado', 'cancelado')
    AND m.days_in_stage > 30
    AND m.pipeline_stage != 'cierre'
  LOOP
    INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
    VALUES (
      mandato_record.id,
      'stuck_deal',
      'warning',
      'Deal estancado',
      format('%s lleva %s días en fase "%s"', 
        COALESCE(mandato_record.empresa_nombre, mandato_record.descripcion, 'Deal'),
        mandato_record.days_in_stage,
        mandato_record.stage_name),
      jsonb_build_object('days_in_stage', mandato_record.days_in_stage, 'stage', mandato_record.pipeline_stage)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- 3. Alertas por tareas vencidas del checklist
  FOR task_record IN 
    SELECT t.id, t.mandato_id, t.tarea, t.fecha_limite,
           m.descripcion as mandato_descripcion,
           e.nombre as empresa_nombre,
           EXTRACT(DAY FROM (now() - t.fecha_limite)) as days_overdue
    FROM mandato_checklist_tasks t
    JOIN mandatos m ON t.mandato_id = m.id
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    WHERE t.estado != '✅ Completa'
    AND t.fecha_limite < now()
  LOOP
    INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
    VALUES (
      task_record.mandato_id,
      'overdue_task',
      CASE 
        WHEN task_record.days_overdue > 7 THEN 'critical'
        ELSE 'warning'
      END,
      'Tarea vencida',
      format('"%s" vencida hace %s días en %s', 
        task_record.tarea,
        task_record.days_overdue::int,
        COALESCE(task_record.empresa_nombre, task_record.mandato_descripcion, 'mandato')),
      jsonb_build_object('task_id', task_record.id, 'days_overdue', task_record.days_overdue)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- 4. Alertas por fechas de cierre próximas (7 días)
  FOR mandato_record IN 
    SELECT m.id, m.descripcion, m.expected_close_date, m.valor,
           e.nombre as empresa_nombre,
           EXTRACT(DAY FROM (m.expected_close_date - now())) as days_until_close
    FROM mandatos m
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    WHERE m.estado NOT IN ('cerrado', 'cancelado')
    AND m.expected_close_date IS NOT NULL
    AND m.expected_close_date BETWEEN now() AND now() + interval '7 days'
  LOOP
    INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
    VALUES (
      mandato_record.id,
      'upcoming_deadline',
      'info',
      'Cierre próximo',
      format('%s tiene fecha de cierre en %s días', 
        COALESCE(mandato_record.empresa_nombre, mandato_record.descripcion, 'Mandato'),
        mandato_record.days_until_close::int),
      jsonb_build_object('days_until_close', mandato_record.days_until_close, 'expected_close_date', mandato_record.expected_close_date)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Vista para alertas activas con información del mandato
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT 
  a.*,
  m.tipo as mandato_tipo,
  m.estado as mandato_estado,
  m.valor as mandato_valor,
  m.pipeline_stage,
  e.nombre as empresa_nombre,
  e.sector as empresa_sector
FROM mandato_alerts a
JOIN mandatos m ON a.mandato_id = m.id
LEFT JOIN empresas e ON m.empresa_principal_id = e.id
WHERE a.is_dismissed = false
ORDER BY 
  CASE a.severity 
    WHEN 'critical' THEN 1 
    WHEN 'warning' THEN 2 
    ELSE 3 
  END,
  a.created_at DESC;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_mandato_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_mandato_alerts_updated_at ON mandato_alerts;
CREATE TRIGGER trigger_update_mandato_alerts_updated_at
BEFORE UPDATE ON mandato_alerts
FOR EACH ROW
EXECUTE FUNCTION update_mandato_alerts_updated_at();