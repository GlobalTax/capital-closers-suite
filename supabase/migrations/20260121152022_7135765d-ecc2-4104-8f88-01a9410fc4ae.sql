-- Migración: Poblar empresa_principal_id desde mandato_empresas
-- Para mandatos que no tienen empresa_principal_id pero sí tienen empresas asociadas

UPDATE mandatos m
SET empresa_principal_id = (
  SELECT me.empresa_id 
  FROM mandato_empresas me 
  WHERE me.mandato_id = m.id 
  ORDER BY me.created_at ASC
  LIMIT 1
)
WHERE m.empresa_principal_id IS NULL
  AND EXISTS (SELECT 1 FROM mandato_empresas WHERE mandato_id = m.id);