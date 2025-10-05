-- ============================================
-- SISTEMA DE GESTIÓN DE DOCUMENTOS
-- ============================================

-- 1. Crear bucket de Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mandato-documentos',
  'mandato-documentos',
  false,
  20971520, -- 20 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear tipo enum para tipos de documentos
CREATE TYPE public.documento_tipo AS ENUM (
  'Contrato',
  'NDA',
  'Due Diligence',
  'Financiero',
  'Legal',
  'Otro'
);

-- 3. Crear tabla mandato_documentos
CREATE TABLE IF NOT EXISTS public.mandato_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  tipo public.documento_tipo NOT NULL DEFAULT 'Otro',
  descripcion TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_mandato_documentos_mandato_id ON public.mandato_documentos(mandato_id);
CREATE INDEX IF NOT EXISTS idx_mandato_documentos_uploaded_by ON public.mandato_documentos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_mandato_documentos_created_at ON public.mandato_documentos(created_at DESC);

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_mandato_documentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mandato_documentos_updated_at ON public.mandato_documentos;
CREATE TRIGGER trigger_mandato_documentos_updated_at
  BEFORE UPDATE ON public.mandato_documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mandato_documentos_updated_at();

-- 6. Habilitar RLS
ALTER TABLE public.mandato_documentos ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para mandato_documentos
CREATE POLICY "Admins can view all documents"
  ON public.mandato_documentos
  FOR SELECT
  USING (current_user_is_admin());

CREATE POLICY "Admins can insert documents"
  ON public.mandato_documentos
  FOR INSERT
  WITH CHECK (
    current_user_is_admin()
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Admins can delete documents"
  ON public.mandato_documentos
  FOR DELETE
  USING (current_user_is_admin());

-- 8. Políticas RLS para Storage
CREATE POLICY "Admins can read files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'mandato-documentos'
    AND current_user_is_admin()
  );

CREATE POLICY "Admins can upload files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'mandato-documentos'
    AND current_user_is_admin()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can delete files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'mandato-documentos'
    AND current_user_is_admin()
  );