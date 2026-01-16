-- Add enrichment fields to empresas table
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS cnae_codigo TEXT,
ADD COLUMN IF NOT EXISTS cnae_descripcion TEXT,
ADD COLUMN IF NOT EXISTS actividades_destacadas TEXT[],
ADD COLUMN IF NOT EXISTS fuente_enriquecimiento TEXT,
ADD COLUMN IF NOT EXISTS fecha_enriquecimiento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES sectors(id);

-- Add index for sector_id for faster joins
CREATE INDEX IF NOT EXISTS idx_empresas_sector_id ON public.empresas(sector_id);

-- Add comment for documentation
COMMENT ON COLUMN public.empresas.cnae_codigo IS 'CNAE code extracted from reliable source';
COMMENT ON COLUMN public.empresas.cnae_descripcion IS 'CNAE description';
COMMENT ON COLUMN public.empresas.actividades_destacadas IS 'Array of main business activities from source';
COMMENT ON COLUMN public.empresas.fuente_enriquecimiento IS 'URL of the source used for enrichment';
COMMENT ON COLUMN public.empresas.fecha_enriquecimiento IS 'Timestamp of last enrichment';
COMMENT ON COLUMN public.empresas.sector_id IS 'Foreign key to sectors table (CR Directory)';