-- Make mandato_id nullable in mandato_time_entries
ALTER TABLE mandato_time_entries 
ALTER COLUMN mandato_id DROP NOT NULL;

-- Add contacto_id column for linking time entries to leads/contacts
ALTER TABLE mandato_time_entries
ADD COLUMN contacto_id UUID REFERENCES contactos(id) ON DELETE SET NULL;

-- Create index for contacto_id queries
CREATE INDEX idx_time_entries_contacto_id 
ON mandato_time_entries(contacto_id) 
WHERE contacto_id IS NOT NULL;

-- Constraint: must have either mandato_id OR contacto_id (or both)
ALTER TABLE mandato_time_entries
ADD CONSTRAINT chk_mandato_or_contacto 
CHECK (mandato_id IS NOT NULL OR contacto_id IS NOT NULL);

-- Add comment for documentation
COMMENT ON COLUMN mandato_time_entries.contacto_id IS 'Optional link to a contact/lead for time entries not associated with a mandate';