-- Fix unique constraint to include tipo_operacion
ALTER TABLE mandato_checklist_templates DROP CONSTRAINT IF EXISTS unique_template_orden;
ALTER TABLE mandato_checklist_templates ADD CONSTRAINT unique_template_orden UNIQUE (fase, orden, tipo_operacion);

-- Now insert Sell-Side templates
INSERT INTO mandato_checklist_templates (fase, tarea, tipo_operacion, orden, es_critica, duracion_estimada_dias, activo, responsable) VALUES
('4. Due Diligence', 'Coordinar kick-off de Due Diligence', 'venta', 1, true, 1, true, 'Equipo M&A'),
('4. Due Diligence', 'Facilitar acceso al Data Room', 'venta', 2, true, 3, true, 'Equipo M&A'),
('4. Due Diligence', 'Responder Q&A de compradores', 'venta', 3, false, 14, true, 'Equipo M&A'),
('4. Due Diligence', 'Coordinar management presentations', 'venta', 4, true, 5, true, 'Equipo M&A'),
('4. Due Diligence', 'Gestionar solicitudes adicionales de información', 'venta', 5, false, 10, true, 'Equipo M&A'),
('4. Due Diligence', 'Monitorizar avance de DD', 'venta', 6, false, 14, true, 'Equipo M&A'),
('4. Due Diligence', 'Revisar hallazgos y preparar respuestas', 'venta', 7, true, 7, true, 'Equipo M&A'),
('4. Due Diligence', 'Informe resumen DD para el cliente', 'venta', 8, true, 3, true, 'Equipo M&A'),
('5. Cierre', 'Analizar ofertas vinculantes recibidas', 'venta', 1, true, 5, true, 'Equipo M&A'),
('5. Cierre', 'Negociar términos del SPA', 'venta', 2, true, 14, true, 'Equipo M&A'),
('5. Cierre', 'Definir ajustes de precio y earn-outs', 'venta', 3, true, 7, true, 'Equipo M&A'),
('5. Cierre', 'Coordinar asesores legales del vendedor', 'venta', 4, false, 7, true, 'Equipo M&A'),
('5. Cierre', 'Gestionar condiciones suspensivas', 'venta', 5, true, 14, true, 'Equipo M&A'),
('5. Cierre', 'Preparar closing checklist', 'venta', 6, false, 3, true, 'Equipo M&A'),
('5. Cierre', 'Firma del SPA', 'venta', 7, true, 1, true, 'Equipo M&A'),
('5. Cierre', 'Closing y transferencia', 'venta', 8, true, 1, true, 'Equipo M&A');