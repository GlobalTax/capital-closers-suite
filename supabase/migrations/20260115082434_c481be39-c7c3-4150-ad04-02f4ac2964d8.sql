-- Actualizar bucket para aceptar PowerPoint y más formatos
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/msword',
  'application/vnd.ms-excel',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif'
]
WHERE id = 'mandato-documentos';

-- Añadir columna idioma a documentos para diferenciar teasers ES/EN
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT NULL;

COMMENT ON COLUMN documentos.idioma IS 'Idioma del documento: ES (español), EN (inglés), NULL para no especificado';