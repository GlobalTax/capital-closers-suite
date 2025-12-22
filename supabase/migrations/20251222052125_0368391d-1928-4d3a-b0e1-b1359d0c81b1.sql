-- Añadir campo valuation_id a contactos para tracking
ALTER TABLE contactos ADD COLUMN IF NOT EXISTS valuation_id uuid REFERENCES company_valuations(id);

-- Índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_contactos_valuation_id ON contactos(valuation_id) WHERE valuation_id IS NOT NULL;

-- Añadir campos útiles a empresas si no existen
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS revenue numeric;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ebitda_margin numeric;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS source_valuation_id uuid REFERENCES company_valuations(id);

-- Índice para búsqueda por source_valuation
CREATE INDEX IF NOT EXISTS idx_empresas_source_valuation ON empresas(source_valuation_id) WHERE source_valuation_id IS NOT NULL;

-- Tabla de log de sincronización
CREATE TABLE IF NOT EXISTS valuation_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at timestamptz DEFAULT now(),
  executed_by uuid,
  total_valuations integer,
  empresas_created integer,
  empresas_linked integer,
  contactos_created integer,
  contactos_linked integer,
  errors jsonb DEFAULT '[]'::jsonb,
  duration_ms integer,
  status text DEFAULT 'completed'
);

-- Habilitar RLS
ALTER TABLE valuation_sync_log ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver logs de sincronización
CREATE POLICY "Admins can view sync logs" ON valuation_sync_log
  FOR SELECT USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can insert sync logs" ON valuation_sync_log
  FOR INSERT WITH CHECK (public.is_user_admin(auth.uid()));

