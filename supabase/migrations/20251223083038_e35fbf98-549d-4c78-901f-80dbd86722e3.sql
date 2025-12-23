
-- =====================================================
-- FUNCIÓN: Sincronizar empresas desde company_valuations
-- =====================================================
CREATE OR REPLACE FUNCTION sync_valuations_to_empresas()
RETURNS TABLE(
  empresas_created INT,
  empresas_updated INT,
  empresas_skipped INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created INT := 0;
  v_updated INT := 0;
  v_skipped INT := 0;
  v_valuation RECORD;
  v_existing_empresa_id UUID;
BEGIN
  -- Iterar sobre valuations únicas por CIF o nombre de empresa
  FOR v_valuation IN (
    SELECT DISTINCT ON (COALESCE(NULLIF(TRIM(cif), ''), company_name))
      id,
      company_name,
      NULLIF(TRIM(cif), '') as cif,
      industry,
      revenue,
      ebitda,
      location,
      employee_range,
      created_at
    FROM company_valuations
    WHERE company_name IS NOT NULL 
      AND TRIM(company_name) != ''
      AND is_deleted = false
    ORDER BY COALESCE(NULLIF(TRIM(cif), ''), company_name), created_at DESC
  )
  LOOP
    -- Buscar empresa existente por CIF o nombre
    SELECT id INTO v_existing_empresa_id
    FROM empresas
    WHERE (v_valuation.cif IS NOT NULL AND cif = v_valuation.cif)
       OR (v_valuation.cif IS NULL AND LOWER(TRIM(nombre)) = LOWER(TRIM(v_valuation.company_name)))
    LIMIT 1;
    
    IF v_existing_empresa_id IS NULL THEN
      -- Crear nueva empresa
      INSERT INTO empresas (
        nombre,
        cif,
        sector,
        ubicacion,
        revenue,
        ebitda,
        source_valuation_id,
        created_at
      ) VALUES (
        TRIM(v_valuation.company_name),
        v_valuation.cif,
        COALESCE(v_valuation.industry, 'Otros'),
        v_valuation.location,
        v_valuation.revenue,
        v_valuation.ebitda,
        v_valuation.id,
        v_valuation.created_at
      );
      v_created := v_created + 1;
    ELSE
      -- Actualizar source_valuation_id si no tiene
      UPDATE empresas 
      SET source_valuation_id = v_valuation.id,
          updated_at = NOW()
      WHERE id = v_existing_empresa_id
        AND source_valuation_id IS NULL;
      
      IF FOUND THEN
        v_updated := v_updated + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_created, v_updated, v_skipped;
END;
$$;

-- =====================================================
-- FUNCIÓN: Sincronizar contactos desde company_valuations
-- =====================================================
CREATE OR REPLACE FUNCTION sync_valuations_to_contactos()
RETURNS TABLE(
  contactos_created INT,
  contactos_updated INT,
  contactos_skipped INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created INT := 0;
  v_updated INT := 0;
  v_skipped INT := 0;
  v_valuation RECORD;
  v_existing_contacto_id UUID;
  v_empresa_id UUID;
  v_nombre TEXT;
  v_apellidos TEXT;
  v_name_parts TEXT[];
BEGIN
  -- Iterar sobre valuations únicas por email
  FOR v_valuation IN (
    SELECT DISTINCT ON (LOWER(TRIM(email)))
      id,
      contact_name,
      company_name,
      NULLIF(TRIM(cif), '') as cif,
      email,
      phone,
      created_at
    FROM company_valuations
    WHERE email IS NOT NULL 
      AND TRIM(email) != ''
      AND contact_name IS NOT NULL
      AND is_deleted = false
    ORDER BY LOWER(TRIM(email)), created_at DESC
  )
  LOOP
    -- Buscar contacto existente por email
    SELECT id INTO v_existing_contacto_id
    FROM contactos
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_valuation.email))
    LIMIT 1;
    
    IF v_existing_contacto_id IS NULL THEN
      -- Parsear nombre y apellidos
      v_name_parts := string_to_array(TRIM(v_valuation.contact_name), ' ');
      v_nombre := v_name_parts[1];
      v_apellidos := array_to_string(v_name_parts[2:], ' ');
      
      -- Buscar empresa asociada
      SELECT id INTO v_empresa_id
      FROM empresas
      WHERE (v_valuation.cif IS NOT NULL AND cif = v_valuation.cif)
         OR (v_valuation.cif IS NULL AND LOWER(TRIM(nombre)) = LOWER(TRIM(v_valuation.company_name)))
      LIMIT 1;
      
      -- Crear nuevo contacto
      INSERT INTO contactos (
        nombre,
        apellidos,
        email,
        telefono,
        empresa_principal_id,
        valuation_id,
        created_at
      ) VALUES (
        COALESCE(v_nombre, v_valuation.contact_name),
        NULLIF(v_apellidos, ''),
        LOWER(TRIM(v_valuation.email)),
        v_valuation.phone,
        v_empresa_id,
        v_valuation.id,
        v_valuation.created_at
      );
      v_created := v_created + 1;
    ELSE
      -- Actualizar valuation_id y empresa si no tiene
      SELECT id INTO v_empresa_id
      FROM empresas
      WHERE (v_valuation.cif IS NOT NULL AND cif = v_valuation.cif)
         OR (v_valuation.cif IS NULL AND LOWER(TRIM(nombre)) = LOWER(TRIM(v_valuation.company_name)))
      LIMIT 1;
      
      UPDATE contactos 
      SET valuation_id = COALESCE(valuation_id, v_valuation.id),
          empresa_principal_id = COALESCE(empresa_principal_id, v_empresa_id),
          updated_at = NOW()
      WHERE id = v_existing_contacto_id
        AND (valuation_id IS NULL OR empresa_principal_id IS NULL);
      
      IF FOUND THEN
        v_updated := v_updated + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_created, v_updated, v_skipped;
