-- ============================================
-- PIPELINE M&A: Nuevos campos y configuración
-- ============================================

-- Añadir campos de pipeline a la tabla mandatos
ALTER TABLE mandatos
ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'prospeccion',
ADD COLUMN IF NOT EXISTS probability integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS expected_close_date date,
ADD COLUMN IF NOT EXISTS weighted_value numeric GENERATED ALWAYS AS (
  COALESCE(valor, 0) * COALESCE(probability, 0) / 100
) STORED,
ADD COLUMN IF NOT EXISTS days_in_stage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS stage_entered_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now();

-- Tabla de configuración de fases del pipeline
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key text UNIQUE NOT NULL,
  stage_name text NOT NULL,
  stage_order integer NOT NULL,
  default_probability integer NOT NULL DEFAULT 10,
  color text NOT NULL DEFAULT '#6B7280',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insertar fases por defecto del pipeline M&A
INSERT INTO pipeline_stages (stage_key, stage_name, stage_order, default_probability, color, description)
VALUES 
  ('prospeccion', 'Prospección', 1, 10, '#6B7280', 'Identificación inicial y cualificación'),
  ('loi', 'LOI / Carta de intención', 2, 30, '#3B82F6', 'Letter of Intent firmada'),
  ('due_diligence', 'Due Diligence', 3, 50, '#8B5CF6', 'Proceso de due diligence en curso'),
  ('negociacion', 'Negociación', 4, 70, '#F59E0B', 'Negociación de términos finales'),
  ('cierre', 'Cierre', 5, 90, '#10B981', 'Firma del SPA y cierre')
ON CONFLICT (stage_key) DO NOTHING;

-- Habilitar RLS
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pipeline_stages (lectura para todos los admin)
CREATE POLICY "Admins can view pipeline stages"
ON pipeline_stages FOR SELECT
USING (current_user_is_admin());

CREATE POLICY "Super admins can manage pipeline stages"
ON pipeline_stages FOR ALL
USING (is_user_super_admin(auth.uid()));

-- Función para actualizar days_in_stage automáticamente
CREATE OR REPLACE FUNCTION update_mandato_days_in_stage()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambió el stage, reiniciar el contador
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    NEW.stage_entered_at := now();
    NEW.days_in_stage := 0;
  ELSE
    -- Calcular días en el stage actual
    NEW.days_in_stage := EXTRACT(DAY FROM (now() - COALESCE(NEW.stage_entered_at, NEW.created_at)));
  END IF;
  
  -- Actualizar last_activity_at
  NEW.last_activity_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar days_in_stage
DROP TRIGGER IF EXISTS trigger_update_mandato_days_in_stage ON mandatos;
CREATE TRIGGER trigger_update_mandato_days_in_stage
BEFORE UPDATE ON mandatos
FOR EACH ROW
EXECUTE FUNCTION update_mandato_days_in_stage();

-- Sincronizar estado actual con pipeline_stage
UPDATE mandatos 
SET pipeline_stage = CASE estado
  WHEN 'prospecto' THEN 'prospeccion'
  WHEN 'activo' THEN 'loi'
  WHEN 'en_negociacion' THEN 'negociacion'
  WHEN 'cerrado' THEN 'cierre'
  ELSE 'prospeccion'
END,
probability = CASE estado
  WHEN 'prospecto' THEN 10
  WHEN 'activo' THEN 30
  WHEN 'en_negociacion' THEN 70
  WHEN 'cerrado' THEN 100
  ELSE 10
END
WHERE pipeline_stage IS NULL OR pipeline_stage = 'prospeccion';

-- Vista para métricas del pipeline
CREATE OR REPLACE VIEW v_pipeline_summary AS
SELECT 
  ps.stage_key,
  ps.stage_name,
  ps.stage_order,
  ps.color,
  ps.default_probability,
  COUNT(m.id) as deal_count,
  COALESCE(SUM(m.valor), 0) as total_value,
  COALESCE(SUM(m.weighted_value), 0) as weighted_value,
  COALESCE(AVG(m.days_in_stage), 0) as avg_days_in_stage
FROM pipeline_stages ps
LEFT JOIN mandatos m ON m.pipeline_stage = ps.stage_key 
  AND m.estado != 'cancelado'
WHERE ps.is_active = true
GROUP BY ps.id, ps.stage_key, ps.stage_name, ps.stage_order, ps.color, ps.default_probability
ORDER BY ps.stage_order;

-- Vista para mandatos estancados (más de 30 días sin actividad)
CREATE OR REPLACE VIEW v_mandatos_stuck AS
SELECT 
  m.*,
  ps.stage_name,
  ps.color as stage_color,
  EXTRACT(DAY FROM (now() - m.last_activity_at)) as days_inactive
FROM mandatos m
JOIN pipeline_stages ps ON ps.stage_key = m.pipeline_stage
WHERE m.estado NOT IN ('cerrado', 'cancelado')
  AND m.last_activity_at < now() - interval '30 days'
ORDER BY days_inactive DESC;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_mandatos_pipeline_stage ON mandatos(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_mandatos_last_activity ON mandatos(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_mandatos_expected_close ON mandatos(expected_close_date);