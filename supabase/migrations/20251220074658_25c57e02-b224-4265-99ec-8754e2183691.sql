-- ============================================
-- DYNAMIC M&A CHECKLIST - Database Migration
-- ============================================

-- 1. Crear tabla de fases dinámicas
CREATE TABLE IF NOT EXISTS public.checklist_fases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  tipo_operacion text NOT NULL CHECK (tipo_operacion IN ('compra', 'venta', 'ambos')),
  orden integer NOT NULL,
  color text DEFAULT '#6366f1',
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nombre, tipo_operacion)
);

-- Enable RLS
ALTER TABLE public.checklist_fases ENABLE ROW LEVEL SECURITY;

-- Policies for checklist_fases (read for authenticated, write for admins)
CREATE POLICY "Authenticated users can read fases" 
ON public.checklist_fases FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage fases" 
ON public.checklist_fases FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

-- 2. Modificar tabla mandato_checklist_templates
ALTER TABLE public.mandato_checklist_templates 
ADD COLUMN IF NOT EXISTS tipo_operacion text DEFAULT 'venta',
ADD COLUMN IF NOT EXISTS duracion_estimada_dias integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS es_critica boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dependencias uuid[] DEFAULT '{}';

-- 3. Añadir campos adicionales a mandato_checklist_tasks
ALTER TABLE public.mandato_checklist_tasks
ADD COLUMN IF NOT EXISTS duracion_estimada_dias integer,
ADD COLUMN IF NOT EXISTS es_critica boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dependencias uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fecha_inicio date,
ADD COLUMN IF NOT EXISTS tipo_operacion text;

-- 4. Insertar fases para COMPRA
INSERT INTO public.checklist_fases (nombre, tipo_operacion, orden, color, descripcion) VALUES
('1. Definición', 'compra', 1, '#8b5cf6', 'Definir criterios de búsqueda y firmar mandato'),
('2. Búsqueda', 'compra', 2, '#3b82f6', 'Identificar y filtrar targets potenciales'),
('3. Aproximación', 'compra', 3, '#10b981', 'Contacto inicial y firma de NDAs'),
('4. Due Diligence', 'compra', 4, '#f59e0b', 'Análisis exhaustivo del target'),
('5. Cierre', 'compra', 5, '#ef4444', 'Negociación final y cierre de la transacción')
ON CONFLICT (nombre, tipo_operacion) DO NOTHING;

-- 5. Insertar fases para VENTA
INSERT INTO public.checklist_fases (nombre, tipo_operacion, orden, color, descripcion) VALUES
('1. Preparación', 'venta', 1, '#8b5cf6', 'Preparar documentación y valoración'),
('2. Marketing', 'venta', 2, '#3b82f6', 'Identificar compradores y preparar materiales'),
('3. Ofertas', 'venta', 3, '#10b981', 'Gestionar ofertas y negociaciones'),
('4. Due Diligence', 'venta', 4, '#f59e0b', 'Facilitar el proceso de DD'),
('5. Cierre', 'venta', 5, '#ef4444', 'Negociación final y cierre')
ON CONFLICT (nombre, tipo_operacion) DO NOTHING;

-- 6. Insertar templates de COMPRA
INSERT INTO public.mandato_checklist_templates (fase, tarea, descripcion, responsable, sistema, orden, tipo_operacion, duracion_estimada_dias, es_critica) VALUES
-- Fase 1: Definición
('1. Definición', 'Firmar mandato y NDA', 'Formalizar el mandato de búsqueda y acuerdos de confidencialidad', 'Dirección M&A', 'CRM', 1, 'compra', 3, true),
('1. Definición', 'Definir criterios de búsqueda', 'Establecer sector, tamaño, geografía y otros parámetros', 'Dirección M&A', 'CRM', 2, 'compra', 2, true),
('1. Definición', 'Establecer rango de inversión', 'Definir presupuesto mínimo y máximo para la adquisición', 'Dirección M&A', 'CRM', 3, 'compra', 1, false),
('1. Definición', 'Definir timeline objetivo', 'Establecer fechas objetivo para cada fase del proceso', 'Analista', 'CRM', 4, 'compra', 1, false),
('1. Definición', 'Identificar sinergias buscadas', 'Documentar las sinergias estratégicas esperadas', 'Dirección M&A', 'CRM', 5, 'compra', 2, false),
('1. Definición', 'Validar capacidad financiera', 'Confirmar disponibilidad de fondos o financiación', 'Dirección M&A', 'CRM', 6, 'compra', 3, true),

