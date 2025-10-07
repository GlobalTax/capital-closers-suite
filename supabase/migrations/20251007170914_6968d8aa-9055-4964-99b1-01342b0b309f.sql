-- Add es_interno field to mandatos table
ALTER TABLE public.mandatos ADD COLUMN IF NOT EXISTS es_interno BOOLEAN DEFAULT false;

-- Expand CHECK constraints to support internal mandate tasks
ALTER TABLE public.mandato_checklist_tasks DROP CONSTRAINT IF EXISTS mandato_checklist_tasks_fase_check;
ALTER TABLE public.mandato_checklist_tasks ADD CONSTRAINT mandato_checklist_tasks_fase_check CHECK (fase IN (
  '1. Preparación',
  '2. Marketing',
  '3. Ofertas',
  'Preparación del Mandato',
  'Marketing y Originación',
  'Ofertas y Negociación',
  'Transversales'
));

ALTER TABLE public.mandato_checklist_tasks DROP CONSTRAINT IF EXISTS mandato_checklist_tasks_responsable_check;
ALTER TABLE public.mandato_checklist_tasks ADD CONSTRAINT mandato_checklist_tasks_responsable_check CHECK (responsable IN (
  'Dirección M&A',
  'Analista',
  'Asesor M&A',
  'Marketing',
  'Legal',
  'Research',
  'M&A Support',
  'Partner',
  'Analista Senior'
));

ALTER TABLE public.mandato_checklist_tasks DROP CONSTRAINT IF EXISTS mandato_checklist_tasks_sistema_check;
ALTER TABLE public.mandato_checklist_tasks ADD CONSTRAINT mandato_checklist_tasks_sistema_check CHECK (sistema IN (
  'Brevo',
  'CRM',
  'Lovable.dev',
  'DealSuite',
  'ARX',
  'Data Room',
  'Supabase',
  'Manual',
  'Excel',
  'PowerPoint',
  'Email',
  'ROD'
));

-- Create special internal mandate for generic M&A tasks
INSERT INTO public.mandatos (
  id,
  tipo,
  estado,
  descripcion,
  es_interno,
  fecha_inicio,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'venta',
  'activo',
  'Trabajo General M&A - Mandato interno para tareas generales de M&A no asociadas a operaciones específicas',
  true,
  CURRENT_DATE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert 50 generic M&A tasks
-- FASE: PREPARACIÓN DEL MANDATO (15 tareas)
INSERT INTO public.mandato_checklist_tasks (id, mandato_id, fase, tarea, descripcion, responsable, sistema, orden, created_at, updated_at) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Reunión inicial con cliente y firma de mandato', 'Primera reunión estratégica con el cliente para definir objetivos, expectativas y firmar el contrato de mandato', 'Partner', 'Manual', 1, NOW(), NOW()),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Recopilación y análisis de documentación financiera', 'Solicitar y revisar estados financieros históricos (3-5 años), cuentas anuales, balances mensuales', 'Analista Senior', 'Manual', 2, NOW(), NOW()),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Normalización de EBITDA y ajustes contables', 'Identificar y calcular ajustes one-off, extraordinarios y de normalización para obtener EBITDA ajustado', 'Analista Senior', 'Excel', 3, NOW(), NOW()),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Elaboración de modelo de valoración (DCF, múltiplos)', 'Crear modelo financiero completo con proyecciones, DCF y análisis de múltiplos comparables', 'Analista', 'Excel', 4, NOW(), NOW()),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Redacción de Executive Summary / Teaser', 'Documento de 1-2 páginas con información high-level para primeros contactos (sin revelar identidad)', 'Analista Senior', 'PowerPoint', 5, NOW(), NOW()),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Elaboración de CIM (Confidential Information Memorandum)', 'Documento completo (30-50 páginas) con toda la información detallada de la compañía', 'Analista Senior', 'PowerPoint', 6, NOW(), NOW()),
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Due Diligence interno y gap analysis', 'Identificar potenciales red flags, áreas débiles y preparar documentación faltante', 'Analista', 'Manual', 7, NOW(), NOW()),
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Análisis sectorial y benchmarking', 'Research del sector, competidores, tendencias y posicionamiento de la compañía', 'Analista', 'Manual', 8, NOW(), NOW()),
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Identificación de puntos fuertes y débiles del negocio', 'SWOT analysis detallado y estrategia de posicionamiento comercial', 'Partner', 'PowerPoint', 9, NOW(), NOW()),
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Configuración y organización de Data Room', 'Estructurar y subir toda la documentación necesaria en Data Room virtual', 'Analista', 'Data Room', 10, NOW(), NOW()),
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Preparación de materiales de marketing', 'Crear presentaciones, one-pagers y materiales adicionales de soporte', 'Analista', 'PowerPoint', 11, NOW(), NOW()),
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Definición de estrategia de salida y targets', 'Definir universo de compradores potenciales según criterios estratégicos', 'Partner', 'Manual', 12, NOW(), NOW()),
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Creación de buyer personas y criterios de inversión', 'Segmentar y caracterizar inversores ideales según perfil (estratégicos, fondos, family office)', 'Analista Senior', 'Excel', 13, NOW(), NOW()),
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Validación legal y compliance inicial', 'Revisión de aspectos legales, regulatorios y compliance con abogados', 'Partner', 'Manual', 14, NOW(), NOW()),
('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Preparación del Mandato', 'Kick-off meeting interno de equipo', 'Reunión de lanzamiento con todo el equipo para asignar responsabilidades y timelines', 'Partner', 'Manual', 15, NOW(), NOW());

