-- Tabla de log de sincronizaciones
CREATE TABLE IF NOT EXISTS capittal_contact_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('webhook', 'polling', 'manual')),
  contacts_processed INT DEFAULT 0,
  contacts_created INT DEFAULT 0,
  contacts_updated INT DEFAULT 0,
  contacts_skipped INT DEFAULT 0,
  contacts_archived INT DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  error_message TEXT,
  last_capittal_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para consultas de historial
CREATE INDEX IF NOT EXISTS idx_capittal_sync_log_started 
ON capittal_contact_sync_log(started_at DESC);

-- RLS para la tabla de log
ALTER TABLE capittal_contact_sync_log ENABLE ROW LEVEL SECURITY;

-- Políticas con roles válidos
CREATE POLICY "Admins can view sync logs"
ON capittal_contact_sync_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'editor')
    AND is_active = true
  )
);

CREATE POLICY "Admins can insert sync logs"
ON capittal_contact_sync_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
    AND is_active = true
  )
);

CREATE POLICY "Admins can update sync logs"
ON capittal_contact_sync_log
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
    AND is_active = true
  )
);