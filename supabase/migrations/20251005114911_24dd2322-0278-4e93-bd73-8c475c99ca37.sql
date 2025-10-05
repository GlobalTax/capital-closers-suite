-- Insertar datos demo para Mandatos (Compra y Venta)

-- Primero insertamos empresas demo
INSERT INTO public.empresas (id, nombre, cif, sector, subsector, ubicacion, facturacion, empleados, es_target, estado_target)
VALUES
  (gen_random_uuid(), 'TechSolutions SL', 'B12345678', 'Tecnología', 'Software', 'Madrid', 5000000, 50, false, null),
  (gen_random_uuid(), 'Distribuciones Norte SA', 'A87654321', 'Distribución', 'Logística', 'Barcelona', 12000000, 120, true, 'interesada'),
  (gen_random_uuid(), 'Manufacturas Gómez', 'B11223344', 'Industrial', 'Manufactura', 'Valencia', 8000000, 85, true, 'en_dd'),
  (gen_random_uuid(), 'Servicios Integrales', 'A99887766', 'Servicios', 'Consultoría', 'Sevilla', 3500000, 35, false, null),
  (gen_random_uuid(), 'Retail Express', 'B55667788', 'Retail', 'Comercio', 'Bilbao', 6000000, 65, true, 'contactada');

-- Insertamos contactos demo (vinculados a las empresas que acabamos de crear)
INSERT INTO public.contactos (nombre, apellidos, email, telefono, cargo, empresa_principal_id)
SELECT 'Carlos', 'Martínez', 'carlos.martinez@techsolutions.com', '+34 600 111 222', 'CEO', id
FROM public.empresas WHERE nombre = 'TechSolutions SL' LIMIT 1;

INSERT INTO public.contactos (nombre, apellidos, email, telefono, cargo, empresa_principal_id)
SELECT 'María', 'López', 'maria.lopez@distribuciones.com', '+34 600 333 444', 'Directora General', id
FROM public.empresas WHERE nombre = 'Distribuciones Norte SA' LIMIT 1;

INSERT INTO public.contactos (nombre, apellidos, email, telefono, cargo, empresa_principal_id)
SELECT 'Juan', 'Gómez', 'juan.gomez@manufacturas.com', '+34 600 555 666', 'Director Financiero', id
FROM public.empresas WHERE nombre = 'Manufacturas Gómez' LIMIT 1;

INSERT INTO public.contactos (nombre, apellidos, email, telefono, cargo, empresa_principal_id)
SELECT 'Ana', 'Rodríguez', 'ana.rodriguez@servicios.com', '+34 600 777 888', 'Socia Fundadora', id
FROM public.empresas WHERE nombre = 'Servicios Integrales' LIMIT 1;

INSERT INTO public.contactos (nombre, apellidos, email, telefono, cargo, empresa_principal_id)
SELECT 'Luis', 'Fernández', 'luis.fernandez@retail.com', '+34 600 999 000', 'Gerente', id
FROM public.empresas WHERE nombre = 'Retail Express' LIMIT 1;

-- Insertamos mandatos de COMPRA
INSERT INTO public.mandatos (tipo, empresa_principal_id, estado, valor, fecha_inicio, descripcion, prioridad)
SELECT 'compra', id, 'activo', 12000000, '2025-01-15', 'Compra de Distribuciones Norte SA - Empresa líder en logística', 'alta'
FROM public.empresas WHERE nombre = 'Distribuciones Norte SA' LIMIT 1;

INSERT INTO public.mandatos (tipo, empresa_principal_id, estado, valor, fecha_inicio, descripcion, prioridad)
SELECT 'compra', id, 'en_negociacion', 8500000, '2025-02-01', 'Adquisición de Manufacturas Gómez - Due diligence en curso', 'alta'
FROM public.empresas WHERE nombre = 'Manufacturas Gómez' LIMIT 1;

INSERT INTO public.mandatos (tipo, empresa_principal_id, estado, valor, fecha_inicio, descripcion, prioridad)
SELECT 'compra', id, 'prospecto', 6200000, '2025-03-10', 'Oportunidad de compra Retail Express - Fase inicial', 'media'
FROM public.empresas WHERE nombre = 'Retail Express' LIMIT 1;

-- Insertamos mandatos de VENTA
INSERT INTO public.mandatos (tipo, empresa_principal_id, estado, valor, fecha_inicio, descripcion, prioridad)
SELECT 'venta', id, 'activo', 5500000, '2024-12-01', 'Venta de TechSolutions SL - Búsqueda activa de comprador', 'alta'
FROM public.empresas WHERE nombre = 'TechSolutions SL' LIMIT 1;

INSERT INTO public.mandatos (tipo, empresa_principal_id, estado, valor, fecha_inicio, descripcion, prioridad)
SELECT 'venta', id, 'en_negociacion', 3800000, '2025-01-20', 'Venta de Servicios Integrales - Negociación avanzada', 'media'
FROM public.empresas WHERE nombre = 'Servicios Integrales' LIMIT 1;

INSERT INTO public.mandatos (tipo, estado, descripcion, prioridad, fecha_inicio)
VALUES ('venta', 'prospecto', 'Mandato venta empresa sector industrial - Cliente confidencial', 'baja', '2025-02-15');