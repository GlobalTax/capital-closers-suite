-- ============================================
-- FASE 2: ACTUALIZAR ORIGEN DE EMPRESAS EXISTENTES
-- ============================================

UPDATE empresas SET origen = 'capittal_valuation' 
WHERE (source_valuation_id IS NOT NULL OR source_pro_valuation_id IS NOT NULL)
  AND origen IS NULL;

UPDATE empresas SET origen = 'target_manual' 
WHERE es_target = true AND origen IS NULL;

UPDATE empresas SET origen = 'cliente_mandato'
WHERE id IN (SELECT DISTINCT empresa_id FROM mandato_empresas) 
  AND origen IS NULL;

UPDATE empresas SET origen = 'contacto_vinculado'
WHERE id IN (SELECT DISTINCT empresa_principal_id FROM contactos WHERE empresa_principal_id IS NOT NULL)
  AND origen IS NULL;