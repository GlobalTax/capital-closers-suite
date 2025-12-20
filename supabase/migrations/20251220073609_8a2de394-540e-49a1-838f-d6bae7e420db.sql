-- Add empresa_id to company_valuations for linking
ALTER TABLE public.company_valuations 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_valuations_empresa_id ON public.company_valuations(empresa_id);
CREATE INDEX IF NOT EXISTS idx_company_valuations_cif ON public.company_valuations(cif);
CREATE INDEX IF NOT EXISTS idx_company_valuations_company_name ON public.company_valuations(company_name);

-- Create view for empresa valuations with matching logic
CREATE OR REPLACE VIEW v_empresa_valuations AS
SELECT 
  cv.*,
  e.id as matched_empresa_id,
  e.nombre as matched_empresa_nombre,
  CASE 
    WHEN cv.empresa_id IS NOT NULL THEN 'linked'
    WHEN cv.cif IS NOT NULL AND e.cif IS NOT NULL AND LOWER(TRIM(cv.cif)) = LOWER(TRIM(e.cif)) THEN 'cif_match'
    WHEN LOWER(TRIM(cv.company_name)) = LOWER(TRIM(e.nombre)) THEN 'name_match'
    ELSE 'no_match'
  END as match_type
FROM public.company_valuations cv
LEFT JOIN public.empresas e ON 
  cv.empresa_id = e.id OR 
  (cv.cif IS NOT NULL AND e.cif IS NOT NULL AND LOWER(TRIM(cv.cif)) = LOWER(TRIM(e.cif))) OR
  LOWER(TRIM(cv.company_name)) = LOWER(TRIM(e.nombre))
WHERE cv.is_deleted = false OR cv.is_deleted IS NULL;

-- Create sector multiples view for comparables (using existing advisor_valuation_multiples)
CREATE OR REPLACE VIEW v_sector_multiples AS
SELECT 
  sector_name,
  ebitda_multiple_min,
  ebitda_multiple_median,
  ebitda_multiple_max,
  revenue_multiple_min,
  revenue_multiple_median,
  revenue_multiple_max,
  net_profit_multiple_min,
  net_profit_multiple_median,
  net_profit_multiple_max
FROM public.advisor_valuation_multiples
WHERE is_active = true
ORDER BY display_order, sector_name;

-- Function to link valuation to empresa
CREATE OR REPLACE FUNCTION link_valuation_to_empresa(
  p_valuation_id UUID,
  p_empresa_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.company_valuations 
  SET empresa_id = p_empresa_id
  WHERE id = p_valuation_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlink valuation from empresa
CREATE OR REPLACE FUNCTION unlink_valuation_from_empresa(
  p_valuation_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.company_valuations 
  SET empresa_id = NULL
  WHERE id = p_valuation_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;