-- Fase 2: Búsqueda
('2. Búsqueda', 'Crear long list de targets', 'Identificar universo amplio de empresas potenciales', 'Research', 'CRM', 1, 'compra', 5, true),
('2. Búsqueda', 'Análisis inicial de targets', 'Desktop due diligence de empresas identificadas', 'Analista', 'CRM', 2, 'compra', 7, false),
('2. Búsqueda', 'Filtrar a short list', 'Reducir lista a targets más prometedores', 'Dirección M&A', 'CRM', 3, 'compra', 3, true),
('2. Búsqueda', 'Priorizar targets por fit estratégico', 'Ordenar targets según ajuste con criterios', 'Dirección M&A', 'CRM', 4, 'compra', 2, false),
('2. Búsqueda', 'Preparar ficha de cada target', 'Documentar información clave de cada empresa', 'Analista', 'CRM', 5, 'compra', 5, false),
('2. Búsqueda', 'Validar short list con cliente', 'Obtener aprobación del cliente para targets prioritarios', 'Dirección M&A', 'CRM', 6, 'compra', 2, true),
('2. Búsqueda', 'Definir estrategia de aproximación', 'Planificar cómo contactar cada target', 'Dirección M&A', 'CRM', 7, 'compra', 2, false),
('2. Búsqueda', 'Identificar contactos clave por target', 'Localizar decision makers en cada empresa', 'Research', 'CRM', 8, 'compra', 3, false),

-- Fase 3: Aproximación
('3. Aproximación', 'Contacto inicial con target prioritario', 'Primer acercamiento al target principal', 'Dirección M&A', 'CRM', 1, 'compra', 5, true),
('3. Aproximación', 'Enviar NDA y obtener firma', 'Gestionar acuerdo de confidencialidad', 'Legal', 'CRM', 2, 'compra', 5, true),
('3. Aproximación', 'Recibir información inicial', 'Obtener primeros datos del target', 'Analista', 'Data Room', 3, 'compra', 7, false),
('3. Aproximación', 'Primera valoración indicativa', 'Estimación inicial del valor del target', 'Analista', 'CRM', 4, 'compra', 3, false),
('3. Aproximación', 'Presentar expresión de interés', 'Formalizar interés inicial al target', 'Dirección M&A', 'CRM', 5, 'compra', 2, true),
('3. Aproximación', 'Agendar reuniones de management', 'Coordinar meetings con equipo directivo', 'M&A Support', 'CRM', 6, 'compra', 5, false),

-- Fase 4: Due Diligence
('4. Due Diligence', 'Kick-off de Due Diligence', 'Iniciar proceso formal de DD', 'Dirección M&A', 'Data Room', 1, 'compra', 1, true),
('4. Due Diligence', 'DD Financiera', 'Análisis de estados financieros e histórico', 'Analista', 'Data Room', 2, 'compra', 14, true),
('4. Due Diligence', 'DD Legal', 'Revisión de estructura legal y contratos', 'Legal', 'Data Room', 3, 'compra', 14, true),
('4. Due Diligence', 'DD Fiscal', 'Análisis de situación fiscal y contingencias', 'Analista', 'Data Room', 4, 'compra', 10, true),
('4. Due Diligence', 'DD Operativa', 'Revisión de operaciones y procesos', 'Analista', 'Data Room', 5, 'compra', 10, false),
('4. Due Diligence', 'DD Comercial', 'Análisis de clientes, mercado y competencia', 'Analista', 'Data Room', 6, 'compra', 10, false),
('4. Due Diligence', 'DD Tecnológica', 'Evaluación de sistemas y tecnología', 'Analista', 'Data Room', 7, 'compra', 7, false),
('4. Due Diligence', 'DD de RRHH', 'Revisión de equipo y contratos laborales', 'Analista', 'Data Room', 8, 'compra', 7, false),
('4. Due Diligence', 'Informe consolidado de DD', 'Compilar hallazgos de todas las áreas', 'Dirección M&A', 'CRM', 9, 'compra', 5, true),
('4. Due Diligence', 'Red flags y mitigantes', 'Identificar riesgos y proponer soluciones', 'Dirección M&A', 'CRM', 10, 'compra', 3, true),

-- Fase 5: Cierre
('5. Cierre', 'Preparar oferta vinculante (BO)', 'Redactar binding offer final', 'Dirección M&A', 'CRM', 1, 'compra', 5, true),
('5. Cierre', 'Negociar SPA', 'Negociar contrato de compraventa', 'Legal', 'CRM', 2, 'compra', 14, true),
('5. Cierre', 'Definir estructura de la transacción', 'Establecer forma de pago y condiciones', 'Dirección M&A', 'CRM', 3, 'compra', 5, false),
('5. Cierre', 'Obtener aprobaciones internas', 'Conseguir OK de comités y consejos', 'Dirección M&A', 'CRM', 4, 'compra', 7, true),
('5. Cierre', 'Cerrar condiciones suspensivas', 'Cumplir conditions precedent', 'Legal', 'CRM', 5, 'compra', 14, true),
('5. Cierre', 'Firma de SPA', 'Signing del contrato', 'Dirección M&A', 'CRM', 6, 'compra', 1, true),
('5. Cierre', 'Closing de la operación', 'Cierre formal y transferencia', 'Dirección M&A', 'CRM', 7, 'compra', 3, true),
('5. Cierre', 'Integración post-cierre (PMI)', 'Plan de integración post-merger', 'Dirección M&A', 'CRM', 8, 'compra', 30, false)
ON CONFLICT DO NOTHING;

