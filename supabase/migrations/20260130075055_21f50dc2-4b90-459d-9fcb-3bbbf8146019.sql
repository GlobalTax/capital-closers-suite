-- ============================================
-- FASE 3: FUNCIONES CON search_path
-- ============================================

-- 1. normalize_company_name
CREATE OR REPLACE FUNCTION public.normalize_company_name(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  IF name IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')));
END;
$function$;

-- 2. link_valuation_to_empresa
CREATE OR REPLACE FUNCTION public.link_valuation_to_empresa(p_valuation_id uuid, p_empresa_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.company_valuations 
  SET empresa_id = p_empresa_id
  WHERE id = p_valuation_id;
  RETURN FOUND;
END;
$function$;

-- 3. get_lead_ai_stats
CREATE OR REPLACE FUNCTION public.get_lead_ai_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSON;
  total_reports_count INT;
  useful_count INT;
  feedback_count INT;
BEGIN
  SELECT COUNT(*) INTO total_reports_count
  FROM lead_ai_reports
  WHERE generation_status = 'completed';
  
  SELECT COUNT(*) INTO useful_count
  FROM lead_ai_report_feedback
  WHERE is_useful = true;
  
  SELECT COUNT(*) INTO feedback_count
  FROM lead_ai_report_feedback
  WHERE is_useful IS NOT NULL;
  
  SELECT json_build_object(
    'total_reports', total_reports_count,
    'useful_percentage', 
      CASE 
        WHEN feedback_count > 0 THEN ROUND((useful_count::NUMERIC / feedback_count) * 100, 1)
        ELSE 0
      END,
    'total_cost', COALESCE((
      SELECT SUM(cost_usd) 
      FROM lead_ai_reports 
      WHERE generation_status = 'completed'
    ), 0),
    'total_tokens', COALESCE((
      SELECT SUM(tokens_used) 
      FROM lead_ai_reports 
      WHERE generation_status = 'completed'
    ), 0),
    'feedback_count', feedback_count,
    'by_type', (
      SELECT json_agg(type_stats)
      FROM (
        SELECT 
          COALESCE(lead_type, 'valuation') as lead_type,
          COUNT(*) as count,
          ROUND(AVG(cost_usd), 5) as avg_cost,
          ROUND(AVG(tokens_used), 0) as avg_tokens
        FROM lead_ai_reports
        WHERE generation_status = 'completed'
        GROUP BY lead_type
      ) type_stats
    )
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- 4. log_campaign_cost_change
CREATE OR REPLACE FUNCTION public.log_campaign_cost_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO campaign_cost_history (
    campaign_cost_id,
    campaign_name,
    channel,
    results,
    amount,
    cost_per_result,
    daily_budget,
    monthly_budget,
    target_cpl,
    internal_status,
    delivery_status,
    notes,
    changed_by,
    change_type
  ) VALUES (
    NEW.id,
    NEW.campaign_name,
    NEW.channel,
    NEW.results,
    NEW.amount,
    CASE WHEN NEW.results > 0 THEN NEW.amount / NEW.results ELSE NULL END,
    NEW.daily_budget,
    NEW.monthly_budget,
    NEW.target_cpl,
    NEW.internal_status,
    NEW.delivery_status,
    NEW.notes,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END
  );
  RETURN NEW;
END;
$function$;

-- 5. create_document_version
CREATE OR REPLACE FUNCTION public.create_document_version(p_parent_document_id uuid, p_file_name text, p_file_size_bytes bigint, p_mime_type text, p_storage_path text, p_uploaded_by uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_new_id UUID;
  v_new_version INTEGER;
  v_folder_id UUID;
  v_mandato_id UUID;
  v_tipo TEXT;
BEGIN
  SELECT version, folder_id, mandato_id, tipo 
  INTO v_new_version, v_folder_id, v_mandato_id, v_tipo
  FROM documentos WHERE id = p_parent_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Documento padre no encontrado';
  END IF;

  v_new_version := v_new_version + 1;

  UPDATE documentos SET is_latest_version = false WHERE id = p_parent_document_id;

  INSERT INTO documentos (
    mandato_id, folder_id, file_name, file_size_bytes, mime_type, 
    storage_path, tipo, version, parent_document_id, is_latest_version, uploaded_by
  ) VALUES (
    v_mandato_id, v_folder_id, p_file_name, p_file_size_bytes, p_mime_type,
    p_storage_path, v_tipo, v_new_version, p_parent_document_id, true, p_uploaded_by
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$function$;

-- 6. create_mandato_folder_structure
CREATE OR REPLACE FUNCTION public.create_mandato_folder_structure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  dd_folder_id UUID;
BEGIN
  INSERT INTO document_folders (mandato_id, name, folder_type, orden, icon)
  VALUES 
    (NEW.id, '01. Información General', 'informacion_general', 1, 'folder'),
    (NEW.id, '02. Due Diligence', 'due_diligence', 2, 'search'),
    (NEW.id, '03. Negociación', 'negociacion', 3, 'handshake'),
    (NEW.id, '04. Cierre', 'cierre', 4, 'check-circle'),
    (NEW.id, '05. Data Room', 'data_room', 5, 'lock');

  SELECT id INTO dd_folder_id FROM document_folders 
  WHERE mandato_id = NEW.id AND folder_type = 'due_diligence'
  LIMIT 1;

  IF dd_folder_id IS NOT NULL THEN
    INSERT INTO document_folders (mandato_id, parent_id, name, folder_type, orden, icon)
    VALUES 
      (NEW.id, dd_folder_id, 'Financiero', 'custom', 1, 'chart-bar'),
      (NEW.id, dd_folder_id, 'Legal', 'custom', 2, 'scale'),
      (NEW.id, dd_folder_id, 'Fiscal', 'custom', 3, 'file-text'),
      (NEW.id, dd_folder_id, 'Comercial', 'custom', 4, 'briefcase'),
      (NEW.id, dd_folder_id, 'Tecnología', 'custom', 5, 'cpu');
  END IF;

  RETURN NEW;
END;
$function$;

-- 7. auto_link_valuation_to_crm
CREATE OR REPLACE FUNCTION public.auto_link_valuation_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_empresa_id UUID;
  v_contacto_id UUID;
  v_existing_empresa_id UUID;
BEGIN
  IF NEW.cif IS NOT NULL AND NEW.cif != '' THEN
    SELECT id INTO v_existing_empresa_id
    FROM empresas
    WHERE cif = NEW.cif
    LIMIT 1;
  END IF;

  IF v_existing_empresa_id IS NULL AND NEW.company_name IS NOT NULL THEN
    SELECT id INTO v_existing_empresa_id
    FROM empresas
    WHERE normalize_company_name(nombre) = normalize_company_name(NEW.company_name)
    LIMIT 1;
  END IF;

  IF v_existing_empresa_id IS NOT NULL THEN
    v_empresa_id := v_existing_empresa_id;
    
    UPDATE empresas
    SET 
      facturacion = COALESCE(facturacion, NEW.revenue),
      revenue = COALESCE(revenue, NEW.revenue),
      ebitda = COALESCE(ebitda, NEW.ebitda),
      sector = COALESCE(sector, NEW.industry),
      cif = COALESCE(cif, NEW.cif),
      source_valuation_id = COALESCE(source_valuation_id, NEW.id),
      updated_at = NOW()
    WHERE id = v_empresa_id;
  ELSE
    INSERT INTO empresas (
      nombre, cif, sector, facturacion, revenue, ebitda, empleados, source, source_valuation_id
    )
    VALUES (
      NEW.company_name,
      NULLIF(TRIM(NEW.cif), ''),
      NEW.industry,
      NEW.revenue,
      NEW.revenue,
      NEW.ebitda,
      CASE 
        WHEN NEW.employee_range = '1-10' THEN 5
        WHEN NEW.employee_range = '11-50' THEN 30
        WHEN NEW.employee_range = '51-200' THEN 100
        WHEN NEW.employee_range = '201-500' THEN 350
        WHEN NEW.employee_range = '501+' THEN 750
        ELSE NULL
      END,
      'valuation',
      NEW.id
    )
    RETURNING id INTO v_empresa_id;
  END IF;

  SELECT id INTO v_contacto_id
  FROM contactos
  WHERE email = NEW.email
  LIMIT 1;

  IF v_contacto_id IS NULL THEN
    INSERT INTO contactos (
      nombre, email, telefono, empresa_principal_id, cargo
    )
    VALUES (
      NEW.contact_name,
      NEW.email,
      NEW.phone,
      v_empresa_id,
      'Contacto Principal'
    )
    RETURNING id INTO v_contacto_id;
  ELSE
    UPDATE contactos
    SET empresa_principal_id = COALESCE(empresa_principal_id, v_empresa_id)
    WHERE id = v_contacto_id;
  END IF;

  UPDATE company_valuations
  SET 
    empresa_id = v_empresa_id,
    crm_contacto_id = v_contacto_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;