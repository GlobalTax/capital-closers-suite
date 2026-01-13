-- Crear mandato especial para "Trabajo General M&A" (horas internas)
-- Este registro es necesario para satisfacer la FK mandato_time_entries_mandato_id_fkey

INSERT INTO mandatos (
  id,
  tipo,
  descripcion,
  estado,
  prioridad,
  created_at,
  updated_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'venta',
  'Trabajo General M&A - Horas Internas',
  'activo',
  'media',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM mandatos WHERE id = '00000000-0000-0000-0000-000000000001'
);