-- 7. Actualizar templates de venta existentes con nuevos campos
UPDATE public.mandato_checklist_templates 
SET tipo_operacion = 'venta', 
    duracion_estimada_dias = COALESCE(duracion_estimada_dias, 7),
    es_critica = COALESCE(es_critica, false)
WHERE tipo_operacion IS NULL OR tipo_operacion = '';

-- 8. Función RPC para copiar template por tipo de operación
CREATE OR REPLACE FUNCTION public.copy_checklist_template_by_type(
  p_mandato_id uuid,
  p_tipo_operacion text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Eliminar tareas existentes del mandato
  DELETE FROM mandato_checklist_tasks WHERE mandato_id = p_mandato_id;
  
  -- Copiar del template según el tipo
  INSERT INTO mandato_checklist_tasks (
    mandato_id,
    fase,
    tarea,
    descripcion,
    responsable,
    sistema,
    orden,
    estado,
    tipo_operacion,
    duracion_estimada_dias,
    es_critica,
    dependencias
  )
  SELECT 
    p_mandato_id,
    fase,
    tarea,
    descripcion,
    responsable,
    sistema,
    orden,
    '⏳ Pendiente',
    p_tipo_operacion,
    duracion_estimada_dias,
    es_critica,
    dependencias
  FROM mandato_checklist_templates
  WHERE tipo_operacion = p_tipo_operacion
    AND activo = true
  ORDER BY orden;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- 9. Función para calcular progreso detallado
CREATE OR REPLACE FUNCTION public.get_checklist_progress(p_mandato_id uuid)
RETURNS TABLE (
  fase text,
  total bigint,
  completadas bigint,
  en_curso bigint,
  pendientes bigint,
  vencidas bigint,
  porcentaje numeric,
  dias_estimados numeric,
  tareas_criticas bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.fase::text,
    COUNT(*)::bigint as total,
    COUNT(*) FILTER (WHERE t.estado = '✅ Completa')::bigint as completadas,
    COUNT(*) FILTER (WHERE t.estado = '🔄 En curso')::bigint as en_curso,
    COUNT(*) FILTER (WHERE t.estado = '⏳ Pendiente')::bigint as pendientes,
    COUNT(*) FILTER (WHERE t.fecha_limite < CURRENT_DATE AND t.estado != '✅ Completa')::bigint as vencidas,
    ROUND(
      (COUNT(*) FILTER (WHERE t.estado = '✅ Completa')::numeric / NULLIF(COUNT(*), 0)) * 100, 
      0
    ) as porcentaje,
    COALESCE(SUM(t.duracion_estimada_dias), 0)::numeric as dias_estimados,
    COUNT(*) FILTER (WHERE t.es_critica = true)::bigint as tareas_criticas
  FROM mandato_checklist_tasks t
  WHERE t.mandato_id = p_mandato_id
  GROUP BY t.fase
  ORDER BY t.fase;
END;
$$;

-- 10. Función para obtener tareas vencidas
CREATE OR REPLACE FUNCTION public.get_overdue_tasks(p_mandato_id uuid)
RETURNS TABLE (
  id uuid,
  tarea text,
  fase text,
  fecha_limite date,
  es_critica boolean,
  dias_vencida integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.tarea,
    t.fase,
    t.fecha_limite,
    t.es_critica,
    (CURRENT_DATE - t.fecha_limite)::integer as dias_vencida
  FROM mandato_checklist_tasks t
  WHERE t.mandato_id = p_mandato_id
    AND t.fecha_limite < CURRENT_DATE
    AND t.estado != '✅ Completa'
  ORDER BY t.es_critica DESC, t.fecha_limite ASC;
END;
$$;

-- 11. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_mandato_fase 
ON mandato_checklist_tasks(mandato_id, fase);

CREATE INDEX IF NOT EXISTS idx_checklist_tasks_estado 
ON mandato_checklist_tasks(estado);

CREATE INDEX IF NOT EXISTS idx_checklist_tasks_fecha_limite 
ON mandato_checklist_tasks(fecha_limite) 
WHERE fecha_limite IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checklist_templates_tipo 
ON mandato_checklist_templates(tipo_operacion);

-- 12. Trigger para actualizar last_activity_at en mandatos
CREATE OR REPLACE FUNCTION public.update_mandato_on_checklist_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE mandatos 
  SET updated_at = now()
  WHERE id = COALESCE(NEW.mandato_id, OLD.mandato_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_checklist_update_mandato ON mandato_checklist_tasks;
CREATE TRIGGER trg_checklist_update_mandato
AFTER INSERT OR UPDATE OR DELETE ON mandato_checklist_tasks
FOR EACH ROW
EXECUTE FUNCTION update_mandato_on_checklist_change();