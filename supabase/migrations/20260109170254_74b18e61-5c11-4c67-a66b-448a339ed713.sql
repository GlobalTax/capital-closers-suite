-- Add nombre_proyecto column for project codename
ALTER TABLE public.mandatos
ADD COLUMN IF NOT EXISTS nombre_proyecto TEXT;

COMMENT ON COLUMN public.mandatos.nombre_proyecto IS 'Nombre clave del proyecto (ej: Proyecto Zenit, Proyecto Olande)';