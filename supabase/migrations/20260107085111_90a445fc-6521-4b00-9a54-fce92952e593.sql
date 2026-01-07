-- ============================================
-- MANDATOS: Añadir categorías de servicio
-- ============================================

-- 1. Añadir campo categoria para distinguir tipos de proyecto
ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'operacion_ma'
CHECK (categoria IN ('operacion_ma', 'due_diligence', 'spa_legal', 'valoracion', 'asesoria'));

-- 2. Campo para vincular a operación padre (DD/SPA como sub-proyecto de una operación)
ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS parent_mandato_id uuid REFERENCES mandatos(id) ON DELETE SET NULL;

-- 3. Campos específicos para servicios de asesoría
ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS servicio_tipo text; -- 'buy-side', 'sell-side', 'vendor', 'independiente'

ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS cliente_externo text; -- Nombre del cliente si no es empresa del CRM

ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS honorarios_propuestos numeric;

ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS honorarios_aceptados numeric;

ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS estructura_honorarios text 
CHECK (estructura_honorarios IS NULL OR estructura_honorarios IN ('fijo', 'exito', 'mixto', 'horario'));

-- 4. Pipeline simplificado para servicios (reutiliza pipeline_stage)
-- Los servicios usarán: 'propuesta', 'en_ejecucion', 'entregado'
-- Actualizar el CHECK constraint para incluir nuevas etapas
ALTER TABLE mandatos DROP CONSTRAINT IF EXISTS mandatos_pipeline_stage_check;
ALTER TABLE mandatos 
ADD CONSTRAINT mandatos_pipeline_stage_check 
CHECK (pipeline_stage IS NULL OR pipeline_stage IN (
  -- Etapas M&A tradicionales
  'prospeccion', 'loi', 'due_diligence', 'negociacion', 'cierre',
  -- Etapas para servicios
  'propuesta', 'en_ejecucion', 'entregado'
));

-- 5. Índices para búsquedas por categoría y parent
CREATE INDEX IF NOT EXISTS idx_mandatos_categoria ON mandatos(categoria);
CREATE INDEX IF NOT EXISTS idx_mandatos_parent ON mandatos(parent_mandato_id) WHERE parent_mandato_id IS NOT NULL;

-- 6. Comentarios para documentación
COMMENT ON COLUMN mandatos.categoria IS 'Categoría del proyecto: operacion_ma, due_diligence, spa_legal, valoracion, asesoria';
COMMENT ON COLUMN mandatos.parent_mandato_id IS 'ID del mandato padre si este es un sub-proyecto (ej: DD dentro de una operación)';
COMMENT ON COLUMN mandatos.servicio_tipo IS 'Tipo de servicio: buy-side, sell-side, vendor, independiente';
COMMENT ON COLUMN mandatos.honorarios_propuestos IS 'Honorarios propuestos al cliente en euros';
COMMENT ON COLUMN mandatos.honorarios_aceptados IS 'Honorarios finalmente aceptados/facturados en euros';
COMMENT ON COLUMN mandatos.estructura_honorarios IS 'Estructura de honorarios: fijo, exito, mixto, horario';