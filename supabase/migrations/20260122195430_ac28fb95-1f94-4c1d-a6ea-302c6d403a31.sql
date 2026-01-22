-- Actualizar constraint para incluir 'Teaser' como tipo válido
ALTER TABLE documentos 
DROP CONSTRAINT IF EXISTS documentos_tipo_check;

ALTER TABLE documentos 
ADD CONSTRAINT documentos_tipo_check 
CHECK (tipo = ANY (ARRAY[
  'Contrato'::text, 
  'NDA'::text, 
  'Informe'::text, 
  'Presentación'::text, 
  'Financiero'::text, 
  'Legal'::text, 
  'Otro'::text, 
  'Teaser'::text
]));