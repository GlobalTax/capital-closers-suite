-- ============================================
-- AGREGAR COLUMNA mandate_lead_id A mandato_time_entries
-- ============================================

ALTER TABLE mandato_time_entries 
ADD COLUMN IF NOT EXISTS mandate_lead_id UUID REFERENCES mandate_leads(id) ON DELETE SET NULL;

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_time_entries_mandate_lead ON mandato_time_entries(mandate_lead_id);

-- Actualizar constraint para permitir mandato_id, contacto_id O mandate_lead_id
-- Primero eliminar el constraint existente si existe
ALTER TABLE mandato_time_entries DROP CONSTRAINT IF EXISTS chk_mandato_or_contacto;

-- Crear nuevo constraint que incluya mandate_lead_id
ALTER TABLE mandato_time_entries ADD CONSTRAINT chk_mandato_or_lead
CHECK (mandato_id IS NOT NULL OR contacto_id IS NOT NULL OR mandate_lead_id IS NOT NULL);