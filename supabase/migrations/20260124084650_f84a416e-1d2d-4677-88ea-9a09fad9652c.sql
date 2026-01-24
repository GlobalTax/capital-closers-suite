-- Añadir columnas de soft delete a mandato_time_entries
ALTER TABLE mandato_time_entries
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- Crear índice para filtrar registros no eliminados eficientemente
CREATE INDEX IF NOT EXISTS idx_time_entries_not_deleted 
ON mandato_time_entries(user_id, start_time) 
WHERE is_deleted = false;

-- Política: usuarios pueden soft-delete (marcar como eliminado) sus propios registros
-- Los admins ya tienen política ALL que permite todo
CREATE POLICY "Users can soft delete own time entries"
ON mandato_time_entries
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id 
  AND is_deleted = true
  AND deleted_by = auth.uid()
);