-- Add documentation tracking fields to mandatos table
ALTER TABLE public.mandatos
ADD COLUMN IF NOT EXISTS doc_valoracion TEXT CHECK (doc_valoracion IS NULL OR doc_valoracion IN ('si', 'no', 'pendiente', 'n_a')),
ADD COLUMN IF NOT EXISTS doc_teaser TEXT CHECK (doc_teaser IS NULL OR doc_teaser IN ('si', 'no', 'actualizar', 'pendiente')),
ADD COLUMN IF NOT EXISTS doc_datapack TEXT CHECK (doc_datapack IS NULL OR doc_datapack IN ('si', 'no', 'actualizar', 'pendiente')),
ADD COLUMN IF NOT EXISTS doc_im TEXT CHECK (doc_im IS NULL OR doc_im IN ('si', 'no', 'actualizar', 'n_a', 'pendiente')),
ADD COLUMN IF NOT EXISTS doc_rod TEXT CHECK (doc_rod IS NULL OR doc_rod IN ('si', 'no', 'actualizar', 'pendiente')),

-- Add syndication platform status fields
ADD COLUMN IF NOT EXISTS platform_deale TEXT CHECK (platform_deale IS NULL OR platform_deale IN ('subido', 'por_subir', 'actualizar', 'n_a')),
ADD COLUMN IF NOT EXISTS platform_dealsuite TEXT CHECK (platform_dealsuite IS NULL OR platform_dealsuite IN ('subido', 'por_subir', 'actualizar', 'n_a')),
ADD COLUMN IF NOT EXISTS platform_arx TEXT CHECK (platform_arx IS NULL OR platform_arx IN ('subido', 'por_subir', 'actualizar', 'n_a')),

-- Add annual accounts tracking
ADD COLUMN IF NOT EXISTS ccaa_fecha DATE,
ADD COLUMN IF NOT EXISTS ccaa_disponible BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.mandatos.doc_valoracion IS 'Estado de documento de valoración: si, no, pendiente, n_a';
COMMENT ON COLUMN public.mandatos.doc_teaser IS 'Estado de teaser: si, no, actualizar, pendiente';
COMMENT ON COLUMN public.mandatos.doc_datapack IS 'Estado de datapack: si, no, actualizar, pendiente';
COMMENT ON COLUMN public.mandatos.doc_im IS 'Estado de Information Memorandum: si, no, actualizar, n_a, pendiente';
COMMENT ON COLUMN public.mandatos.doc_rod IS 'Estado de ROD: si, no, actualizar, pendiente';
COMMENT ON COLUMN public.mandatos.platform_deale IS 'Estado en plataforma Deale: subido, por_subir, actualizar, n_a';
COMMENT ON COLUMN public.mandatos.platform_dealsuite IS 'Estado en plataforma Dealsuite: subido, por_subir, actualizar, n_a';
COMMENT ON COLUMN public.mandatos.platform_arx IS 'Estado en plataforma ARX: subido, por_subir, actualizar, n_a';
COMMENT ON COLUMN public.mandatos.ccaa_fecha IS 'Fecha objetivo de cuentas anuales disponibles';
COMMENT ON COLUMN public.mandatos.ccaa_disponible IS 'Si las cuentas anuales están disponibles';