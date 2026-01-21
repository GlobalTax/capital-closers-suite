-- ============================================
-- FASE 4: REASIGNAR TODAS LAS REFERENCIAS Y ELIMINAR DUPLICADOS
-- ============================================

-- Reasignar AMBAS columnas de contact_leads 
UPDATE contact_leads 
SET crm_empresa_id = '2fe1d7dc-2865-4ec4-8628-a5cd5ba27940',
    empresa_id = '2fe1d7dc-2865-4ec4-8628-a5cd5ba27940'
WHERE empresa_id = '3ff5be45-94ac-4be9-8285-6ec40bf6b32c'
   OR crm_empresa_id = '3ff5be45-94ac-4be9-8285-6ec40bf6b32c';

-- Ahora eliminar los duplicados
DELETE FROM empresas 
WHERE id IN (
  'd00dbe83-9880-45e7-af2f-30c96ab93875',
  '43af720c-9e00-4829-b356-5e2ec7ef81a9',
  'e009c281-bee2-4cca-90f0-f599466557cb',
  '3ff5be45-94ac-4be9-8285-6ec40bf6b32c',
  '729a5294-8321-4a05-8838-670bcd25ee02',
  '71470c32-1e69-4b09-a71e-92fa0722f6b3'
);

-- ============================================
-- FASE 5: ÍNDICES PARA PREVENIR DUPLICADOS FUTUROS
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_cif_unique 
ON empresas(LOWER(TRIM(cif))) 
WHERE cif IS NOT NULL AND cif != '';

CREATE INDEX IF NOT EXISTS idx_empresas_origen ON empresas(origen);