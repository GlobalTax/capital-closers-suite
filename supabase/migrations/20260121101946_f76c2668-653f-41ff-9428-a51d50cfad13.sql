-- =============================================
-- TAREAS: Sistema de Visibilidad Individual/Grupal
-- =============================================

-- Agregar nuevos campos para visibilidad
ALTER TABLE tareas 
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'individual' CHECK (tipo IN ('individual', 'grupal')),
ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS compartido_con UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS es_visible_equipo BOOLEAN DEFAULT false;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_tareas_tipo ON tareas(tipo);
CREATE INDEX IF NOT EXISTS idx_tareas_creado_por ON tareas(creado_por);
CREATE INDEX IF NOT EXISTS idx_tareas_compartido_con ON tareas USING GIN(compartido_con);

-- Migrar tareas existentes: marcar como grupales para que sigan siendo visibles
UPDATE tareas 
SET tipo = 'grupal', 
    creado_por = COALESCE(asignado_a, (SELECT user_id FROM admin_users WHERE is_active = true LIMIT 1))
WHERE tipo IS NULL OR creado_por IS NULL;

-- =============================================
-- RLS POLICIES para visibilidad de tareas
-- =============================================

-- Eliminar políticas existentes de tareas
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver tareas" ON tareas;
DROP POLICY IF EXISTS "Usuarios pueden ver tareas" ON tareas;
DROP POLICY IF EXISTS "Users can view tareas" ON tareas;
DROP POLICY IF EXISTS "tareas_select_policy" ON tareas;

-- Política SELECT: Ver tareas según tipo y permisos
CREATE POLICY "tareas_select_visibility" ON tareas
  FOR SELECT TO authenticated
  USING (
    -- Tareas grupales: visibles para todos
    tipo = 'grupal'
    OR
    -- Tareas individuales: solo creador, asignado, compartidas o visibles equipo
    (
      tipo = 'individual' AND (
        creado_por = auth.uid() OR
        asignado_a = auth.uid() OR
        auth.uid() = ANY(compartido_con) OR
        es_visible_equipo = true
      )
    )
    OR
    -- Admins pueden ver todo
    current_user_can_read()
  );

-- Política INSERT: Usuarios pueden crear tareas
DROP POLICY IF EXISTS "Usuarios pueden crear tareas" ON tareas;
DROP POLICY IF EXISTS "Users can create tareas" ON tareas;
DROP POLICY IF EXISTS "tareas_insert_policy" ON tareas;

CREATE POLICY "tareas_insert_policy" ON tareas
  FOR INSERT TO authenticated
  WITH CHECK (current_user_can_write());

-- Política UPDATE: Creador, asignado o admin pueden editar
DROP POLICY IF EXISTS "Usuarios pueden actualizar tareas" ON tareas;
DROP POLICY IF EXISTS "Users can update tareas" ON tareas;
DROP POLICY IF EXISTS "tareas_update_policy" ON tareas;

CREATE POLICY "tareas_update_policy" ON tareas
  FOR UPDATE TO authenticated
  USING (
    creado_por = auth.uid() OR 
    asignado_a = auth.uid() OR
    current_user_can_write()
  );

-- Política DELETE: Solo creador o admin pueden eliminar
DROP POLICY IF EXISTS "Usuarios pueden eliminar tareas" ON tareas;
DROP POLICY IF EXISTS "Users can delete tareas" ON tareas;
DROP POLICY IF EXISTS "tareas_delete_policy" ON tareas;

CREATE POLICY "tareas_delete_policy" ON tareas
  FOR DELETE TO authenticated
  USING (
    creado_por = auth.uid() OR
    current_user_can_write()
  );