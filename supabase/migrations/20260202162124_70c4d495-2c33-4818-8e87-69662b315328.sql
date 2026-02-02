-- Simplify SELECT policy to allow all active team members to see ALL tasks
-- This enables the "Equipo" view where everyone sees all team tasks

DROP POLICY IF EXISTS "tareas_select_visibility" ON tareas;

CREATE POLICY "Usuarios activos ven todas las tareas del equipo"
  ON tareas FOR SELECT
  TO authenticated
  USING (current_user_can_read());