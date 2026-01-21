-- Fix: Las tareas individuales deben ser verdaderamente privadas
-- Los admins no deberían poder ver las tareas individuales de otros usuarios

-- Eliminar la política actual que permite a admins ver todas las tareas
DROP POLICY IF EXISTS tareas_select_visibility ON tareas;

-- Crear nueva política que respeta la privacidad de tareas individuales
CREATE POLICY tareas_select_visibility ON tareas
FOR SELECT
USING (
  -- 1. Tareas grupales: visibles para todos los usuarios activos del equipo
  (tipo = 'grupal' AND current_user_can_read())
  OR
  -- 2. Tareas individuales: solo creador, asignado, compartido, o marcadas como visibles para equipo
  (tipo = 'individual' AND (
    creado_por = auth.uid() OR
    asignado_a = auth.uid() OR
    auth.uid() = ANY(compartido_con) OR
    es_visible_equipo = true
  ))
);