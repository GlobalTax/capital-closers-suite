-- Deal Sheets: Información estandarizada para compartir con candidatos
CREATE TABLE public.deal_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID NOT NULL REFERENCES public.mandatos(id) ON DELETE CASCADE,
  
  -- Resumen ejecutivo (multilingüe)
  executive_summary_es TEXT,
  executive_summary_en TEXT,
  
  -- Highlights de inversión (array de puntos clave)
  investment_highlights_es TEXT[] DEFAULT '{}',
  investment_highlights_en TEXT[] DEFAULT '{}',
  
  -- Motivo de venta
  sale_rationale_es TEXT,
  sale_rationale_en TEXT,
  
  -- Perfil de comprador ideal
  ideal_buyer_profile_es TEXT,
  ideal_buyer_profile_en TEXT,
  
  -- Configuración de visibilidad financiera
  show_revenue_range BOOLEAN DEFAULT true,
  show_ebitda_range BOOLEAN DEFAULT true,
  show_ebitda_margin BOOLEAN DEFAULT true,
  show_employees BOOLEAN DEFAULT true,
  show_exact_financials BOOLEAN DEFAULT false,
  
  -- Rangos personalizados (si no quieren auto-calcular)
  custom_revenue_min NUMERIC,
  custom_revenue_max NUMERIC,
  custom_ebitda_min NUMERIC,
  custom_ebitda_max NUMERIC,
  
  -- Información del proceso
  transaction_type TEXT, -- '100%', 'majority', 'minority'
  valuation_multiple_min NUMERIC,
  valuation_multiple_max NUMERIC,
  expected_timeline TEXT,
  process_requirements TEXT[] DEFAULT '{}',
  
  -- Estados
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(mandato_id)
);

-- Enable RLS
ALTER TABLE public.deal_sheets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin users can manage deal_sheets"
ON public.deal_sheets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_deal_sheets_updated_at
  BEFORE UPDATE ON public.deal_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_deal_sheets_mandato_id ON public.deal_sheets(mandato_id);
CREATE INDEX idx_deal_sheets_status ON public.deal_sheets(status);

-- Comentarios
COMMENT ON TABLE public.deal_sheets IS 'Información estandarizada de mandatos para compartir con candidatos';
COMMENT ON COLUMN public.deal_sheets.status IS 'Estado: draft (borrador) o published (publicado)';