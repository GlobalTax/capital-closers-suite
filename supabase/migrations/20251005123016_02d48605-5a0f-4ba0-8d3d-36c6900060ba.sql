-- Crear tabla de tareas del checklist M&A
CREATE TABLE public.mandato_checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID NOT NULL REFERENCES public.mandatos(id) ON DELETE CASCADE,
  
  -- Información de la tarea
  fase TEXT NOT NULL CHECK (fase IN (
    '1. Preparación',
    '2. Marketing',
    '3. Ofertas'
  )),
  tarea TEXT NOT NULL,
  descripcion TEXT,
  
  -- Asignación y sistemas
  responsable TEXT CHECK (responsable IN (
    'Dirección M&A',
    'Analista',
    'Asesor M&A',
    'Marketing',
    'Legal',
    'Research',
    'M&A Support'
  )),
  sistema TEXT CHECK (sistema IN (
    'Brevo',
    'CRM',
    'Lovable.dev',
    'DealSuite',
    'ARX',
    'Data Room',
    'Supabase'
  )),
  
  -- Estado y seguimiento
  estado TEXT NOT NULL DEFAULT '⏳ Pendiente' CHECK (estado IN (
    '⏳ Pendiente',
    '🔄 En curso',
    '✅ Completa'
  )),
  fecha_limite DATE,
  fecha_completada TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  url_relacionada TEXT,
  notas TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX idx_mandato_checklist_mandato_id ON public.mandato_checklist_tasks(mandato_id);
CREATE INDEX idx_mandato_checklist_fase ON public.mandato_checklist_tasks(fase);
CREATE INDEX idx_mandato_checklist_estado ON public.mandato_checklist_tasks(estado);
CREATE INDEX idx_mandato_checklist_responsable ON public.mandato_checklist_tasks(responsable);

-- Trigger para updated_at
CREATE TRIGGER update_mandato_checklist_updated_at
  BEFORE UPDATE ON public.mandato_checklist_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.mandato_checklist_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage checklist tasks"
  ON public.mandato_checklist_tasks
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Crear tabla de plantillas de checklist
CREATE TABLE public.mandato_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase TEXT NOT NULL,
  tarea TEXT NOT NULL,
  descripcion TEXT,
  responsable TEXT,
  sistema TEXT,
  orden INTEGER NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_template_orden UNIQUE (fase, orden)
);

-- RLS para templates
ALTER TABLE public.mandato_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
  ON public.mandato_checklist_templates
  FOR ALL
  USING (current_user_is_admin());

CREATE POLICY "Anyone can read active templates"
  ON public.mandato_checklist_templates
  FOR SELECT
  USING (activo = true);

-- FASE 1: Preparación - Insertar datos semilla
INSERT INTO public.mandato_checklist_templates (fase, tarea, descripcion, responsable, sistema, orden) VALUES
('1. Preparación', 'Confirmar Mandato y NDA firmados', 'Verificar documentación legal firmada por ambas partes', 'Dirección M&A', 'CRM', 1),
('1. Preparación', 'Recibir documentación inicial del cliente', 'Estados financieros, contratos clave, estructura societaria', 'Analista', 'Data Room', 2),
('1. Preparación', 'Analizar estados financieros y normalizar EBITDA', 'Normalización de EBITDA ajustado (partidas extraordinarias)', 'Analista', 'Lovable.dev', 3),
('1. Preparación', 'Elaborar análisis estratégico (SWOT)', 'Análisis de fortalezas, debilidades, oportunidades y amenazas', 'Asesor M&A', 'Lovable.dev', 4),
('1. Preparación', 'Crear Teaser (perfil ciego)', 'Documento de 2-3 páginas sin identificar la empresa', 'Marketing', 'Lovable.dev', 5),
('1. Preparación', 'Crear CIM (Confidential Information Memorandum)', 'Memorandum completo con información detallada', 'Asesor M&A', 'Lovable.dev', 6),
('1. Preparación', 'Elaborar modelo de valoración', 'DCF y múltiplos comparables', 'Analista', 'Lovable.dev', 7),
('1. Preparación', 'Realizar Vendor Due Diligence (si aplica)', 'Due diligence preventiva para detectar red flags', 'Legal', 'Data Room', 8),
('1. Preparación', 'Configurar Data Room inicial', 'Estructura de carpetas y permisos de acceso', 'M&A Support', 'Data Room', 9),
('1. Preparación', 'Validar Teaser, CIM y valoración con el cliente', 'Reunión de validación y ajustes finales', 'Dirección M&A', 'CRM', 10);

