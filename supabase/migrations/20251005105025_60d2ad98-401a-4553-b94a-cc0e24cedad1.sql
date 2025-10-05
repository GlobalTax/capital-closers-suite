-- ============================================
-- FASE 1: CREACIÓN DE NUEVAS TABLAS
-- ============================================

-- Tabla de empresas (unifica clientes.empresa + empresas_target)
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cif TEXT UNIQUE,
  sector TEXT NOT NULL,
  subsector TEXT,
  ubicacion TEXT,
  facturacion NUMERIC,
  empleados INTEGER,
  sitio_web TEXT,
  descripcion TEXT,
  
  -- Datos financieros (antes en empresas_target)
  revenue NUMERIC,
  ebitda NUMERIC,
  margen_ebitda NUMERIC,
  deuda NUMERIC,
  capital_circulante NUMERIC,
  
  -- Control de targets
  es_target BOOLEAN DEFAULT false,
  estado_target TEXT CHECK (estado_target IN ('pendiente', 'contactada', 'interesada', 'rechazada', 'en_dd', 'oferta', 'cerrada')),
  nivel_interes TEXT CHECK (nivel_interes IN ('Alto', 'Medio', 'Bajo')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de contactos (reemplaza clientes)
CREATE TABLE IF NOT EXISTS public.contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellidos TEXT,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  cargo TEXT,
  empresa_principal_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  linkedin TEXT,
  notas TEXT,
  avatar TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de mandatos (nueva estructura completa)
CREATE TABLE IF NOT EXISTS public.mandatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('compra', 'venta')) DEFAULT 'venta' NOT NULL,
  empresa_principal_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  estado TEXT CHECK (estado IN ('prospecto', 'activo', 'en_negociacion', 'cerrado', 'cancelado')) DEFAULT 'prospecto' NOT NULL,
  valor NUMERIC,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_cierre DATE,
  descripcion TEXT,
  prioridad TEXT CHECK (prioridad IN ('alta', 'media', 'baja')) DEFAULT 'media',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de tareas asociadas a mandatos
CREATE TABLE IF NOT EXISTS public.tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID REFERENCES public.mandatos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')) DEFAULT 'pendiente',
  prioridad TEXT CHECK (prioridad IN ('alta', 'media', 'baja')) DEFAULT 'media',
  asignado_a UUID,
  fecha_vencimiento DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID REFERENCES public.mandatos(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('Contrato', 'NDA', 'Informe', 'Presentación', 'Financiero', 'Legal', 'Otro')) DEFAULT 'Otro',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla pivot mandato_contactos (N:N con roles)
CREATE TABLE IF NOT EXISTS public.mandato_contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID REFERENCES public.mandatos(id) ON DELETE CASCADE NOT NULL,
  contacto_id UUID REFERENCES public.contactos(id) ON DELETE CASCADE NOT NULL,
  rol TEXT CHECK (rol IN ('vendedor', 'comprador', 'asesor', 'intermediario', 'otro')) NOT NULL,
  notas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mandato_id, contacto_id, rol)
);

-- Tabla pivot mandato_empresas (N:N con roles)
CREATE TABLE IF NOT EXISTS public.mandato_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID REFERENCES public.mandatos(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  rol TEXT CHECK (rol IN ('vendedora', 'compradora', 'competidora', 'comparable', 'target', 'otro')) NOT NULL,
  notas TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mandato_id, empresa_id, rol)
);

-- ============================================
-- FASE 2: POLÍTICAS RLS
-- ============================================

-- Empresas: Solo admins
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage empresas"
  ON public.empresas
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Contactos: Solo admins
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contactos"
  ON public.contactos
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Mandatos: Solo admins
ALTER TABLE public.mandatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mandatos"
  ON public.mandatos
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Tareas: Solo admins
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tareas"
  ON public.tareas
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Documentos: Solo admins
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage documentos"
  ON public.documentos
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Mandato Contactos: Solo admins
ALTER TABLE public.mandato_contactos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mandato_contactos"
  ON public.mandato_contactos
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Mandato Empresas: Solo admins
ALTER TABLE public.mandato_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mandato_empresas"
  ON public.mandato_empresas
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- ============================================
-- FASE 3: TRIGGERS DE ACTUALIZACIÓN
-- ============================================

-- Trigger para updated_at en empresas
CREATE OR REPLACE FUNCTION update_empresas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_empresas_updated_at();

-- Trigger para updated_at en contactos
CREATE OR REPLACE FUNCTION update_contactos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_contactos_updated_at
  BEFORE UPDATE ON public.contactos
  FOR EACH ROW
  EXECUTE FUNCTION update_contactos_updated_at();

-- Trigger para updated_at en mandatos
CREATE TRIGGER trigger_update_mandatos_updated_at
  BEFORE UPDATE ON public.mandatos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en tareas
CREATE TRIGGER trigger_update_tareas_updated_at
  BEFORE UPDATE ON public.tareas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en documentos
CREATE TRIGGER trigger_update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FASE 4: ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_empresas_es_target ON public.empresas(es_target) WHERE es_target = true;
CREATE INDEX IF NOT EXISTS idx_empresas_sector ON public.empresas(sector);
CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON public.empresas(nombre);
CREATE INDEX IF NOT EXISTS idx_contactos_email ON public.contactos(email);
CREATE INDEX IF NOT EXISTS idx_contactos_empresa_principal ON public.contactos(empresa_principal_id);
CREATE INDEX IF NOT EXISTS idx_mandatos_tipo ON public.mandatos(tipo);
CREATE INDEX IF NOT EXISTS idx_mandatos_estado ON public.mandatos(estado);
CREATE INDEX IF NOT EXISTS idx_mandatos_empresa_principal ON public.mandatos(empresa_principal_id);
CREATE INDEX IF NOT EXISTS idx_tareas_mandato ON public.tareas(mandato_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON public.tareas(estado);
CREATE INDEX IF NOT EXISTS idx_documentos_mandato ON public.documentos(mandato_id);
CREATE INDEX IF NOT EXISTS idx_mandato_contactos_mandato ON public.mandato_contactos(mandato_id);
CREATE INDEX IF NOT EXISTS idx_mandato_contactos_contacto ON public.mandato_contactos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_mandato_empresas_mandato ON public.mandato_empresas(mandato_id);
CREATE INDEX IF NOT EXISTS idx_mandato_empresas_empresa ON public.mandato_empresas(empresa_id);

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE public.empresas IS 'Tabla unificada de empresas (antes clientes.empresa + empresas_target)';
COMMENT ON TABLE public.contactos IS 'Tabla de contactos (antes clientes)';
COMMENT ON TABLE public.mandatos IS 'Mandatos de compra y venta de empresas';
COMMENT ON TABLE public.mandato_contactos IS 'Relación N:N entre mandatos y contactos con roles específicos';
COMMENT ON TABLE public.mandato_empresas IS 'Relación N:N entre mandatos y empresas con roles específicos';
COMMENT ON COLUMN public.empresas.es_target IS 'Indica si la empresa es un target potencial para mandatos de compra';
COMMENT ON COLUMN public.mandatos.tipo IS 'Tipo de mandato: compra o venta';