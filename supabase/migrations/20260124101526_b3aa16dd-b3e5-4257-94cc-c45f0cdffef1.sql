-- =====================================================
-- LIMPIEZA DE EMPRESAS DUPLICADAS (FASE 1)
-- Mantiene la empresa más antigua, reasigna referencias
-- =====================================================

-- 1. Crear función de normalización si no existe
CREATE OR REPLACE FUNCTION public.normalize_company_name(name TEXT) 
RETURNS TEXT AS $$
BEGIN
  IF name IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Crear tabla temporal con mapeo de duplicados a originales
CREATE TEMP TABLE empresa_duplicates_map AS
WITH ranked AS (
  SELECT 
    id,
    nombre,
    normalize_company_name(nombre) as nombre_normalizado,
    ROW_NUMBER() OVER (
      PARTITION BY normalize_company_name(nombre) 
      ORDER BY created_at ASC
    ) as rn
  FROM empresas
  WHERE nombre IS NOT NULL
)
SELECT 
  r.id as duplicate_id,
  r.nombre as duplicate_nombre,
  orig.id as original_id,
  orig.nombre as original_nombre
FROM ranked r
JOIN ranked orig ON r.nombre_normalizado = orig.nombre_normalizado AND orig.rn = 1
WHERE r.rn > 1;

-- 3. Reasignar contactos de empresas duplicadas a la original
UPDATE contactos 
SET empresa_principal_id = dm.original_id
FROM empresa_duplicates_map dm
WHERE contactos.empresa_principal_id = dm.duplicate_id;

-- 4. Reasignar mandatos de empresas duplicadas a la original
UPDATE mandatos 
SET empresa_principal_id = dm.original_id
FROM empresa_duplicates_map dm
WHERE mandatos.empresa_principal_id = dm.duplicate_id;

-- 5. Reasignar mandato_empresas (eliminar si ya existe la combinación)
DELETE FROM mandato_empresas 
WHERE id IN (
  SELECT me.id 
  FROM mandato_empresas me
  JOIN empresa_duplicates_map dm ON me.empresa_id = dm.duplicate_id
  WHERE EXISTS (
    SELECT 1 FROM mandato_empresas existing 
    WHERE existing.mandato_id = me.mandato_id 
    AND existing.empresa_id = dm.original_id
  )
);

UPDATE mandato_empresas 
SET empresa_id = dm.original_id
FROM empresa_duplicates_map dm
WHERE mandato_empresas.empresa_id = dm.duplicate_id;

-- 6. Reasignar company_valuations
UPDATE company_valuations 
SET empresa_id = dm.original_id
FROM empresa_duplicates_map dm
WHERE company_valuations.empresa_id = dm.duplicate_id;

-- 7. Reasignar contact_leads
UPDATE contact_leads 
SET crm_empresa_id = dm.original_id
FROM empresa_duplicates_map dm
WHERE contact_leads.crm_empresa_id = dm.duplicate_id;

-- 8. Reasignar general_contact_leads
UPDATE general_contact_leads 
SET crm_empresa_id = dm.original_id
FROM empresa_duplicates_map dm
WHERE general_contact_leads.crm_empresa_id = dm.duplicate_id;

-- 9. Reasignar admin_leads
UPDATE admin_leads 
SET empresa_id = dm.original_id
FROM empresa_duplicates_map dm
WHERE admin_leads.empresa_id = dm.duplicate_id;

-- 10. Eliminar empresas duplicadas (ya sin referencias)
DELETE FROM empresas 
WHERE id IN (SELECT duplicate_id FROM empresa_duplicates_map);

-- 11. Crear índice único para prevenir futuros duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_nombre_normalized 
ON empresas (normalize_company_name(nombre))
WHERE nombre IS NOT NULL;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS empresa_duplicates_map;