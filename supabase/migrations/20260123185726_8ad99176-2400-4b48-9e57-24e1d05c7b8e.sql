-- =============================================
-- OUTBOUND CAMPAIGNS & PROSPECTS
-- Sistema de prospección sectorial con Apollo
-- =============================================

-- 1. Tabla de campañas de outbound
CREATE TABLE public.outbound_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Segmentación
  sector_id UUID REFERENCES public.sectors(id),
  sector_name TEXT, -- Cached for display
  
  -- Filtros de búsqueda Apollo
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  apollo_keywords TEXT[], -- Keywords mapeados del sector
  
  -- Estado y métricas
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'searching', 'enriching', 'completed', 'archived')),
  total_found INTEGER DEFAULT 0,
  total_enriched INTEGER DEFAULT 0,
  total_imported INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  
  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_search_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Tabla de prospectos descubiertos
CREATE TABLE public.outbound_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.outbound_campaigns(id) ON DELETE CASCADE,
  
  -- Datos básicos de Apollo (gratis)
  apollo_id TEXT,
  apollo_org_id TEXT,
  nombre TEXT NOT NULL,
  apellidos TEXT,
  cargo TEXT,
  empresa TEXT,
  linkedin_url TEXT,
  website_domain TEXT,
  
  -- Datos de empresa
  company_linkedin_url TEXT,
  company_size TEXT,
  company_revenue_range TEXT,
  company_industry TEXT,
  company_location TEXT,
  
  -- Datos enriquecidos (requieren créditos)
  email TEXT,
  email_status TEXT,
  telefono TEXT,
  telefono_type TEXT,
  
  -- Estado del prospecto
  enrichment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriching', 'enriched', 'failed', 'skipped')),
  import_status TEXT DEFAULT 'not_imported' CHECK (import_status IN ('not_imported', 'imported', 'duplicate', 'rejected')),
  
  -- Tracking
  enriched_at TIMESTAMP WITH TIME ZONE,
  imported_at TIMESTAMP WITH TIME ZONE,
  imported_lead_id UUID,
  
  -- Selección y notas
  is_selected BOOLEAN DEFAULT false,
  notes TEXT,
  score INTEGER,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabla de mapeo sector -> keywords Apollo
CREATE TABLE public.apollo_sector_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
  sector_name TEXT NOT NULL,
  apollo_keywords TEXT[] NOT NULL DEFAULT '{}',
  apollo_industries TEXT[] DEFAULT '{}',
  sic_codes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(sector_id)
);

-- 4. Índices para rendimiento
CREATE INDEX idx_outbound_campaigns_status ON public.outbound_campaigns(status);
CREATE INDEX idx_outbound_campaigns_created_by ON public.outbound_campaigns(created_by);
CREATE INDEX idx_outbound_campaigns_sector ON public.outbound_campaigns(sector_id);

CREATE INDEX idx_outbound_prospects_campaign ON public.outbound_prospects(campaign_id);
CREATE INDEX idx_outbound_prospects_enrichment ON public.outbound_prospects(enrichment_status);
CREATE INDEX idx_outbound_prospects_import ON public.outbound_prospects(import_status);
CREATE INDEX idx_outbound_prospects_selected ON public.outbound_prospects(campaign_id, is_selected) WHERE is_selected = true;
CREATE INDEX idx_outbound_prospects_email ON public.outbound_prospects(email) WHERE email IS NOT NULL;

-- 5. Trigger para updated_at
CREATE TRIGGER update_outbound_campaigns_updated_at
  BEFORE UPDATE ON public.outbound_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outbound_prospects_updated_at
  BEFORE UPDATE ON public.outbound_prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_apollo_sector_mapping_updated_at
  BEFORE UPDATE ON public.apollo_sector_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RLS Policies
ALTER TABLE public.outbound_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apollo_sector_mapping ENABLE ROW LEVEL SECURITY;

-- Campañas
CREATE POLICY "Users can view all campaigns"
  ON public.outbound_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create campaigns"
  ON public.outbound_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update campaigns"
  ON public.outbound_campaigns FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete their campaigns"
  ON public.outbound_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Prospectos
CREATE POLICY "Users can view prospects"
  ON public.outbound_prospects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert prospects"
  ON public.outbound_prospects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update prospects"
  ON public.outbound_prospects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete prospects"
  ON public.outbound_prospects FOR DELETE
  TO authenticated
  USING (true);

-- Mapeo de sectores
CREATE POLICY "Anyone can view sector mapping"
  ON public.apollo_sector_mapping FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sector mapping"
  ON public.apollo_sector_mapping FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- 7. Insertar mapeos iniciales de sectores
INSERT INTO public.apollo_sector_mapping (sector_name, apollo_keywords, apollo_industries) VALUES
  ('Tecnología y Software', 
   ARRAY['software', 'saas', 'technology', 'IT services', 'cloud computing', 'cybersecurity'],
   ARRAY['information technology and services', 'computer software', 'internet']),
  ('Industrial y Manufacturero',
   ARRAY['manufacturing', 'industrial', 'machinery', 'automation', 'engineering'],
   ARRAY['industrial automation', 'machinery', 'manufacturing']),
  ('Salud y Farmacéutico',
   ARRAY['healthcare', 'pharma', 'medical devices', 'biotech', 'life sciences'],
   ARRAY['hospital & health care', 'pharmaceuticals', 'medical devices']),
  ('Servicios Profesionales',
   ARRAY['consulting', 'professional services', 'advisory', 'legal', 'accounting'],
   ARRAY['management consulting', 'accounting', 'legal services']),
  ('Retail y Consumo',
   ARRAY['retail', 'consumer goods', 'ecommerce', 'FMCG', 'food and beverage'],
   ARRAY['retail', 'consumer goods', 'food & beverages']),
  ('Energía y Utilities',
   ARRAY['energy', 'utilities', 'renewable', 'oil and gas', 'power'],
   ARRAY['oil & energy', 'utilities', 'renewables & environment']),
  ('Construcción e Inmobiliario',
   ARRAY['construction', 'real estate', 'property', 'building materials'],
   ARRAY['construction', 'real estate', 'building materials']),
  ('Transporte y Logística',
   ARRAY['logistics', 'transportation', 'supply chain', 'freight', 'shipping'],
   ARRAY['logistics and supply chain', 'transportation/trucking/railroad']),
  ('Educación y Formación',
   ARRAY['education', 'training', 'e-learning', 'edtech'],
   ARRAY['education management', 'e-learning', 'higher education']),
  ('Finanzas y Seguros',
   ARRAY['finance', 'banking', 'insurance', 'fintech', 'investment'],
   ARRAY['financial services', 'banking', 'insurance']);