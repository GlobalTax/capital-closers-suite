-- Primero eliminar las filas que causarán conflicto antes de actualizar
DELETE FROM mandato_kanban_config 
WHERE id = '4d2d50f9-f581-42db-ba9d-7f22d48f4d94';

-- Ahora actualizar los fase_id
UPDATE mandato_kanban_config 
SET fase_id = 'prospeccion' 
WHERE fase_id = 'activo';

UPDATE mandato_kanban_config 
SET fase_id = 'loi' 
WHERE fase_id = 'Recopilando Información';

UPDATE mandato_kanban_config 
SET fase_id = 'due_diligence' 
WHERE fase_id = 'en_negociacion';

UPDATE mandato_kanban_config 
SET fase_id = 'negociacion' 
WHERE fase_id = 'cerrado';

UPDATE mandato_kanban_config 
SET fase_id = 'cierre' 
WHERE fase_id = 'Due_Diligence';

UPDATE mandato_kanban_config 
SET fase_id = 'propuesta' 
WHERE fase_id = 'prospecto';