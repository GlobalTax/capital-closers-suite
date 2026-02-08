
-- Table for customizable document templates
CREATE TABLE public.deal_document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('teaser', 'cim')),
  language TEXT NOT NULL DEFAULT 'es',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  tone TEXT NOT NULL DEFAULT 'professional',
  branding JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read templates"
  ON public.deal_document_templates FOR SELECT
  USING (current_user_can_read());

CREATE POLICY "Admins can manage templates"
  ON public.deal_document_templates FOR ALL
  USING (current_user_can_write());

-- Table for generated documents
CREATE TABLE public.generated_deal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mandato_id UUID NOT NULL REFERENCES public.mandatos(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.deal_document_templates(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('teaser', 'cim')),
  language TEXT NOT NULL DEFAULT 'es',
  title TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'exported')),
  version INTEGER NOT NULL DEFAULT 1,
  pdf_storage_path TEXT,
  generated_by UUID,
  reviewed_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_deal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read generated documents"
  ON public.generated_deal_documents FOR SELECT
  USING (current_user_can_read());

CREATE POLICY "Admins can manage generated documents"
  ON public.generated_deal_documents FOR ALL
  USING (current_user_can_write());

-- Indexes
CREATE INDEX idx_generated_deal_docs_mandato ON public.generated_deal_documents(mandato_id);
CREATE INDEX idx_generated_deal_docs_type ON public.generated_deal_documents(document_type);

-- Timestamp trigger
CREATE TRIGGER update_deal_document_templates_updated_at
  BEFORE UPDATE ON public.deal_document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_deal_documents_updated_at
  BEFORE UPDATE ON public.generated_deal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default templates
INSERT INTO public.deal_document_templates (name, document_type, language, is_default, sections, tone) VALUES
('Teaser Estándar', 'teaser', 'es', true, '[
  {"order": 1, "title": "Oportunidad de Inversión", "instructions": "Descripción anónima de la empresa y el sector. NO mencionar nombre ni marcas. Usar La Compañía."},
  {"order": 2, "title": "Highlights de Inversión", "instructions": "3-5 puntos clave atractivos para inversores. Datos cuantitativos en rangos."},
  {"order": 3, "title": "Métricas Financieras Clave", "instructions": "Revenue, EBITDA, márgenes en rangos aproximados. No datos exactos."},
  {"order": 4, "title": "Tipo de Transacción", "instructions": "Descripción del tipo de operación buscada."},
  {"order": 5, "title": "Perfil de Comprador Ideal", "instructions": "Características del comprador o inversor ideal."},
  {"order": 6, "title": "Siguiente Paso", "instructions": "Proceso de contacto y próximos pasos. Incluir confidencialidad."}
]'::jsonb, 'professional'),
('Standard Teaser', 'teaser', 'en', true, '[
  {"order": 1, "title": "Investment Opportunity", "instructions": "Anonymous company and sector description. Do NOT mention name or brands. Use The Company."},
  {"order": 2, "title": "Investment Highlights", "instructions": "3-5 key attractive points for investors. Quantitative data in ranges."},
  {"order": 3, "title": "Key Financial Metrics", "instructions": "Revenue, EBITDA, margins in approximate ranges. No exact data."},
  {"order": 4, "title": "Transaction Type", "instructions": "Description of the type of transaction sought."},
  {"order": 5, "title": "Ideal Buyer Profile", "instructions": "Characteristics of the ideal buyer or investor."},
  {"order": 6, "title": "Next Steps", "instructions": "Contact process and next steps. Include confidentiality."}
]'::jsonb, 'professional'),
('CIM Completo', 'cim', 'es', true, '[
  {"order": 1, "title": "Resumen Ejecutivo", "instructions": "Síntesis de 1-2 párrafos de la oportunidad, incluyendo métricas clave y tesis de inversión."},
  {"order": 2, "title": "Descripción del Negocio", "instructions": "Modelo operativo, productos/servicios, propuesta de valor, clientes clave."},
  {"order": 3, "title": "Análisis de Mercado", "instructions": "Tamaño del mercado, tendencias, posición competitiva, ventajas."},
  {"order": 4, "title": "Equipo Directivo", "instructions": "Estructura organizativa, equipo clave, capacidades."},
  {"order": 5, "title": "Desempeño Financiero", "instructions": "Análisis de revenue, EBITDA, márgenes históricos (3-5 años). Usar datos reales proporcionados."},
  {"order": 6, "title": "Proyecciones Financieras", "instructions": "Estimaciones de crecimiento basadas en tendencias actuales y oportunidades identificadas."},
  {"order": 7, "title": "Oportunidades de Crecimiento", "instructions": "Palancas de crecimiento orgánico e inorgánico, sinergias potenciales."},
  {"order": 8, "title": "Términos de la Transacción", "instructions": "Estructura propuesta, valoración indicativa, plazos estimados."},
  {"order": 9, "title": "Anexos", "instructions": "Información complementaria relevante, disclaimers legales."}
]'::jsonb, 'professional'),
('Full CIM', 'cim', 'en', true, '[
  {"order": 1, "title": "Executive Summary", "instructions": "1-2 paragraph summary of the opportunity including key metrics and investment thesis."},
  {"order": 2, "title": "Business Description", "instructions": "Operating model, products/services, value proposition, key customers."},
  {"order": 3, "title": "Market Analysis", "instructions": "Market size, trends, competitive positioning, advantages."},
  {"order": 4, "title": "Management Team", "instructions": "Organizational structure, key team members, capabilities."},
  {"order": 5, "title": "Financial Performance", "instructions": "Revenue, EBITDA, margin analysis over 3-5 years. Use actual provided data."},
  {"order": 6, "title": "Financial Projections", "instructions": "Growth estimates based on current trends and identified opportunities."},
  {"order": 7, "title": "Growth Opportunities", "instructions": "Organic and inorganic growth levers, potential synergies."},
  {"order": 8, "title": "Transaction Terms", "instructions": "Proposed structure, indicative valuation, estimated timeline."},
  {"order": 9, "title": "Appendices", "instructions": "Supplementary information, legal disclaimers."}
]'::jsonb, 'professional');
