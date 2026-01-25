-- Add buyer classification and management fields to mandato_empresas
ALTER TABLE public.mandato_empresas
ADD COLUMN IF NOT EXISTS buyer_type TEXT CHECK (buyer_type IN ('estrategico', 'financiero', 'adyacente', 'mixto')),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS no_contactar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS no_contactar_motivo TEXT,
ADD COLUMN IF NOT EXISTS tiene_conflicto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conflicto_descripcion TEXT,
ADD COLUMN IF NOT EXISTS geografia TEXT,
ADD COLUMN IF NOT EXISTS notas_internas TEXT;

-- Index for quick filtering
CREATE INDEX IF NOT EXISTS idx_mandato_empresas_buyer_filters 
ON mandato_empresas(mandato_id, buyer_type, no_contactar, tiene_conflicto);

-- GIN index for tag search
CREATE INDEX IF NOT EXISTS idx_mandato_empresas_tags 
ON mandato_empresas USING GIN (tags);