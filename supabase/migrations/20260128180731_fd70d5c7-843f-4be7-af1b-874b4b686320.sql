-- Add validation requirement columns to work_task_types
ALTER TABLE public.work_task_types
ADD COLUMN IF NOT EXISTS require_mandato boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS require_lead boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS require_description boolean NOT NULL DEFAULT false;

-- Add helpful comment
COMMENT ON COLUMN public.work_task_types.require_mandato IS 'If true, mandato selection is required for this task type';
COMMENT ON COLUMN public.work_task_types.require_lead IS 'If true, lead selection is required for this task type';
COMMENT ON COLUMN public.work_task_types.require_description IS 'If true, description is required for this task type';

-- Update existing task types with suggested configurations
-- Reunión / Puesta en Contacto - require description
UPDATE public.work_task_types 
SET require_description = true 
WHERE name ILIKE '%reunión%' OR name ILIKE '%puesta en contacto%';

-- Leads - require lead
UPDATE public.work_task_types 
SET require_lead = true 
WHERE name ILIKE '%leads%' OR name ILIKE '%llamada inicial%' OR name ILIKE '%email de seguimiento%';

-- Outbound - require lead and description
UPDATE public.work_task_types 
SET require_lead = true, require_description = true 
WHERE name ILIKE '%outbound%';