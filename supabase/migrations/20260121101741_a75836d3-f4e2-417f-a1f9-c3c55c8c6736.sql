-- =============================================
-- RECUPERACIÓN DE CONTACTOS - SOLO INSERTS
-- =============================================

-- Fase 1: Insertar contactos desde company_valuations
INSERT INTO contactos (nombre, apellidos, email, telefono, source, created_at)
SELECT DISTINCT ON (LOWER(TRIM(cv.email)))
  SPLIT_PART(cv.contact_name, ' ', 1) as nombre,
  CASE 
    WHEN POSITION(' ' IN cv.contact_name) > 0 
    THEN SUBSTRING(cv.contact_name FROM POSITION(' ' IN cv.contact_name) + 1)
    ELSE NULL
  END as apellidos,
  LOWER(TRIM(cv.email)) as email,
  cv.phone as telefono,
  'capittal_valuation' as source,
  cv.created_at
FROM company_valuations cv
WHERE cv.email IS NOT NULL 
  AND TRIM(cv.email) != ''
  AND cv.contact_name IS NOT NULL
ORDER BY LOWER(TRIM(cv.email)), cv.created_at DESC
ON CONFLICT (lower(email)) WHERE email IS NOT NULL DO NOTHING;

-- Fase 2: Insertar contactos desde contact_leads
INSERT INTO contactos (nombre, apellidos, email, telefono, source, created_at)
SELECT 
  SPLIT_PART(cl.full_name, ' ', 1) as nombre,
  CASE 
    WHEN POSITION(' ' IN cl.full_name) > 0 
    THEN SUBSTRING(cl.full_name FROM POSITION(' ' IN cl.full_name) + 1)
    ELSE NULL
  END as apellidos,
  LOWER(TRIM(cl.email)) as email,
  cl.phone as telefono,
  'contact_lead' as source,
  cl.created_at
FROM contact_leads cl
WHERE cl.email IS NOT NULL 
  AND TRIM(cl.email) != ''
  AND (cl.is_deleted = false OR cl.is_deleted IS NULL)
ON CONFLICT (lower(email)) WHERE email IS NOT NULL DO NOTHING;

-- Fase 3: Vincular contactos con empresas existentes
UPDATE contactos c
SET empresa_principal_id = e.id
FROM company_valuations cv
JOIN empresas e ON e.source_valuation_id = cv.id
WHERE LOWER(TRIM(c.email)) = LOWER(TRIM(cv.email))
  AND c.empresa_principal_id IS NULL;

-- Fase 4: Restaurar FK en contact_leads (no tiene trigger problemático)
UPDATE contact_leads cl
SET crm_contacto_id = c.id
FROM contactos c
WHERE LOWER(TRIM(cl.email)) = LOWER(TRIM(c.email))
  AND cl.crm_contacto_id IS NULL;