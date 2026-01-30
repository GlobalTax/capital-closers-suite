-- Seed: Añadir tipos de tarea faltantes

-- Mandate context (core_ma) - trabajos directos de M&A
INSERT INTO work_task_types (name, description, context, default_value_type, sort_order, is_active, require_mandato, require_lead, require_description, min_description_length, default_billable)
VALUES 
  ('Análisis Financiero', 'Análisis de estados financieros, modelos, valoraciones', 'mandate', 'core_ma', 10, true, true, false, true, 20, true),
  ('Due Diligence', 'Revisión y análisis de documentación DD', 'mandate', 'core_ma', 11, true, true, false, true, 20, true),
  ('Negociación', 'Negociación de términos, SPA, condiciones', 'mandate', 'core_ma', 12, true, true, false, true, 20, true),
  ('Documentación / CIM', 'Preparación de documentación, memorándum, CIM', 'mandate', 'core_ma', 13, true, true, false, true, 20, true);

-- All context (bajo_valor) - tareas administrativas y formación
INSERT INTO work_task_types (name, description, context, default_value_type, sort_order, is_active, require_mandato, require_lead, require_description, min_description_length, default_billable)
VALUES 
  ('Administración', 'Tareas administrativas generales, reporting', 'all', 'bajo_valor', 50, true, false, false, false, 10, false),
  ('Formación', 'Capacitación, cursos, aprendizaje interno', 'all', 'bajo_valor', 51, true, false, false, false, 10, false);