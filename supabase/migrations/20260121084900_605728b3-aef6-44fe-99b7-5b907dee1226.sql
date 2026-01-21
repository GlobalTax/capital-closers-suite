-- ============================================
-- FASE 3: ELIMINACIÓN SEGURA DE EMPRESAS SIN UTILIDAD
-- ============================================

-- Eliminar empresas que NO tienen:
-- - Mandatos asociados
-- - es_target = true  
-- - Contactos vinculados
-- - Origen de Capittal (valuations)
DELETE FROM empresas e
WHERE 
  NOT EXISTS (SELECT 1 FROM mandato_empresas me WHERE me.empresa_id = e.id)
  AND (e.es_target IS NULL OR e.es_target = false)
  AND NOT EXISTS (SELECT 1 FROM contactos c WHERE c.empresa_principal_id = e.id)
  AND e.source_valuation_id IS NULL
  AND e.source_pro_valuation_id IS NULL;