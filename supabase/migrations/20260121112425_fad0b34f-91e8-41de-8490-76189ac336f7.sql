-- =====================================================
-- TABLA MAESTRA admin_leads - Unifica todas las fuentes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores para deduplicación
  email_domain TEXT,
  cif TEXT,
  website_domain TEXT,
  
  -- Datos normalizados de empresa
  company_name TEXT NOT NULL,
  company_name_normalized TEXT GENERATED ALWAYS AS (
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(company_name, '\s*(S\.?L\.?|S\.?A\.?|S\.?L\.?U\.?|S\.?A\.?U\.?)\s*$', '', 'i'), '[^a-z0-9]', '', 'g'))
  ) STORED,
  
  -- Datos de contacto
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Enriquecimiento
  sector TEXT,
  subsector TEXT,
  location TEXT,
  country TEXT DEFAULT 'España',
  facturacion NUMERIC,
  ebitda NUMERIC,
  empleados INTEGER,
  
  -- Trazabilidad de origen
  source_type TEXT CHECK (source_type IN ('valuation', 'contact', 'general', 'import', 'manual')),
  source_id UUID,
  source_table TEXT,
  
  -- Estado de matching
  match_status TEXT DEFAULT 'pending' CHECK (match_status IN ('pending', 'matched', 'no_match', 'manual_review')),
  auto_match_attempted_at TIMESTAMPTZ,
  
  -- Referencias CRM (cuando se sincroniza)
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  contacto_id UUID REFERENCES contactos(id) ON DELETE SET NULL,
  
  -- Metadata
  raw_data JSONB,
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para deduplicación (parciales, solo cuando hay valor)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_leads_email_domain_unique 
  ON admin_leads(email_domain) WHERE email_domain IS NOT NULL AND email_domain != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_leads_cif_unique 
  ON admin_leads(cif) WHERE cif IS NOT NULL AND cif != '';

-- Índices para búsqueda y matching
CREATE INDEX IF NOT EXISTS idx_admin_leads_company_normalized ON admin_leads(company_name_normalized);
CREATE INDEX IF NOT EXISTS idx_admin_leads_match_status ON admin_leads(match_status);
CREATE INDEX IF NOT EXISTS idx_admin_leads_sector ON admin_leads(sector);
CREATE INDEX IF NOT EXISTS idx_admin_leads_location ON admin_leads(location);
CREATE INDEX IF NOT EXISTS idx_admin_leads_source ON admin_leads(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_admin_leads_facturacion ON admin_leads(facturacion) WHERE facturacion IS NOT NULL;

-- RLS
ALTER TABLE admin_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to admin_leads"
  ON admin_leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'editor')
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_admin_leads_updated_at
  BEFORE UPDATE ON admin_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Agregar admin_lead_id a mandate_leads
-- =====================================================

ALTER TABLE mandate_leads 
ADD COLUMN IF NOT EXISTS admin_lead_id UUID REFERENCES admin_leads(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mandate_leads_admin_lead_unique 
  ON mandate_leads(mandato_id, admin_lead_id) WHERE admin_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mandate_leads_admin_lead ON mandate_leads(admin_lead_id);