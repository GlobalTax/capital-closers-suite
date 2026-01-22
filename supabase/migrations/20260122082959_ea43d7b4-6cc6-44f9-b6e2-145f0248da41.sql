-- Add context column to work_task_types to filter by project type
ALTER TABLE work_task_types 
ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'all' 
CHECK (context IN ('all', 'mandate', 'prospection'));

-- Update existing M&A-specific task types to 'mandate' context
UPDATE work_task_types 
SET context = 'mandate' 
WHERE name IN ('IM', 'Teaser', 'Datapack', 'Potenciales Compradores / Vendedores');

-- Insert new task types for prospection
INSERT INTO work_task_types (name, description, is_active, sort_order, context)
VALUES 
  ('Llamada inicial', 'Primera llamada con prospecto', true, 20, 'prospection'),
  ('Email de seguimiento', 'Envío de emails de seguimiento', true, 21, 'prospection'),
  ('Reunión de captación', 'Reunión presencial o virtual de captación', true, 22, 'prospection'),
  ('Demo / Presentación', 'Demostración de servicios o presentación comercial', true, 23, 'prospection'),
  ('Propuesta comercial', 'Preparación y envío de propuesta', true, 24, 'prospection'),
  ('Networking', 'Eventos, networking, relaciones comerciales', true, 25, 'prospection')
ON CONFLICT DO NOTHING;