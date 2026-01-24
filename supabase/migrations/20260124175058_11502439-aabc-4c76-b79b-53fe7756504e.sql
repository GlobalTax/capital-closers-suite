-- Insert the 4 internal projects with valid categoria value
INSERT INTO mandatos (id, tipo, estado, categoria, descripcion, es_interno, nombre_proyecto)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'venta', 'activo', 'asesoria', 'Horas generales de desarrollo de negocio', true, 'Business Development'),
  ('00000000-0000-0000-0000-000000000002', 'venta', 'activo', 'asesoria', 'Reuniones de equipo y formación interna', true, 'Reuniones Internas'),
  ('00000000-0000-0000-0000-000000000003', 'venta', 'activo', 'asesoria', 'Tareas administrativas y reporting', true, 'Administrativo'),
  ('00000000-0000-0000-0000-000000000004', 'venta', 'activo', 'asesoria', 'Tiempo con prospectos pre-cliente', true, 'Prospección Comercial')
ON CONFLICT (id) DO NOTHING;