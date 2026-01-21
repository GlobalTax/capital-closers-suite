-- Fix the cascade delete issue to prevent data loss when mandatos are deleted
-- Change from ON DELETE CASCADE to ON DELETE SET NULL

-- First, drop the existing foreign key constraint
ALTER TABLE mandato_time_entries 
DROP CONSTRAINT IF EXISTS mandato_time_entries_mandato_id_fkey;

-- Re-add the constraint with SET NULL instead of CASCADE
ALTER TABLE mandato_time_entries
ADD CONSTRAINT mandato_time_entries_mandato_id_fkey
FOREIGN KEY (mandato_id) REFERENCES mandatos(id) ON DELETE SET NULL;

-- Recreate the internal projects that were deleted (using valid constraint values)
INSERT INTO mandatos (codigo, nombre_proyecto, tipo, estado, es_interno, prioridad, categoria)
VALUES 
  ('INT-001', 'Business Development', 'venta', 'activo', true, 'media', 'asesoria'),
  ('INT-003', 'Administrativo', 'venta', 'activo', true, 'media', 'asesoria');