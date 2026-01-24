-- Deshabilitar temporalmente el trigger de auditoría
ALTER TABLE sf_funds DISABLE TRIGGER trg_sf_fund_audit;

-- 1. Eliminar duplicados (conservar el más antiguo por nombre)
WITH ranked AS (
  SELECT id, name,
    ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC) as rn
  FROM sf_funds
)
DELETE FROM sf_funds 
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- Rehabilitar el trigger
ALTER TABLE sf_funds ENABLE TRIGGER trg_sf_fund_audit;

-- 2. Crear índice único para prevenir futuros duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_sf_funds_name_unique ON sf_funds(LOWER(TRIM(name)));

-- 3. Auto-asignar primer contacto como principal donde no hay ninguno marcado
WITH first_contact AS (
  SELECT DISTINCT ON (fund_id) id, fund_id
  FROM sf_people
  WHERE fund_id NOT IN (
    SELECT DISTINCT fund_id FROM sf_people WHERE is_primary_contact = true
  )
  ORDER BY fund_id, created_at ASC
)
UPDATE sf_people
SET is_primary_contact = true
WHERE id IN (SELECT id FROM first_contact);