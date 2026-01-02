-- Crear índice único case-insensitive sobre email en contactos
-- Permite múltiples NULL (comportamiento por defecto de PostgreSQL)

CREATE UNIQUE INDEX IF NOT EXISTS idx_contactos_email_unique_lower 
ON contactos (lower(email)) 
WHERE email IS NOT NULL;

COMMENT ON INDEX idx_contactos_email_unique_lower IS 
  'Previene emails duplicados (case-insensitive). Solo aplica cuando email no es null.';