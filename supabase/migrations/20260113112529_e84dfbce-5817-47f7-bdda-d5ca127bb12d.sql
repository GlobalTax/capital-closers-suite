-- Add potencial_search_fund column to empresas table
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS potencial_search_fund boolean DEFAULT false;

COMMENT ON COLUMN public.empresas.potencial_search_fund IS 
  'Indica si la empresa es un potencial target para Search Funds';