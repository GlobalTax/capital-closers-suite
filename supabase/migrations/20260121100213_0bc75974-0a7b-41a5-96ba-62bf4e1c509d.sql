-- ============================================
-- FASE 5: ELIMINAR CONSTRAINT DE EMAIL ÚNICO
-- ============================================

-- Eliminar constraint (no el índice)
ALTER TABLE contactos DROP CONSTRAINT IF EXISTS contactos_email_key;

-- Crear índice para búsquedas (permite duplicados)
CREATE INDEX IF NOT EXISTS idx_contactos_email ON contactos(LOWER(TRIM(email)));