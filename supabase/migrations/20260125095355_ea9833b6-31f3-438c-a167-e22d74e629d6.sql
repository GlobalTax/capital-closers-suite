-- ============================================
-- TEASER WORKFLOW: Añadir campos de estado y aprobación
-- ============================================

-- Añadir columnas de workflow a documentos
ALTER TABLE public.documentos 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Constraint para valores válidos de status
ALTER TABLE public.documentos 
ADD CONSTRAINT documentos_status_check 
CHECK (status IS NULL OR status IN ('draft', 'approved', 'published'));

-- Índice para consultas de distribución (teasers publicados)
CREATE INDEX IF NOT EXISTS idx_documentos_teaser_published 
ON public.documentos(mandato_id, idioma, status) 
WHERE tipo = 'Teaser' AND status = 'published';

-- Índice único: solo 1 teaser publicado por mandato+idioma
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_published_teaser_per_language 
ON public.documentos(mandato_id, idioma) 
WHERE tipo = 'Teaser' AND status = 'published' AND is_latest_version = true;

-- Actualizar teasers existentes: los que son is_latest_version = true pasan a 'published'
UPDATE public.documentos 
SET status = 'published', published_at = updated_at
WHERE tipo = 'Teaser' AND is_latest_version = true AND status IS NULL;

-- Los demás teasers pasan a 'approved' (ya fueron usados previamente)
UPDATE public.documentos 
SET status = 'approved'
WHERE tipo = 'Teaser' AND is_latest_version = false AND status IS NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.documentos.status IS 'Estado del documento: draft, approved, published';
COMMENT ON COLUMN public.documentos.approved_by IS 'Usuario que aprobó el documento';
COMMENT ON COLUMN public.documentos.approved_at IS 'Fecha de aprobación';
COMMENT ON COLUMN public.documentos.published_at IS 'Fecha de publicación';