-- =====================================================
-- FASE 2: TABLA DE INTERACCIONES
-- =====================================================

-- Tabla unificada para registrar todas las interacciones
CREATE TABLE IF NOT EXISTS public.interacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones (puede vincularse a contacto O empresa O ambos)
  contacto_id UUID REFERENCES public.contactos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  mandato_id UUID REFERENCES public.mandatos(id) ON DELETE SET NULL,
  
  -- Datos de la interacción
  tipo TEXT NOT NULL CHECK (tipo IN ('llamada', 'email', 'reunion', 'nota', 'whatsapp', 'linkedin', 'visita')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Metadata adicional
  duracion_minutos INTEGER,
  resultado TEXT CHECK (resultado IS NULL OR resultado IN ('positivo', 'neutral', 'negativo', 'pendiente_seguimiento')),
  siguiente_accion TEXT,
  fecha_siguiente_accion DATE,
  
  -- Vinculación con documentos (JSON con array de IDs)
  documentos_adjuntos JSONB DEFAULT '[]',
  
  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Al menos uno debe estar presente
  CHECK (contacto_id IS NOT NULL OR empresa_id IS NOT NULL)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_interacciones_contacto ON public.interacciones(contacto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_interacciones_empresa ON public.interacciones(empresa_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_interacciones_mandato ON public.interacciones(mandato_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_fecha ON public.interacciones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_interacciones_siguiente_accion ON public.interacciones(fecha_siguiente_accion) WHERE fecha_siguiente_accion IS NOT NULL;

-- RLS Policies para interacciones
ALTER TABLE public.interacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver interacciones"
  ON public.interacciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden crear interacciones"
  ON public.interacciones FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus propias interacciones"
  ON public.interacciones FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus propias interacciones"
  ON public.interacciones FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- =====================================================
-- FASE 3: TABLAS DE DOCUMENTOS COMPARTIDOS
-- =====================================================

-- Tabla relacional contacto-documentos
CREATE TABLE IF NOT EXISTS public.contacto_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id UUID NOT NULL REFERENCES public.contactos(id) ON DELETE CASCADE,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  compartido_por UUID REFERENCES auth.users(id),
  fecha_compartido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(contacto_id, documento_id)
);

-- Tabla relacional empresa-documentos
CREATE TABLE IF NOT EXISTS public.empresa_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  compartido_por UUID REFERENCES auth.users(id),
  fecha_compartido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(empresa_id, documento_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contacto_documentos_contacto ON public.contacto_documentos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_contacto_documentos_documento ON public.contacto_documentos(documento_id);
CREATE INDEX IF NOT EXISTS idx_empresa_documentos_empresa ON public.empresa_documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresa_documentos_documento ON public.empresa_documentos(documento_id);

-- RLS Policies para contacto_documentos
ALTER TABLE public.contacto_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver documentos de contactos"
  ON public.contacto_documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden compartir documentos con contactos"
  ON public.contacto_documentos FOR INSERT
  TO authenticated
  WITH CHECK (compartido_por = auth.uid());

CREATE POLICY "Usuarios pueden desvincular documentos que compartieron"
  ON public.contacto_documentos FOR DELETE
  TO authenticated
  USING (compartido_por = auth.uid());

-- RLS Policies para empresa_documentos
ALTER TABLE public.empresa_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver documentos de empresas"
  ON public.empresa_documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden compartir documentos con empresas"
  ON public.empresa_documentos FOR INSERT
  TO authenticated
  WITH CHECK (compartido_por = auth.uid());

CREATE POLICY "Usuarios pueden desvincular documentos que compartieron"
  ON public.empresa_documentos FOR DELETE
  TO authenticated
  USING (compartido_por = auth.uid());

-- =====================================================
-- TRIGGERS: Actualización automática de updated_at
-- =====================================================

-- Trigger para actualizar contactos.updated_at cuando se crea una interacción
CREATE OR REPLACE FUNCTION update_contacto_on_interaccion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contacto_id IS NOT NULL THEN
    UPDATE public.contactos 
    SET updated_at = NOW() 
    WHERE id = NEW.contacto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_contacto_on_interaccion
  AFTER INSERT ON public.interacciones
  FOR EACH ROW
  EXECUTE FUNCTION update_contacto_on_interaccion();

-- Trigger para actualizar empresas.updated_at cuando se crea una interacción
CREATE OR REPLACE FUNCTION update_empresa_on_interaccion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.empresa_id IS NOT NULL THEN
    UPDATE public.empresas 
    SET updated_at = NOW() 
    WHERE id = NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_empresa_on_interaccion
  AFTER INSERT ON public.interacciones
  FOR EACH ROW
  EXECUTE FUNCTION update_empresa_on_interaccion();

-- Trigger para updated_at en interacciones
CREATE TRIGGER update_interacciones_updated_at
  BEFORE UPDATE ON public.interacciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();