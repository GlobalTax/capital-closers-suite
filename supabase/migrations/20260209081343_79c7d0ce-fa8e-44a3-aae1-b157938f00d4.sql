
CREATE OR REPLACE FUNCTION public.merge_contactos(p_source_id uuid, p_target_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_record RECORD;
  v_target_record RECORD;
  v_interacciones_count INT := 0;
  v_mandato_contactos_count INT := 0;
  v_documentos_count INT := 0;
  v_ai_imports_count INT := 0;
BEGIN
  SELECT * INTO v_source_record FROM contactos WHERE id = p_source_id;
  SELECT * INTO v_target_record FROM contactos WHERE id = p_target_id;
  
  IF v_source_record IS NULL THEN
    RAISE EXCEPTION 'Contacto origen no encontrado: %', p_source_id;
  END IF;
  IF v_target_record IS NULL THEN
    RAISE EXCEPTION 'Contacto destino no encontrado: %', p_target_id;
  END IF;
  IF p_source_id = p_target_id THEN
    RAISE EXCEPTION 'No se puede fusionar un contacto consigo mismo';
  END IF;
  IF v_source_record.merged_into_contacto_id IS NOT NULL THEN
    RAISE EXCEPTION 'El contacto origen ya fue fusionado anteriormente';
  END IF;
  
  -- 1. Reasignar interacciones
  UPDATE interacciones 
  SET contacto_id = p_target_id, updated_at = NOW()
  WHERE contacto_id = p_source_id;
  GET DIAGNOSTICS v_interacciones_count = ROW_COUNT;
  
  -- 2. Reasignar mandato_contactos (evitar duplicados) - SIN updated_at que no existe
  WITH existing AS (
    SELECT mandato_id FROM mandato_contactos WHERE contacto_id = p_target_id
  )
  UPDATE mandato_contactos mc
  SET contacto_id = p_target_id
  WHERE mc.contacto_id = p_source_id
  AND mc.mandato_id NOT IN (SELECT mandato_id FROM existing);
  GET DIAGNOSTICS v_mandato_contactos_count = ROW_COUNT;
  
  DELETE FROM mandato_contactos WHERE contacto_id = p_source_id;
  
  -- 3. Reasignar documentos compartidos (evitar duplicados)
  WITH existing AS (
    SELECT documento_id FROM contacto_documentos WHERE contacto_id = p_target_id
  )
  UPDATE contacto_documentos cd
  SET contacto_id = p_target_id
  WHERE cd.contacto_id = p_source_id
  AND cd.documento_id NOT IN (SELECT documento_id FROM existing);
  GET DIAGNOSTICS v_documentos_count = ROW_COUNT;
  
  DELETE FROM contacto_documentos WHERE contacto_id = p_source_id;
  
  -- 4. Reasignar ai_imports
  UPDATE ai_imports 
  SET contacto_id = p_target_id, updated_at = NOW()
  WHERE contacto_id = p_source_id;
  GET DIAGNOSTICS v_ai_imports_count = ROW_COUNT;
  
  -- 5. Marcar el origen como fusionado
  UPDATE contactos 
  SET merged_into_contacto_id = p_target_id, updated_at = NOW()
  WHERE id = p_source_id;
  
  -- 6. Audit log
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    p_user_id, 'MERGE', 'contactos', p_source_id,
    jsonb_build_object(
      'action', 'MERGE_SOURCE',
      'source_id', p_source_id,
      'source_nombre', v_source_record.nombre || ' ' || COALESCE(v_source_record.apellidos, ''),
      'source_email', v_source_record.email
    ),
    jsonb_build_object(
      'action', 'MERGE_TARGET',
      'target_id', p_target_id,
      'target_nombre', v_target_record.nombre || ' ' || COALESCE(v_target_record.apellidos, ''),
      'target_email', v_target_record.email,
      'interacciones_moved', v_interacciones_count,
      'mandatos_moved', v_mandato_contactos_count,
      'documentos_moved', v_documentos_count,
      'ai_imports_moved', v_ai_imports_count
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'source_id', p_source_id,
    'target_id', p_target_id,
    'counts', jsonb_build_object(
      'interacciones', v_interacciones_count,
      'mandatos', v_mandato_contactos_count,
      'documentos', v_documentos_count,
      'ai_imports', v_ai_imports_count
    )
  );
END;
$$;