-- FASE 2: Marketing y Contacto
INSERT INTO public.mandato_checklist_templates (fase, tarea, descripcion, responsable, sistema, orden) VALUES
('2. Marketing', 'Crear Buyer List (targets industriales, financieros, family offices)', 'Lista segmentada de compradores potenciales', 'Research', 'CRM', 1),
('2. Marketing', 'Redactar Intro Letter de presentación', 'Email de introducción personalizado', 'Marketing', 'Brevo', 2),
('2. Marketing', 'Subir oportunidad a DealSuite y ARX', 'Publicación en plataformas M&A', 'M&A Support', 'DealSuite', 3),
('2. Marketing', 'Enviar Teaser bajo NDA a interesados', 'Campaña masiva segmentada', 'Marketing', 'Brevo', 4),
('2. Marketing', 'Registrar NDAs firmados en Brevo / Data Room', 'Control de acceso y trazabilidad', 'M&A Support', 'Data Room', 5),
('2. Marketing', 'Activar Data Room filtrado con CIM', 'Acceso controlado por NDA', 'M&A Support', 'Data Room', 6),
('2. Marketing', 'Incluir la operación en la ROD (Relación de Open Deals)', 'Actualizar pipeline interno', 'Dirección M&A', 'CRM', 7),
('2. Marketing', 'Enviar email masivo desde Brevo a base segmentada', 'Campaña de outreach automatizada', 'Marketing', 'Brevo', 8),
('2. Marketing', 'Gestionar Q&A Tracking Sheet', 'Registro de preguntas y respuestas', 'Analista', 'CRM', 9),
('2. Marketing', 'Realizar seguimiento comercial (reuniones, feedback, aclaraciones)', 'Gestión de relaciones con compradores', 'Asesor M&A', 'CRM', 10),
('2. Marketing', 'Actualizar pipeline de compradores en CRM', 'Actualización continua del estado', 'M&A Support', 'CRM', 11),
('2. Marketing', 'Definir timeline del proceso (envío, feedback, recepción de NBO)', 'Calendario de hitos críticos', 'Dirección M&A', 'CRM', 12);

-- FASE 3: Ofertas
INSERT INTO public.mandato_checklist_templates (fase, tarea, descripcion, responsable, sistema, orden) VALUES
('3. Ofertas', 'Recibir NBOs (Non-Binding Offers)', 'Recopilación de ofertas no vinculantes', 'Dirección M&A', 'CRM', 1),
('3. Ofertas', 'Evaluar y comparar ofertas recibidas', 'Análisis comparativo multidimensional', 'Analista', 'Lovable.dev', 2),
('3. Ofertas', 'Preparar cuadro comparativo de NBOs', 'Tabla resumen para presentación al cliente', 'Analista', 'Lovable.dev', 3),
('3. Ofertas', 'Reunión interna de evaluación (Capittal + Cliente)', 'Sesión de análisis y decisión estratégica', 'Dirección M&A', 'CRM', 4),
('3. Ofertas', 'Solicitar aclaraciones o mejoras de oferta', 'Negociación de términos iniciales', 'Asesor M&A', 'CRM', 5),
('3. Ofertas', 'Recibir o redactar LOI (Letter of Intent)', 'Carta de intención con términos vinculantes', 'Legal', 'CRM', 6),
('3. Ofertas', 'Negociar condiciones de exclusividad', 'Periodo y alcance de exclusividad', 'Dirección M&A', 'CRM', 7),
('3. Ofertas', 'Firmar LOI', 'Formalización del acuerdo preliminar', 'Dirección M&A', 'CRM', 8),
('3. Ofertas', 'Comunicar exclusividad al resto de interesados', 'Notificación formal a otros compradores', 'Marketing', 'Brevo', 9),
('3. Ofertas', 'Preparar kick-off de Due Diligence (checklist y calendario)', 'Inicio del proceso de DD exhaustivo', 'Legal', 'Data Room', 10);

-- Función para copiar plantillas a un mandato
CREATE OR REPLACE FUNCTION public.copy_checklist_template_to_mandato(p_mandato_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_inserted INTEGER;
BEGIN
  INSERT INTO public.mandato_checklist_tasks (
    mandato_id, fase, tarea, descripcion, responsable, sistema, orden
  )
  SELECT 
    p_mandato_id, fase, tarea, descripcion, responsable, sistema, orden
  FROM public.mandato_checklist_templates
  WHERE activo = true
  ORDER BY fase, orden;
  
  GET DIAGNOSTICS rows_inserted = ROW_COUNT;
  RETURN rows_inserted;
END;
$$;