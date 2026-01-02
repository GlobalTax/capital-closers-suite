-- ============================================
-- BILLING RATES TABLE
-- ============================================

-- Create billing_rates table for hourly rates by role
CREATE TABLE public.billing_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.admin_role NOT NULL,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_role_effective_period UNIQUE (role, effective_from)
);

-- Insert initial rates (adjustable by admin)
INSERT INTO public.billing_rates (role, hourly_rate, description) VALUES
  ('super_admin', 250, 'Socio/Director'),
  ('admin', 180, 'Manager/Senior'),
  ('editor', 120, 'Analista'),
  ('viewer', 80, 'Junior/Soporte');

-- Indexes
CREATE INDEX idx_billing_rates_role ON public.billing_rates(role);
CREATE INDEX idx_billing_rates_active ON public.billing_rates(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.billing_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view billing rates"
  ON public.billing_rates FOR SELECT
  USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Super admins can manage billing rates"
  ON public.billing_rates FOR ALL
  USING (public.is_user_super_admin(auth.uid()));

-- Updated at trigger
CREATE TRIGGER update_billing_rates_updated_at
  BEFORE UPDATE ON public.billing_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VIEW: MANDATO COSTS
-- ============================================

CREATE OR REPLACE VIEW public.v_mandato_costs AS
SELECT 
  m.id AS mandato_id,
  m.descripcion,
  m.tipo,
  m.estado,
  e.nombre AS empresa_nombre,
  
  -- Total hours
  COALESCE(SUM(te.duration_minutes) / 60.0, 0) AS total_hours,
  COALESCE(SUM(CASE WHEN te.is_billable THEN te.duration_minutes ELSE 0 END) / 60.0, 0) AS billable_hours,
  
  -- Total cost (hours × rate)
  COALESCE(SUM(
    (te.duration_minutes / 60.0) * COALESCE(br.hourly_rate, 100)
  ), 0) AS total_cost,
  
  -- Billable cost
  COALESCE(SUM(
    CASE WHEN te.is_billable 
    THEN (te.duration_minutes / 60.0) * COALESCE(br.hourly_rate, 100)
    ELSE 0 END
  ), 0) AS billable_cost,
  
  -- Billable percentage
  CASE 
    WHEN SUM(te.duration_minutes) > 0 
    THEN ROUND((SUM(CASE WHEN te.is_billable THEN te.duration_minutes ELSE 0 END)::NUMERIC / SUM(te.duration_minutes) * 100), 1)
    ELSE 0 
  END AS billable_percentage,
  
  -- Entry count
  COUNT(te.id) AS entries_count
  
FROM public.mandatos m
LEFT JOIN public.empresas e ON m.empresa_principal_id = e.id
LEFT JOIN public.mandato_time_entries te ON te.mandato_id = m.id
LEFT JOIN public.admin_users au ON te.user_id = au.user_id
LEFT JOIN public.billing_rates br ON au.role = br.role AND br.is_active = true
GROUP BY m.id, m.descripcion, m.tipo, m.estado, e.nombre;

-- Comment
COMMENT ON VIEW public.v_mandato_costs IS 'Aggregated cost view per mandate based on time entries and billing rates';