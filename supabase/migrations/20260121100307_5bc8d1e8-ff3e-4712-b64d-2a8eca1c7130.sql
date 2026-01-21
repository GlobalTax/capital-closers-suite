-- ============================================
-- PASO 1: LIMPIAR REFERENCIAS FK MANUALMENTE
-- ============================================

-- Limpiar referencias en company_valuations
UPDATE company_valuations SET crm_contacto_id = NULL WHERE crm_contacto_id IS NOT NULL;

-- Limpiar referencias en contact_leads
UPDATE contact_leads SET crm_contacto_id = NULL WHERE crm_contacto_id IS NOT NULL;

-- ============================================
-- PASO 2: DESVINCULAR DE MANDATOS Y ELIMINAR CONTACTOS
-- ============================================

-- Desvincular de mandatos
DELETE FROM mandato_contactos;

-- Eliminar todos los contactos
DELETE FROM contactos;