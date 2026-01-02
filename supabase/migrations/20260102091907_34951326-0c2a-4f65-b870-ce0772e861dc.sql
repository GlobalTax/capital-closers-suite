-- =====================================================
-- FASE 3: Mejorar función copy_checklist_template_by_type
-- para calcular fechas límite automáticamente
-- =====================================================

-- Reemplazar la función para incluir cálculo de fechas
CREATE OR REPLACE FUNCTION public.copy_checklist_template_by_type(
  p_mandato_id UUID,
  p_tipo_operacion TEXT
)
RETURNS INTEGER
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
  -- Obtener fecha_inicio del mandato (o fecha actual si no existe)
  SELECT COALESCE(fecha_inicio, CURRENT_DATE)::DATE INTO v_fecha_inicio
  FROM mandatos WHERE id = p_mandato_id;
  
  -- Si no encontramos el mandato, usar fecha actual
  IF v_fecha_inicio IS NULL THEN
    v_fecha_inicio := CURRENT_DATE;
  END IF;
  
  -- Copiar cada template ordenado por fase y orden
  FOR template_row IN 
    SELECT * FROM mandato_checklist_templates 
    WHERE tipo_operacion = p_tipo_operacion 
    AND activo = true 
    ORDER BY fase, orden
  LOOP
    -- Calcular días acumulados para fecha_limite
    INSERT INTO mandato_checklist_tasks (
      mandato_id, 
      fase, 
      tarea, 
      descripcion, 
      responsable, 
      sistema, 
      orden, 
      tipo_operacion, 
      duracion_estimada_dias, 
      es_critica, 
      dependencias,
      fecha_limite,
      fecha_inicio
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
      -- fecha_limite = fecha_inicio + días acumulados + duración de esta tarea
      v_fecha_inicio + (v_dias_acumulados + COALESCE(template_row.duracion_estimada_dias, 7))::INTEGER,
      -- fecha_inicio de la tarea = fecha_inicio mandato + días acumulados
      v_fecha_inicio + v_dias_acumulados::INTEGER
    );
    
    -- Acumular días para la siguiente tarea
    v_dias_acumulados := v_dias_acumulados + COALESCE(template_row.duracion_estimada_dias, 7);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- =====================================================
-- Actualizar tareas existentes que no tienen fecha_limite
-- =====================================================

-- Primero actualizamos duracion_estimada_dias donde es NULL
UPDATE mandato_checklist_tasks 
SET duracion_estimada_dias = 7 
WHERE duracion_estimada_dias IS NULL;

-- Actualizar fechas para tareas existentes usando INTERVAL
WITH task_ordering AS (
  SELECT 
    t.id,
    t.mandato_id,
    t.fase,
    t.orden,
    t.duracion_estimada_dias,
    COALESCE(m.fecha_inicio, m.created_at::DATE, CURRENT_DATE) as mandato_fecha_inicio,
    ROW_NUMBER() OVER (
      PARTITION BY t.mandato_id 
      ORDER BY t.fase, t.orden
    ) as task_number
  FROM mandato_checklist_tasks t
  JOIN mandatos m ON t.mandato_id = m.id
  WHERE t.fecha_limite IS NULL
),
cumulative_days AS (
  SELECT 
    t1.id,
    t1.mandato_fecha_inicio,
    t1.duracion_estimada_dias,
    COALESCE(SUM(t2.duracion_estimada_dias), 0)::INTEGER as dias_previos
  FROM task_ordering t1
  LEFT JOIN task_ordering t2 
    ON t1.mandato_id = t2.mandato_id 
    AND t2.task_number < t1.task_number
  GROUP BY t1.id, t1.mandato_fecha_inicio, t1.duracion_estimada_dias
)
UPDATE mandato_checklist_tasks t
SET 
  fecha_inicio = cd.mandato_fecha_inicio + (cd.dias_previos || ' days')::INTERVAL,
  fecha_limite = cd.mandato_fecha_inicio + ((cd.dias_previos + cd.duracion_estimada_dias) || ' days')::INTERVAL
FROM cumulative_days cd
WHERE t.id = cd.id;