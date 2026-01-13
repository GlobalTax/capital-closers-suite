-- Eliminar constraint actual que no incluye "urgente"
ALTER TABLE public.mandatos 
DROP CONSTRAINT IF EXISTS mandatos_prioridad_check;

-- Crear nueva constraint con "urgente" incluido
ALTER TABLE public.mandatos 
ADD CONSTRAINT mandatos_prioridad_check 
CHECK ((prioridad = ANY (ARRAY['urgente'::text, 'alta'::text, 'media'::text, 'baja'::text])));