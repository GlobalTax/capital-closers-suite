-- Add source tracking columns to empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Create indexes for monitoring queries
CREATE INDEX IF NOT EXISTS idx_empresas_source ON empresas(source);
CREATE INDEX IF NOT EXISTS idx_empresas_created_at ON empresas(created_at);

-- Create sync control table
CREATE TABLE IF NOT EXISTS sync_control (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_empresas_last_run INTEGER DEFAULT 0,
  total_empresas_created INTEGER DEFAULT 0,
  errors_last_run INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sync_control ENABLE ROW LEVEL SECURITY;

-- Policy for admin users to read
CREATE POLICY "Admin users can read sync_control" ON sync_control
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

-- Policy for admin users to update
CREATE POLICY "Admin users can update sync_control" ON sync_control
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

-- Insert initial sync configurations
INSERT INTO sync_control (id, name, description) VALUES
  ('sync-leads-to-crm', 'Sync Leads → CRM', 'Sincroniza leads de valoraciones y contactos al CRM cada hora'),
  ('sync-operations-to-crm', 'Sync Operations → CRM', 'Sincroniza operaciones del marketplace de Capittal'),
  ('sync-deals-from-brevo', 'Sync Brevo → CRM', 'Sincroniza deals desde la plataforma Brevo CRM')
ON CONFLICT (id) DO NOTHING;

-- Update existing empresas to set their source based on available data
UPDATE empresas SET source = 'sync-leads' WHERE source IS NULL AND import_log_id IS NOT NULL;
UPDATE empresas SET source = 'manual' WHERE source IS NULL;