-- ============================================
-- NUEVA TABLA: mandate_leads (Tabla Puente Lead-Mandato)
-- ============================================

CREATE TABLE IF NOT EXISTS mandate_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  mandato_id UUID NOT NULL REFERENCES mandatos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  valuation_id UUID REFERENCES company_valuations(id) ON DELETE SET NULL,
  
  -- Datos del lead (desnormalizados para rendimiento)
  company_name TEXT NOT NULL,
  company_cif TEXT,
  company_website TEXT,
  company_email_domain TEXT,
  contact_name TEXT,
  contact_email TEXT,
  location TEXT,
  sector TEXT,
  
  -- Matching y scoring
  match_type TEXT CHECK (match_type IN ('auto', 'manual', 'ai')) DEFAULT 'manual',
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  match_reason TEXT,
  
  -- Pipeline
  stage TEXT DEFAULT 'nuevo' CHECK (stage IN (
    'nuevo', 'contactado', 'en_analisis', 'nda_firmado', 
    'due_diligence', 'negociacion', 'cerrado_ganado', 
    'cerrado_perdido', 'descartado'
  )),
  priority TEXT CHECK (priority IN ('alta', 'media', 'baja')) DEFAULT 'media',
  
  -- Asignacion
  assigned_to UUID REFERENCES admin_users(user_id),
  assigned_at TIMESTAMPTZ,
  
  -- Trazabilidad
  source TEXT, -- 'capittal_valuation', 'capittal_pro', 'manual', 'import'
  source_id TEXT, -- ID original en el sistema fuente
  
  -- Notas y actividad
  notes TEXT,
  last_activity_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_mandate_leads_mandato ON mandate_leads(mandato_id);
CREATE INDEX IF NOT EXISTS idx_mandate_leads_stage ON mandate_leads(stage);
CREATE INDEX IF NOT EXISTS idx_mandate_leads_assigned ON mandate_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_mandate_leads_empresa ON mandate_leads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mandate_leads_valuation ON mandate_leads(valuation_id);

-- Evitar duplicados por empresa o valuación en el mismo mandato
CREATE UNIQUE INDEX IF NOT EXISTS idx_mandate_leads_unique_empresa 
  ON mandate_leads(mandato_id, empresa_id) WHERE empresa_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_mandate_leads_unique_valuation 
  ON mandate_leads(mandato_id, valuation_id) WHERE valuation_id IS NOT NULL;

-- RLS
ALTER TABLE mandate_leads ENABLE ROW LEVEL SECURITY;

-- Política: admins tienen acceso completo
CREATE POLICY "Admin full access mandate_leads" ON mandate_leads
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Política: usuarios ven sus asignados
CREATE POLICY "Users see assigned mandate_leads" ON mandate_leads
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_mandate_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_mandate_leads_updated_at
  BEFORE UPDATE ON mandate_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_mandate_leads_updated_at();