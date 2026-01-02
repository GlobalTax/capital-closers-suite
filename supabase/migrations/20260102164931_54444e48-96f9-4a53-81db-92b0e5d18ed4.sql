-- 1. Campo para vincular con operación de Capittal
ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS external_operation_id UUID;

-- 2. Campos de sincronización
ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS external_source TEXT DEFAULT 'manual';

ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS external_synced_at TIMESTAMPTZ;

-- 3. URL pública del marketplace
ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS url_publica TEXT;

-- 4. Índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_mandatos_external_operation_id 
ON mandatos(external_operation_id) 
WHERE external_operation_id IS NOT NULL;

-- 5. Tabla de log para sincronización de operaciones
CREATE TABLE IF NOT EXISTS operation_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_by TEXT DEFAULT 'cron',
  operations_processed INT DEFAULT 0,
  mandatos_created INT DEFAULT 0,
  mandatos_updated INT DEFAULT 0,
  empresas_created INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  duration_ms INT
);

-- 6. RLS para operation_sync_log (solo admins)
ALTER TABLE operation_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
ON operation_sync_log FOR SELECT
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Service role can insert sync logs"
ON operation_sync_log FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update sync logs"
ON operation_sync_log FOR UPDATE
USING (true);