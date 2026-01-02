-- =============================================
-- TRIGGER: Actualizar days_in_stage automáticamente
-- =============================================

-- Función para actualizar days_in_stage cuando cambia el estado o pipeline_stage
CREATE OR REPLACE FUNCTION public.update_mandato_stage_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambió el estado o pipeline_stage, reiniciar el contador
  IF OLD.estado IS DISTINCT FROM NEW.estado 
     OR OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    NEW.stage_entered_at := NOW();
    NEW.days_in_stage := 0;
  END IF;
  
  -- Siempre actualizar last_activity_at
  NEW.last_activity_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trg_update_mandato_stage_tracking ON mandatos;

-- Crear trigger
CREATE TRIGGER trg_update_mandato_stage_tracking
BEFORE UPDATE ON mandatos
FOR EACH ROW EXECUTE FUNCTION public.update_mandato_stage_tracking();

-- =============================================
-- FUNCIÓN: Actualizar days_in_stage diariamente (para cron job)
-- =============================================
CREATE OR REPLACE FUNCTION public.refresh_mandatos_days_in_stage()
RETURNS void AS $$
BEGIN
  UPDATE mandatos 
  SET days_in_stage = EXTRACT(DAY FROM (NOW() - COALESCE(stage_entered_at, created_at)))::integer
  WHERE estado NOT IN ('cerrado', 'cancelado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- FUNCIÓN MEJORADA: Copiar template con fechas límite
-- =============================================
CREATE OR REPLACE FUNCTION public.copy_checklist_template_by_type(
  p_mandato_id UUID,
  p_tipo_operacion TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_fecha_inicio DATE;
  v_acumulado_dias INTEGER := 0;
  v_fase_actual TEXT := '';
  template_row RECORD;
BEGIN
  -- Obtener fecha de inicio del mandato
  SELECT COALESCE(fecha_inicio::date, CURRENT_DATE) INTO v_fecha_inicio
  FROM mandatos WHERE id = p_mandato_id;
  
  -- Eliminar tareas existentes del mandato
  DELETE FROM mandato_checklist_tasks WHERE mandato_id = p_mandato_id;
  
  -- Copiar templates ordenados por fase y orden
  FOR template_row IN 
    SELECT * FROM mandato_checklist_templates 
    WHERE tipo_operacion = p_tipo_operacion 
    AND activo = true 
    ORDER BY fase, orden
  LOOP
    -- Si cambiamos de fase, NO reiniciamos el acumulador (las fases son secuenciales)
    
    -- Calcular fecha límite basada en duración acumulada
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
      fecha_inicio,
      fecha_limite,
      estado
    ) VALUES (
      p_mandato_id,
      template_row.fase,
      template_row.tarea,
      template_row.descripcion,
      template_row.responsable,
      template_row.sistema,
      template_row.orden,
      template_row.tipo_operacion,
      template_row.duracion_estimada_dias,
      template_row.es_critica,
      template_row.dependencias,
      v_fecha_inicio + v_acumulado_dias,
      v_fecha_inicio + v_acumulado_dias + COALESCE(template_row.duracion_estimada_dias, 7),
      '⏳ Pendiente'
    );
    
    -- Acumular días para la siguiente tarea
    v_acumulado_dias := v_acumulado_dias + COALESCE(template_row.duracion_estimada_dias, 7);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- INICIALIZAR: Actualizar stage_entered_at para mandatos existentes
-- =============================================
UPDATE mandatos 
SET stage_entered_at = COALESCE(updated_at, created_at),
    days_in_stage = EXTRACT(DAY FROM (NOW() - COALESCE(updated_at, created_at)))::integer
WHERE stage_entered_at IS NULL;