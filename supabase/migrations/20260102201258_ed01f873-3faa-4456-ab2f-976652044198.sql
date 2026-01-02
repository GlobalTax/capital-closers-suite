-- Tabla para estados financieros históricos de empresas (PyG y Balance)
CREATE TABLE public.empresa_financial_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificación del periodo
  year integer NOT NULL,
  period_type text DEFAULT 'annual' CHECK (period_type IN ('annual', 'q1', 'q2', 'q3', 'q4', 'h1', 'h2')),
  is_audited boolean DEFAULT false,
  currency text DEFAULT 'EUR',
  
  -- CUENTA DE PÉRDIDAS Y GANANCIAS (PyG)
  revenue numeric,
  other_income numeric,
  total_income numeric,
  cost_of_sales numeric,
  gross_margin numeric,
  personnel_expenses numeric,
  other_operating_expenses numeric,
  total_opex numeric,
  ebitda numeric,
  depreciation_amortization numeric,
  ebit numeric,
  financial_result numeric,
  ebt numeric,
  taxes numeric,
  net_income numeric,
  
  -- BALANCE - Activo No Corriente
  intangible_assets numeric,
  tangible_assets numeric,
  financial_assets numeric,
  total_non_current_assets numeric,
  
  -- BALANCE - Activo Corriente
  inventories numeric,
  trade_receivables numeric,
  cash_equivalents numeric,
  other_current_assets numeric,
  total_current_assets numeric,
  total_assets numeric,
  
  -- BALANCE - Patrimonio Neto
  share_capital numeric,
  reserves numeric,
  retained_earnings numeric,
  current_year_result numeric,
  total_equity numeric,
  
  -- BALANCE - Pasivo No Corriente
  long_term_debt numeric,
  other_non_current_liabilities numeric,
  total_non_current_liabilities numeric,
  
  -- BALANCE - Pasivo Corriente
  short_term_debt numeric,
  trade_payables numeric,
  other_current_liabilities numeric,
  total_current_liabilities numeric,
  total_liabilities numeric,
  total_equity_liabilities numeric,
  
  -- Ratios calculados
  working_capital numeric,
  net_debt numeric,
  debt_ebitda_ratio numeric,
  
  -- Metadata
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'ai_image', 'import')),
  source_document_id uuid,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(empresa_id, year, period_type)
);

-- Índices
CREATE INDEX idx_financial_statements_empresa ON public.empresa_financial_statements(empresa_id);
CREATE INDEX idx_financial_statements_year ON public.empresa_financial_statements(year DESC);

-- RLS
ALTER TABLE public.empresa_financial_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver estados financieros"
  ON public.empresa_financial_statements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear estados financieros"
  ON public.empresa_financial_statements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar estados financieros"
  ON public.empresa_financial_statements FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar estados financieros"
  ON public.empresa_financial_statements FOR DELETE TO authenticated USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_financial_statements_updated_at
  BEFORE UPDATE ON public.empresa_financial_statements
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_imports_updated_at();