-- Crear enum para resultados de mandato
CREATE TYPE mandato_outcome AS ENUM ('open', 'won', 'lost', 'cancelled');

-- Crear enum para razones de pérdida (top 8 + otro)
CREATE TYPE loss_reason_type AS ENUM (
  'precio', 
  'competidor', 
  'timing',
  'fit_estrategico',
  'due_diligence',
  'financiacion',
  'cambio_prioridades',
  'relacion_cliente',
  'otro'
);

-- Añadir columnas de Win/Loss a mandatos
ALTER TABLE mandatos
ADD COLUMN IF NOT EXISTS outcome mandato_outcome DEFAULT 'open',
ADD COLUMN IF NOT EXISTS loss_reason loss_reason_type,
ADD COLUMN IF NOT EXISTS loss_notes TEXT,
ADD COLUMN IF NOT EXISTS won_value NUMERIC,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id);

-- Índices para reportes eficientes
CREATE INDEX IF NOT EXISTS idx_mandatos_outcome ON mandatos(outcome);
CREATE INDEX IF NOT EXISTS idx_mandatos_loss_reason ON mandatos(loss_reason) WHERE loss_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mandatos_closed_at ON mandatos(closed_at) WHERE closed_at IS NOT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN mandatos.outcome IS 'Resultado final: open (en curso), won (ganado), lost (perdido), cancelled (cancelado)';
COMMENT ON COLUMN mandatos.loss_reason IS 'Razón estandarizada de pérdida para análisis y aprendizaje';
COMMENT ON COLUMN mandatos.loss_notes IS 'Notas adicionales sobre la pérdida o cancelación';
COMMENT ON COLUMN mandatos.won_value IS 'Valor real de cierre cuando outcome = won';
COMMENT ON COLUMN mandatos.closed_at IS 'Fecha y hora de cierre del mandato';
COMMENT ON COLUMN mandatos.closed_by IS 'Usuario que cerró el mandato';

-- Trigger para sincronizar estado y outcome
CREATE OR REPLACE FUNCTION sync_mandato_outcome()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando estado cambia a cerrado/cancelado, registrar timestamp
  IF NEW.estado IN ('cerrado', 'cancelado') AND OLD.estado NOT IN ('cerrado', 'cancelado') THEN
    NEW.closed_at = COALESCE(NEW.closed_at, NOW());
    NEW.closed_by = COALESCE(NEW.closed_by, auth.uid());
  END IF;
  
  -- Si se reactiva un mandato cerrado, limpiar datos de cierre
  IF NEW.estado NOT IN ('cerrado', 'cancelado') AND OLD.estado IN ('cerrado', 'cancelado') THEN
    NEW.outcome = 'open';
    NEW.loss_reason = NULL;
    NEW.loss_notes = NULL;
    NEW.won_value = NULL;
    NEW.closed_at = NULL;
    NEW.closed_by = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_mandato_outcome ON mandatos;
CREATE TRIGGER trg_sync_mandato_outcome
  BEFORE UPDATE ON mandatos
  FOR EACH ROW EXECUTE FUNCTION sync_mandato_outcome();

-- Vista para métricas de Win/Loss
CREATE OR REPLACE VIEW v_mandatos_winloss AS
SELECT 
  m.id,
  m.tipo,
  m.estado,
  m.outcome,
  m.loss_reason,
  m.loss_notes,
  m.valor,
  m.won_value,
  m.pipeline_stage,
  m.closed_at,
  e.nombre AS empresa_nombre,
  e.sector
FROM mandatos m
LEFT JOIN empresas e ON m.empresa_principal_id = e.id
WHERE m.outcome IN ('won', 'lost', 'cancelled');