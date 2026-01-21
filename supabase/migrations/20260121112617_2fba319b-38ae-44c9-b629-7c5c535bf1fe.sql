-- =====================================================
-- MIGRACIÓN DE DATOS: Poblar admin_leads desde fuentes
-- =====================================================

-- 1. Insertar desde company_valuations (mayor prioridad, tiene más datos)
INSERT INTO admin_leads (
  email_domain, cif, company_name,
  contact_name, contact_email, contact_phone,
  sector, location, facturacion, ebitda,
  source_type, source_id, source_table, empresa_id,
  raw_data
)
SELECT 
  CASE 
    WHEN cv.email IS NOT NULL AND cv.email LIKE '%@%' 
    THEN LOWER(SPLIT_PART(cv.email, '@', 2))
    ELSE NULL 
  END as email_domain,
  NULLIF(TRIM(cv.cif), '') as cif,
  cv.company_name,
  cv.contact_name,
  LOWER(TRIM(cv.email)) as contact_email,
  cv.phone as contact_phone,
  cv.industry as sector,
  cv.location,
  cv.revenue as facturacion,
  cv.ebitda,
  'valuation' as source_type,
  cv.id as source_id,
  'company_valuations' as source_table,
  cv.empresa_id,
  jsonb_build_object(
    'valuation_id', cv.id,
    'final_valuation', cv.final_valuation,
    'created_at', cv.created_at
  ) as raw_data
FROM company_valuations cv
WHERE cv.is_deleted = false
ON CONFLICT DO NOTHING;

-- 2. Insertar desde contact_leads (no duplicar por dominio)
INSERT INTO admin_leads (
  email_domain, cif, company_name,
  contact_name, contact_email, contact_phone,
  country,
  source_type, source_id, source_table, empresa_id,
  raw_data
)
SELECT 
  CASE 
    WHEN cl.email IS NOT NULL AND cl.email LIKE '%@%' 
    THEN LOWER(SPLIT_PART(cl.email, '@', 2))
    ELSE NULL 
  END as email_domain,
  NULLIF(TRIM(cl.cif), '') as cif,
  COALESCE(cl.company, 'Sin nombre') as company_name,
  cl.full_name as contact_name,
  LOWER(TRIM(cl.email)) as contact_email,
  cl.phone as contact_phone,
  COALESCE(cl.country, 'España') as country,
  'contact' as source_type,
  cl.id as source_id,
  'contact_leads' as source_table,
  cl.empresa_id,
  jsonb_build_object(
    'contact_lead_id', cl.id,
    'status', cl.status,
    'created_at', cl.created_at
  ) as raw_data
FROM contact_leads cl
WHERE cl.is_deleted = false
ON CONFLICT DO NOTHING;

-- 3. Insertar desde general_contact_leads (cast ebitda TEXT -> NUMERIC)
INSERT INTO admin_leads (
  email_domain, cif, company_name,
  contact_name, contact_email, contact_phone,
  country, ebitda,
  source_type, source_id, source_table,
  raw_data
)
SELECT 
  CASE 
    WHEN gcl.email IS NOT NULL AND gcl.email LIKE '%@%' 
    THEN LOWER(SPLIT_PART(gcl.email, '@', 2))
    ELSE NULL 
  END as email_domain,
  NULLIF(TRIM(gcl.cif), '') as cif,
  COALESCE(gcl.company, 'Particular') as company_name,
  gcl.full_name as contact_name,
  LOWER(TRIM(gcl.email)) as contact_email,
  gcl.phone as contact_phone,
  COALESCE(gcl.country, 'España') as country,
  NULLIF(REGEXP_REPLACE(gcl.ebitda, '[^0-9.]', '', 'g'), '')::NUMERIC as ebitda,
  'general' as source_type,
  gcl.id as source_id,
  'general_contact_leads' as source_table,
  jsonb_build_object(
    'general_lead_id', gcl.id,
    'page_origin', gcl.page_origin,
    'created_at', gcl.created_at
  ) as raw_data
FROM general_contact_leads gcl
ON CONFLICT DO NOTHING;

-- =====================================================
-- VISTA vw_mandate_pipeline (usando columnas existentes)
-- =====================================================

CREATE OR REPLACE VIEW public.vw_mandate_pipeline AS
SELECT 
  -- Mandato info
  m.id as mandato_id,
  m.codigo as mandato_codigo,
  m.descripcion as mandato_descripcion,
  m.tipo as mandato_tipo,
  m.estado as mandato_estado,
  m.sectores_interes,
  m.rango_inversion_min,
  m.rango_inversion_max,
  
  -- Lead/Target info (from mandate_leads or admin_leads)
  ml.id as mandate_lead_id,
  ml.admin_lead_id,
  COALESCE(al.company_name, ml.company_name) as empresa_nombre,
  COALESCE(al.cif, ml.company_cif) as empresa_cif,
  COALESCE(al.sector, ml.sector) as sector,
  COALESCE(al.location, ml.location) as ubicacion,
  al.facturacion,
  al.ebitda,
  al.empleados,
  
  -- Contacto info
  COALESCE(al.contact_name, ml.contact_name) as contacto_nombre,
  COALESCE(al.contact_email, ml.contact_email) as contacto_email,
  al.contact_phone as contacto_telefono,
  
  -- Pipeline management
  ml.stage,
  ml.priority as prioridad,
  ml.assigned_to as responsable_id,
  au.full_name as responsable_nombre,
  ml.match_type,
  ml.match_score,
  ml.match_reason,
  ml.source as fuente,
  
  -- Fechas
  ml.created_at as fecha_asignacion,
  ml.last_activity_at as ultima_actividad,
  ml.assigned_at as fecha_responsable,
  
  -- Días en pipeline
  EXTRACT(DAY FROM NOW() - ml.created_at)::INTEGER as dias_en_pipeline,
  
  -- Referencias CRM
  ml.empresa_id,
  ml.valuation_id,
  al.source_type as lead_source_type,
  al.source_id as lead_source_id,
  al.match_status as admin_lead_match_status

FROM mandate_leads ml
LEFT JOIN admin_leads al ON ml.admin_lead_id = al.id
JOIN mandatos m ON ml.mandato_id = m.id
LEFT JOIN admin_users au ON ml.assigned_to = au.user_id;