-- Función principal de sincronización
CREATE OR REPLACE FUNCTION sync_valuations_to_crm(p_dry_run boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record record;
  v_empresa_id uuid;
  v_contacto_id uuid;
  v_empresas_created integer := 0;
  v_empresas_linked integer := 0;
  v_contactos_created integer := 0;
  v_contactos_linked integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_total integer := 0;
  v_start_time timestamptz := now();
  v_nombre_parts text[];
  v_sector_normalized text;
  v_empleados_num integer;
BEGIN
  -- Contar total
  SELECT COUNT(*) INTO v_total 
  FROM company_valuations 
  WHERE is_deleted = false OR is_deleted IS NULL;

  -- Iterar por cada valoración
  FOR v_record IN 
    SELECT * FROM company_valuations 
    WHERE (is_deleted = false OR is_deleted IS NULL)
    ORDER BY created_at
  LOOP
    BEGIN
      -- 1. BUSCAR O CREAR EMPRESA
      v_empresa_id := NULL;
      
      -- Primero buscar por CIF
      IF v_record.cif IS NOT NULL AND trim(v_record.cif) != '' THEN
        SELECT id INTO v_empresa_id 
        FROM empresas 
        WHERE upper(trim(cif)) = upper(trim(v_record.cif))
        LIMIT 1;
      END IF;
      
      -- Si no encontró por CIF, buscar por nombre
      IF v_empresa_id IS NULL AND v_record.company_name IS NOT NULL THEN
        SELECT id INTO v_empresa_id 
        FROM empresas 
        WHERE lower(trim(nombre)) = lower(trim(v_record.company_name))
        LIMIT 1;
      END IF;
      
      -- Si no existe, crear empresa
      IF v_empresa_id IS NULL AND NOT p_dry_run THEN
        -- Normalizar sector
        v_sector_normalized := CASE lower(coalesce(v_record.industry, ''))
          WHEN 'servicios' THEN 'Servicios'
          WHEN 'comercio' THEN 'Comercio'
          WHEN 'construccion' THEN 'Construcción'
          WHEN 'construcción' THEN 'Construcción'
          WHEN 'industria' THEN 'Industria'
          WHEN 'industrial y manufactura' THEN 'Industria'
          WHEN 'tecnologia' THEN 'Tecnología'
          WHEN 'tecnología' THEN 'Tecnología'
          WHEN 'tecnología y software' THEN 'Tecnología'
          WHEN 'hosteleria' THEN 'Hostelería'
          WHEN 'hostelería' THEN 'Hostelería'
          WHEN 'sanidad' THEN 'Sanidad'
          WHEN 'salud' THEN 'Sanidad'
          WHEN 'educacion' THEN 'Educación'
          WHEN 'educación' THEN 'Educación'
          WHEN 'transporte' THEN 'Transporte'
          WHEN 'logistica' THEN 'Logística'
          WHEN 'logística' THEN 'Logística'
          WHEN 'agricultura' THEN 'Agricultura'
          WHEN 'energia' THEN 'Energía'
          WHEN 'energía' THEN 'Energía'
          WHEN 'inmobiliario' THEN 'Inmobiliario'
          ELSE coalesce(v_record.industry, 'Otros')
        END;
        
        -- Convertir employee_range a número
        v_empleados_num := CASE 
          WHEN v_record.employee_range ~ '^\d+' THEN 
            (regexp_match(v_record.employee_range, '(\d+)'))[1]::integer
          WHEN v_record.employee_range ILIKE '%1-10%' THEN 5
          WHEN v_record.employee_range ILIKE '%11-50%' THEN 30
          WHEN v_record.employee_range ILIKE '%51-100%' THEN 75
          WHEN v_record.employee_range ILIKE '%101-250%' THEN 175
          WHEN v_record.employee_range ILIKE '%251-500%' THEN 375
          WHEN v_record.employee_range ILIKE '%500%' THEN 500
          ELSE NULL
        END;
        
        INSERT INTO empresas (
          nombre,
          cif,
          sector,
          ubicacion,
          facturacion,
          ebitda,
          revenue,
          empleados,
          source_valuation_id,
          es_cliente,
          es_target,
          created_at
        ) VALUES (
          coalesce(v_record.company_name, 'Sin nombre'),
          nullif(trim(v_record.cif), ''),
          v_sector_normalized,
          v_record.location,
          v_record.revenue,
          v_record.ebitda,
          v_record.revenue,
          v_empleados_num,
          v_record.id,
          false,
          true,
          coalesce(v_record.created_at, now())
        )
        RETURNING id INTO v_empresa_id;
        
        v_empresas_created := v_empresas_created + 1;
      ELSIF v_empresa_id IS NOT NULL THEN
        v_empresas_linked := v_empresas_linked + 1;
      END IF;
      
      -- Actualizar empresa_id en la valoración
      IF v_empresa_id IS NOT NULL AND NOT p_dry_run THEN
        UPDATE company_valuations 
        SET empresa_id = v_empresa_id 
        WHERE id = v_record.id AND (empresa_id IS NULL OR empresa_id != v_empresa_id);
      END IF;
      
      -- 2. BUSCAR O CREAR CONTACTO
      v_contacto_id := NULL;
      
      -- Buscar por email
      IF v_record.email IS NOT NULL AND trim(v_record.email) != '' THEN
        SELECT id INTO v_contacto_id 
        FROM contactos 
        WHERE lower(trim(email)) = lower(trim(v_record.email))
        LIMIT 1;
      END IF;
      
      -- Si no existe, crear contacto
      IF v_contacto_id IS NULL AND v_record.email IS NOT NULL AND NOT p_dry_run THEN
        -- Dividir nombre en nombre y apellidos
        v_nombre_parts := string_to_array(trim(coalesce(v_record.contact_name, '')), ' ');
        
        INSERT INTO contactos (
          nombre,
          apellidos,
          email,
          telefono,
          empresa_principal_id,
          valuation_id,
          notas,
          created_at
        ) VALUES (
          coalesce(v_nombre_parts[1], 'Sin nombre'),
          array_to_string(v_nombre_parts[2:], ' '),
          lower(trim(v_record.email)),
          v_record.phone,
          v_empresa_id,
          v_record.id,
          'Contacto importado desde valoración automática',
          coalesce(v_record.created_at, now())
        )
        RETURNING id INTO v_contacto_id;
        
        v_contactos_created := v_contactos_created + 1;
      ELSIF v_contacto_id IS NOT NULL THEN
        v_contactos_linked := v_contactos_linked + 1;
        
        -- Actualizar valuation_id si no tiene
        IF NOT p_dry_run THEN
          UPDATE contactos 
          SET valuation_id = v_record.id,
              empresa_principal_id = COALESCE(empresa_principal_id, v_empresa_id)
          WHERE id = v_contacto_id 
            AND valuation_id IS NULL;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'valuation_id', v_record.id,
        'company_name', v_record.company_name,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Guardar log si no es dry run
  IF NOT p_dry_run THEN
    INSERT INTO valuation_sync_log (
      executed_by,
      total_valuations,
      empresas_created,
      empresas_linked,
      contactos_created,
      contactos_linked,
      errors,
      duration_ms,
      status
    ) VALUES (
      auth.uid(),
      v_total,
      v_empresas_created,
      v_empresas_linked,
      v_contactos_created,
      v_contactos_linked,
      v_errors,
      EXTRACT(MILLISECONDS FROM (now() - v_start_time))::integer,
      CASE WHEN jsonb_array_length(v_errors) > 0 THEN 'completed_with_errors' ELSE 'completed' END
    );
  END IF;
  
  RETURN jsonb_build_object(
    'dry_run', p_dry_run,
    'total_valuations', v_total,
    'empresas_created', v_empresas_created,
    'empresas_linked', v_empresas_linked,
    'contactos_created', v_contactos_created,
    'contactos_linked', v_contactos_linked,
    'errors_count', jsonb_array_length(v_errors),
    'errors', v_errors,
    'duration_ms', EXTRACT(MILLISECONDS FROM (now() - v_start_time))::integer
  );
END;
$$;

-- Función para obtener estadísticas previas
CREATE OR REPLACE FUNCTION get_valuation_sync_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_valuations', (SELECT COUNT(*) FROM company_valuations WHERE is_deleted = false OR is_deleted IS NULL),
    'valuations_with_empresa', (SELECT COUNT(*) FROM company_valuations WHERE empresa_id IS NOT NULL AND (is_deleted = false OR is_deleted IS NULL)),
    'valuations_without_empresa', (SELECT COUNT(*) FROM company_valuations WHERE empresa_id IS NULL AND (is_deleted = false OR is_deleted IS NULL)),
    'total_empresas', (SELECT COUNT(*) FROM empresas),
    'total_contactos', (SELECT COUNT(*) FROM contactos),
    'contactos_with_valuation', (SELECT COUNT(*) FROM contactos WHERE valuation_id IS NOT NULL),
    'potential_cif_matches', (
      SELECT COUNT(DISTINCT cv.id) 
      FROM company_valuations cv
      JOIN empresas e ON upper(trim(cv.cif)) = upper(trim(e.cif))
      WHERE cv.empresa_id IS NULL AND cv.cif IS NOT NULL AND trim(cv.cif) != ''
    ),
    'last_sync', (SELECT MAX(executed_at) FROM valuation_sync_log WHERE status != 'failed'),
    'sectors_distribution', (
      SELECT jsonb_agg(jsonb_build_object('sector', industry, 'count', cnt))
      FROM (
        SELECT industry, COUNT(*) as cnt 
        FROM company_valuations 
        WHERE is_deleted = false OR is_deleted IS NULL
        GROUP BY industry 
        ORDER BY cnt DESC 
        LIMIT 10
      ) s
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Función para obtener historial de sincronizaciones
CREATE OR REPLACE FUNCTION get_sync_history()
RETURNS TABLE (
  id uuid,
  executed_at timestamptz,
  total_valuations integer,
  empresas_created integer,
  empresas_linked integer,
  contactos_created integer,
  contactos_linked integer,
  errors_count integer,
  duration_ms integer,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    executed_at,
    total_valuations,
    empresas_created,
    empresas_linked,
    contactos_created,
    contactos_linked,
    jsonb_array_length(errors)::integer as errors_count,
    duration_ms,
    status
  FROM valuation_sync_log
  ORDER BY executed_at DESC
  LIMIT 20;
$$;