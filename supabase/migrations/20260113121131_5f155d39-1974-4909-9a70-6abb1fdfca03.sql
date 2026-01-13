-- Añadir columna descripcion a la tabla documentos
ALTER TABLE public.documentos 
ADD COLUMN IF NOT EXISTS descripcion text;

COMMENT ON COLUMN public.documentos.descripcion IS 
  'Descripción opcional del documento proporcionada durante la subida';