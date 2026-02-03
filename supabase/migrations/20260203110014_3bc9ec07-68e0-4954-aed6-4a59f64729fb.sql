-- Añadir columnas de archivado a mandato_empresas
ALTER TABLE public.mandato_empresas 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id);

-- Índice para queries eficientes
CREATE INDEX IF NOT EXISTS idx_mandato_empresas_archived 
ON public.mandato_empresas(mandato_id, rol, is_archived) 
WHERE rol = 'target';

-- Comentarios para documentación
COMMENT ON COLUMN public.mandato_empresas.is_archived IS 'Target archivado - excluido de KPIs activos';
COMMENT ON COLUMN public.mandato_empresas.archived_at IS 'Fecha de archivado';
COMMENT ON COLUMN public.mandato_empresas.archived_by IS 'Usuario que archivó el target';