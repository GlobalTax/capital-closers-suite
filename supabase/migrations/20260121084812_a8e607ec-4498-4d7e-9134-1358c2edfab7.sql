-- ============================================
-- FASE 1: AGREGAR CAMPO ORIGEN
-- ============================================

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS origen TEXT;