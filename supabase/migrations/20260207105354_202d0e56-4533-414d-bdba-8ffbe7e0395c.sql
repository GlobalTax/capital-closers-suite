CREATE OR REPLACE FUNCTION public.copy_checklist_template_by_type(p_mandato_id uuid, p_tipo_operacion text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_fecha_inicio DATE;
  v_dias_acumulados INTEGER := 0;
  v_current_fase TEXT := '';
  template_row RECORD;
BEGIN
  -- IDEMPOTENCIA: Si ya existen tareas para este mandato y tipo, no duplicar
  IF EXISTS (
    SELECT 1 FROM mandato_checklist_tasks 
    WHERE mandato_id = p_mandato_id 
    AND tipo_operacion = p_tipo_operacion
    LIMIT 1
  ) THEN
    RETURN 0;
  END IF;

  -- Obtener fecha_inicio del mandato (o fecha actual si no existe)
  SELECT COALESCE(fecha_inicio, CURRENT_DATE)::DATE INTO v_fecha_inicio
  FROM mandatos WHERE id = p_mandato_id;
  
  IF v_fecha_inicio IS NULL THEN
    v_fecha_inicio := CURRENT_DATE;
  END IF;
  
  FOR template_row IN 
    SELECT * FROM mandato_checklist_templates 
    WHERE tipo_operacion = p_tipo_operacion 
    AND activo = true 
    ORDER BY fase, orden
  LOOP
    INSERT INTO mandato_checklist_tasks (
      mandato_id, fase, tarea, descripcion, responsable, sistema, orden, 
      tipo_operacion, duracion_estimada_dias, es_critica, dependencias,
      fecha_limite, fecha_inicio
    ) VALUES (
      p_mandato_id,
      template_row.fase,
      template_row.tarea,
      template_row.descripcion,
      template_row.responsable,
      template_row.sistema,
      template_row.orden,
      template_row.tipo_operacion,
      COALESCE(template_row.duracion_estimada_dias, 7),
      COALESCE(template_row.es_critica, false),
      template_row.dependencias,
      v_fecha_inicio + (v_dias_acumulados + COALESCE(template_row.duracion_estimada_dias, 7))::INTEGER,
      v_fecha_inicio + v_dias_acumulados::INTEGER
    );
    
    v_dias_acumulados := v_dias_acumulados + COALESCE(template_row.duracion_estimada_dias, 7);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;