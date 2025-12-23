-- Añadir campos de trazabilidad Brevo a contactos
ALTER TABLE contactos ADD COLUMN IF NOT EXISTS brevo_id TEXT;
ALTER TABLE contactos ADD COLUMN IF NOT EXISTS brevo_synced_at TIMESTAMPTZ;

-- Añadir campos de trazabilidad Brevo a empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS brevo_id TEXT;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS brevo_synced_at TIMESTAMPTZ;

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_contactos_brevo_id ON contactos(brevo_id) WHERE brevo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_empresas_brevo_id ON empresas(brevo_id) WHERE brevo_id IS NOT NULL;