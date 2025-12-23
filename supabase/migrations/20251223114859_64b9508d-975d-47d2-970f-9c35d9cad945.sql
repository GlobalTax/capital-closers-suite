-- Tabla para log de importaciones con IA
CREATE TABLE public.ai_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  extracted_data JSONB NOT NULL DEFAULT '{}',
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  contacto_id UUID REFERENCES public.contactos(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_ai_imports_created_by ON public.ai_imports(created_by);
CREATE INDEX idx_ai_imports_status ON public.ai_imports(status);
CREATE INDEX idx_ai_imports_created_at ON public.ai_imports(created_at DESC);

-- RLS
ALTER TABLE public.ai_imports ENABLE ROW LEVEL SECURITY;

-- Políticas: solo admins pueden ver y crear
CREATE POLICY "Admins can view ai_imports"
  ON public.ai_imports FOR SELECT
  USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can insert ai_imports"
  ON public.ai_imports FOR INSERT
  WITH CHECK (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update ai_imports"
  ON public.ai_imports FOR UPDATE
  USING (public.is_user_admin(auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_ai_imports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_imports_timestamp
  BEFORE UPDATE ON public.ai_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_imports_updated_at();

-- Comentarios
COMMENT ON TABLE public.ai_imports IS 'Log de importaciones de datos desde imágenes usando IA';