-- FASE: MARKETING Y ORIGINACIÓN (18 tareas)
INSERT INTO public.mandato_checklist_tasks (id, mandato_id, fase, tarea, descripcion, responsable, sistema, orden, created_at, updated_at) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Research de inversores potenciales (buyer lists)', 'Crear long list completa de inversores según criterios definidos', 'Analista', 'Excel', 1, NOW(), NOW()),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Segmentación de targets por sector y geografía', 'Clasificar y priorizar inversores por relevancia sectorial, geográfica y capacidad de inversión', 'Analista', 'Excel', 2, NOW(), NOW()),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Outreach inicial y primeros contactos', 'Contactar inversores vía email, LinkedIn y llamadas para validar interés inicial', 'Analista Senior', 'Manual', 3, NOW(), NOW()),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Envío de Teaser a inversores cualificados', 'Distribuir Teaser a inversores que muestran interés y fit estratégico', 'Analista', 'Email', 4, NOW(), NOW()),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Gestión de NDAs y seguimiento de firmas', 'Enviar, gestionar firmas y hacer seguimiento de Non-Disclosure Agreements', 'Analista', 'Manual', 5, NOW(), NOW()),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Configuración de campañas en Brevo', 'Configurar secuencias automatizadas de email marketing en Brevo para nurturing', 'Analista', 'Brevo', 6, NOW(), NOW()),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Publicación en plataformas (DealSuite, ARX, etc.)', 'Subir operación a marketplaces de M&A para aumentar visibilidad', 'Analista', 'DealSuite', 7, NOW(), NOW()),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Actualización de ROD (Relación de Open Deals)', 'Mantener actualizado el registro interno de operaciones activas y su estado', 'Analista', 'ROD', 8, NOW(), NOW()),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Distribución de CIM a inversores interesados', 'Enviar CIM completo a inversores que firmaron NDA y validaron interés', 'Analista', 'Email', 9, NOW(), NOW()),
('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Organización de Management Presentations', 'Coordinar y preparar presentaciones del equipo directivo a inversores', 'Analista Senior', 'Manual', 10, NOW(), NOW()),
('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Coordinación de site visits y Q&A sessions', 'Organizar visitas a instalaciones y sesiones de preguntas y respuestas', 'Analista', 'Manual', 11, NOW(), NOW()),
('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Tracking de interés y pipeline de inversores', 'Seguimiento continuo del funnel de inversores y probabilidad de cierre', 'Analista Senior', 'Excel', 12, NOW(), NOW()),
('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Follow-up comercial y nurturing de leads', 'Seguimiento proactivo con inversores para mantener interés y avanzar negociación', 'Analista', 'Email', 13, NOW(), NOW()),
('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Gestión de consultas en Data Room', 'Monitorizar accesos a Data Room y responder consultas de inversores', 'Analista', 'Data Room', 14, NOW(), NOW()),
('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Respuesta a Q&A de inversores', 'Preparar y enviar respuestas a preguntas técnicas, financieras y operacionales', 'Analista Senior', 'Email', 15, NOW(), NOW()),
('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Coordinación con co-asesores (legales, financieros)', 'Coordinar trabajo con abogados, auditores y otros asesores externos', 'Partner', 'Manual', 16, NOW(), NOW()),
('20000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Actualización semanal a cliente (status reports)', 'Reportar avances, pipeline y próximos pasos al cliente semanalmente', 'Partner', 'Email', 17, NOW(), NOW()),
('20000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'Marketing y Originación', 'Preparación de shortlist de inversores finalistas', 'Seleccionar y priorizar top inversores para fase de ofertas', 'Partner', 'PowerPoint', 18, NOW(), NOW());

-- FASE: OFERTAS Y NEGOCIACIÓN (12 tareas)
INSERT INTO public.mandato_checklist_tasks (id, mandato_id, fase, tarea, descripcion, responsable, sistema, orden, created_at, updated_at) VALUES
('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Recepción y registro de NBOs (Non-Binding Offers)', 'Recopilar y registrar ofertas no vinculantes recibidas de inversores', 'Analista', 'Excel', 1, NOW(), NOW()),
('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Análisis comparativo de ofertas recibidas', 'Comparar términos económicos, estructura, timeline y condiciones de cada oferta', 'Analista Senior', 'Excel', 2, NOW(), NOW()),
('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Elaboración de grid de evaluación de ofertas', 'Crear matriz de evaluación multidimensional para comparar ofertas objetivamente', 'Analista Senior', 'Excel', 3, NOW(), NOW()),
('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Presentación de ofertas a cliente y recomendaciones', 'Presentar análisis detallado al cliente con recomendación estratégica', 'Partner', 'PowerPoint', 4, NOW(), NOW()),
('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Negociación de términos y condiciones con oferentes', 'Negociar mejoras en precio, estructura, earn-out y otras condiciones', 'Partner', 'Manual', 5, NOW(), NOW()),
('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Facilitación de reuniones entre cliente e inversores', 'Organizar y moderar reuniones directas entre vendedor y compradores finalistas', 'Analista Senior', 'Manual', 6, NOW(), NOW()),
('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Coordinación de Due Diligence de compradores', 'Facilitar proceso de Due Diligence comercial, legal, financiero y operacional', 'Analista Senior', 'Manual', 7, NOW(), NOW()),
('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Soporte en negociación de LOI (Letter of Intent)', 'Apoyar en redacción y negociación de carta de intenciones', 'Partner', 'Manual', 8, NOW(), NOW()),
('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Gestión de exclusividad y timelines', 'Negociar y gestionar períodos de exclusividad y calendarios de cierre', 'Partner', 'Manual', 9, NOW(), NOW()),
('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Coordinación de red flags y deal breakers', 'Gestionar issues críticos identificados en Due Diligence que puedan afectar la transacción', 'Partner', 'Manual', 10, NOW(), NOW()),
('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Preparación de SPA (Share Purchase Agreement)', 'Coordinar redacción del contrato de compraventa con abogados', 'Partner', 'Manual', 11, NOW(), NOW()),
('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Ofertas y Negociación', 'Cierre de operación y traspaso de documentación', 'Finalizar cierre legal, cobro de fees y entrega de documentación final', 'Partner', 'Manual', 12, NOW(), NOW());

-- FASE: TRANSVERSALES (5 tareas)
INSERT INTO public.mandato_checklist_tasks (id, mandato_id, fase, tarea, descripcion, responsable, sistema, orden, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Transversales', 'Actualización y mantenimiento de ROD', 'Mantener actualizado el dashboard interno de operaciones activas', 'Analista', 'ROD', 1, NOW(), NOW()),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Transversales', 'Reporting interno y KPIs de equipo', 'Elaborar reportes de métricas, KPIs y performance del equipo', 'Analista Senior', 'Excel', 2, NOW(), NOW()),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Transversales', 'Coordinación de equipos multidisciplinares', 'Facilitar colaboración entre diferentes áreas y partners', 'Partner', 'Manual', 3, NOW(), NOW()),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Transversales', 'Formación continua y desarrollo profesional', 'Participar en formaciones, webinars y desarrollo de skills', 'Analista', 'Manual', 4, NOW(), NOW()),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Transversales', 'Administración general y tareas de soporte', 'Gestión administrativa, organización de archivos y tareas de back-office', 'Analista', 'Manual', 5, NOW(), NOW());