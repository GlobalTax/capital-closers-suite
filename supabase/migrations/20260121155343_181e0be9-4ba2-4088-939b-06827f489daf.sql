-- Convertir tareas de Oriol de grupales a individuales
-- (tareas auto-asignadas que deberían ser privadas)
UPDATE tareas 
SET tipo = 'individual', updated_at = now()
WHERE creado_por = 'ad87d4c8-de2d-4b11-8cb0-b588c8ca2931'
  AND tipo = 'grupal'
  AND (asignado_a = creado_por OR asignado_a IS NULL);