END;
$$;

-- =====================================================
-- FUNCIÓN MAESTRA: Ejecutar sincronización completa
-- =====================================================
CREATE OR REPLACE FUNCTION sync_valuations_to_crm(p_dry_run BOOLEAN DEFAULT false)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_empresas_result RECORD;
  v_contactos_result RECORD;
  v_result JSONB;
BEGIN
  IF p_dry_run THEN
    -- Solo contar qué se haría
    SELECT 
      COUNT(*) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM empresas e 
        WHERE (cv.cif IS NOT NULL AND e.cif = cv.cif)
           OR (cv.cif IS NULL AND LOWER(TRIM(e.nombre)) = LOWER(TRIM(cv.company_name)))
      )) as to_create,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM empresas e 
        WHERE ((cv.cif IS NOT NULL AND e.cif = cv.cif)
           OR (cv.cif IS NULL AND LOWER(TRIM(e.nombre)) = LOWER(TRIM(cv.company_name))))
          AND e.source_valuation_id IS NULL
      )) as to_update
    INTO v_empresas_result
    FROM (
      SELECT DISTINCT ON (COALESCE(NULLIF(TRIM(cif), ''), company_name))
        id, company_name, NULLIF(TRIM(cif), '') as cif
      FROM company_valuations
      WHERE company_name IS NOT NULL AND TRIM(company_name) != '' AND is_deleted = false
      ORDER BY COALESCE(NULLIF(TRIM(cif), ''), company_name), created_at DESC
    ) cv;
    
    SELECT 
      COUNT(*) FILTER (WHERE NOT EXISTS (
        SELECT 1 FROM contactos c WHERE LOWER(TRIM(c.email)) = LOWER(TRIM(cv.email))
      )) as to_create,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM contactos c 
        WHERE LOWER(TRIM(c.email)) = LOWER(TRIM(cv.email))
          AND (c.valuation_id IS NULL OR c.empresa_principal_id IS NULL)
      )) as to_update
    INTO v_contactos_result
    FROM (
      SELECT DISTINCT ON (LOWER(TRIM(email)))
        id, email
      FROM company_valuations
      WHERE email IS NOT NULL AND TRIM(email) != '' AND is_deleted = false
      ORDER BY LOWER(TRIM(email)), created_at DESC
    ) cv;
    
    v_result := jsonb_build_object(
      'dry_run', true,
      'empresas', jsonb_build_object(
        'to_create', COALESCE(v_empresas_result.to_create, 0),
        'to_update', COALESCE(v_empresas_result.to_update, 0)
      ),
      'contactos', jsonb_build_object(
        'to_create', COALESCE(v_contactos_result.to_create, 0),
        'to_update', COALESCE(v_contactos_result.to_update, 0)
      ),
      'duration_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INT
    );
  ELSE
    -- Ejecutar sincronización real
    SELECT * INTO v_empresas_result FROM sync_valuations_to_empresas();
    SELECT * INTO v_contactos_result FROM sync_valuations_to_contactos();
    
    v_result := jsonb_build_object(
      'dry_run', false,
      'empresas', jsonb_build_object(
        'created', v_empresas_result.empresas_created,
        'updated', v_empresas_result.empresas_updated,
        'skipped', v_empresas_result.empresas_skipped
      ),
      'contactos', jsonb_build_object(
        'created', v_contactos_result.contactos_created,
        'updated', v_contactos_result.contactos_updated,
        'skipped', v_contactos_result.contactos_skipped
      ),
      'duration_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INT,
      'executed_at', NOW()
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Dar permisos a usuarios autenticados (admins)
GRANT EXECUTE ON FUNCTION sync_valuations_to_crm(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_valuations_to_empresas() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_valuations_to_contactos() TO authenticated;
