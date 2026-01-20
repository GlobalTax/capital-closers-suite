-- Actualizar el registro existente de Trabajo General a Business Development
UPDATE mandatos 
SET descripcion = 'Captación de operaciones, networking, prospección',
    es_interno = true,
    codigo = 'INT-001'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Insertar proyecto interno: Reuniones Internas
INSERT INTO mandatos (id, tipo, categoria, estado, descripcion, es_interno, codigo)
VALUES ('00000000-0000-0000-0000-000000000002', 'venta', 'operacion_ma', 'activo', 
        'Reuniones de equipo, formación, alineación', true, 'INT-002');

-- Insertar proyecto interno: Administrativo
INSERT INTO mandatos (id, tipo, categoria, estado, descripcion, es_interno, codigo)
VALUES ('00000000-0000-0000-0000-000000000003', 'venta', 'operacion_ma', 'activo', 
        'Tareas administrativas, reporting, CRM', true, 'INT-003');