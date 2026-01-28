-- Add 'internal' to the context check constraint for work_task_types
ALTER TABLE work_task_types
DROP CONSTRAINT IF EXISTS work_task_types_context_check;

ALTER TABLE work_task_types
ADD CONSTRAINT work_task_types_context_check
CHECK (context IN ('all', 'mandate', 'prospection', 'internal'));