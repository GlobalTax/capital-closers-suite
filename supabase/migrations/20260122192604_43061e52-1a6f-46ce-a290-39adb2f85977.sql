-- Eliminar constraint existente
ALTER TABLE document_folders 
DROP CONSTRAINT IF EXISTS document_folders_folder_type_check;

-- Crear nuevo constraint con 'teaser' incluido
ALTER TABLE document_folders 
ADD CONSTRAINT document_folders_folder_type_check 
CHECK ((folder_type = ANY (ARRAY[
  'informacion_general'::text, 
  'due_diligence'::text, 
  'negociacion'::text, 
  'cierre'::text, 
  'data_room'::text, 
  'custom'::text,
  'teaser'::text
])));