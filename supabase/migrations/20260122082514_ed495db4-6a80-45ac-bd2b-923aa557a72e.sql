-- Insertar el proyecto interno de Prospección Comercial
INSERT INTO mandatos (id, tipo, estado, descripcion, es_interno, codigo)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'venta',
  'activo',
  'Prospección Comercial - Seguimiento de prospectos pre-cliente',
  true,
  'INT-004'
)
ON CONFLICT (id) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  es_interno = EXCLUDED.es_interno,
  codigo = EXCLUDED.codigo;