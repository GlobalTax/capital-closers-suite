-- Añadir campo category a empresa_documentos para organizar documentos por tipo
ALTER TABLE public.empresa_documentos
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

-- Añadir constraint para validar categorías permitidas
ALTER TABLE public.empresa_documentos
ADD CONSTRAINT empresa_documentos_category_check 
CHECK (category IN ('nda', 'mandate', 'presentation', 'info_request_excel', 'general'));

-- Índice para queries eficientes por empresa y categoría
CREATE INDEX IF NOT EXISTS idx_empresa_documentos_category 
ON public.empresa_documentos(empresa_id, category, fecha_compartido DESC);

-- Comentarios para documentación
COMMENT ON COLUMN public.empresa_documentos.category IS 'Categoría del documento: nda, mandate, presentation, info_request_excel, general';

-- Crear bucket para documentos de empresas si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para company-documents
CREATE POLICY "Admins can read company documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-documents' 
  AND public.current_user_can_read()
);

CREATE POLICY "Admins can upload company documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-documents' 
  AND public.current_user_can_write()
);

CREATE POLICY "Admins can delete company documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-documents' 
  AND public.current_user_can_write()
);