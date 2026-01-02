-- Create workstream enum for Due Diligence areas
CREATE TYPE dd_workstream AS ENUM (
  'legal', 'financial', 'commercial', 'ops', 'it', 'tax', 'other'
);

-- Add workstream column to mandato_checklist_tasks
ALTER TABLE mandato_checklist_tasks 
ADD COLUMN workstream dd_workstream DEFAULT 'other';

-- Add workstream column to mandato_checklist_templates
ALTER TABLE mandato_checklist_templates 
ADD COLUMN workstream dd_workstream DEFAULT 'other';

-- Create index for efficient filtering by mandato and workstream
CREATE INDEX idx_checklist_tasks_workstream 
ON mandato_checklist_tasks(mandato_id, workstream);

-- Add descriptive comments
COMMENT ON COLUMN mandato_checklist_tasks.workstream IS 
'Due Diligence workstream area: legal, financial, commercial, ops, it, tax, other';

COMMENT ON COLUMN mandato_checklist_templates.workstream IS 
'Due Diligence workstream area for template tasks';