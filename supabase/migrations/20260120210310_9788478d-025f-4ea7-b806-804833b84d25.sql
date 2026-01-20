-- Agregar columnas faltantes a contactos para sincronización con Capittal
ALTER TABLE contactos 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS external_capittal_id TEXT,
ADD COLUMN IF NOT EXISTS capittal_synced_at TIMESTAMPTZ;

-- Índice único para external_capittal_id (solo para valores no nulos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contactos_external_capittal_id 
ON contactos(external_capittal_id) WHERE external_capittal_id IS NOT NULL;

-- Índice para filtrar por source
CREATE INDEX IF NOT EXISTS idx_contactos_source 
ON contactos(source);

-- Tabla de estado de sincronización
CREATE TABLE IF NOT EXISTS capittal_sync_state (
  id TEXT PRIMARY KEY DEFAULT 'contacts',
  last_sync_at TIMESTAMPTZ,
  last_modified_timestamp TIMESTAMPTZ,
  is_enabled BOOLEAN DEFAULT true,
  polling_interval_minutes INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar estado inicial
INSERT INTO capittal_sync_state (id, is_enabled, polling_interval_minutes)
VALUES ('contacts', true, 5)
ON CONFLICT (id) DO NOTHING;

-- RLS para capittal_sync_state
ALTER TABLE capittal_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sync state"
ON capittal_sync_state FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
    AND is_active = true
  )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_capittal_sync_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_capittal_sync_state_updated
  BEFORE UPDATE ON capittal_sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_capittal_sync_state_timestamp();