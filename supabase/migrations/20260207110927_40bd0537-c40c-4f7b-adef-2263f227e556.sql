
-- Fix: mandatos table uses 'tipo' not 'tipo_operacion'
-- Re-create all three functions with correct column reference

CREATE OR REPLACE FUNCTION public.sync_template_additions(p_tipo text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mandato RECORD;
  v_template RECORD;
  v_total_added int := 0;
  v_mandatos_updated int := 0;
  v_mandato_added int;
BEGIN
  FOR v_mandato IN
    SELECT DISTINCT m.id
    FROM mandatos m
    INNER JOIN mandato_checklist_tasks t ON t.mandato_id = m.id AND t.tipo_operacion = p_tipo
    WHERE m.tipo = p_tipo
      AND m.estado NOT IN ('completado', 'cancelado', 'archivado')
  LOOP
    v_mandato_added := 0;
    FOR v_template IN
      SELECT fase, tarea, descripcion, responsable, sistema, orden, 
             duracion_estimada_dias, es_critica, dependencias, workstream
      FROM mandato_checklist_templates
      WHERE tipo_operacion = p_tipo AND activo = true
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM mandato_checklist_tasks
        WHERE mandato_id = v_mandato.id
          AND tipo_operacion = p_tipo
          AND fase = v_template.fase
          AND tarea = v_template.tarea
      ) THEN
        INSERT INTO mandato_checklist_tasks (
          mandato_id, tipo_operacion, fase, tarea, descripcion, 
          responsable, sistema, orden, duracion_estimada_dias, 
          es_critica, dependencias, workstream, estado
        ) VALUES (
          v_mandato.id, p_tipo, v_template.fase, v_template.tarea, 
          v_template.descripcion, v_template.responsable, v_template.sistema,
          v_template.orden, v_template.duracion_estimada_dias,
          v_template.es_critica, v_template.dependencias, v_template.workstream,
          'pendiente'
        );
        v_mandato_added := v_mandato_added + 1;
      END IF;
    END LOOP;
    IF v_mandato_added > 0 THEN
      v_mandatos_updated := v_mandatos_updated + 1;
      v_total_added := v_total_added + v_mandato_added;
    END IF;
  END LOOP;
  RETURN json_build_object('mandatos_updated', v_mandatos_updated, 'tasks_added', v_total_added);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_template_full_reset(p_tipo text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mandato RECORD;
  v_total_added int := 0;
  v_mandatos_updated int := 0;
  v_count int;
BEGIN
  FOR v_mandato IN
    SELECT DISTINCT m.id
    FROM mandatos m
    INNER JOIN mandato_checklist_tasks t ON t.mandato_id = m.id AND t.tipo_operacion = p_tipo
    WHERE m.tipo = p_tipo
      AND m.estado NOT IN ('completado', 'cancelado', 'archivado')
  LOOP
    DELETE FROM mandato_checklist_tasks
    WHERE mandato_id = v_mandato.id AND tipo_operacion = p_tipo;
    
    INSERT INTO mandato_checklist_tasks (
      mandato_id, tipo_operacion, fase, tarea, descripcion,
      responsable, sistema, orden, duracion_estimada_dias,
      es_critica, dependencias, workstream, estado
    )
    SELECT 
      v_mandato.id, p_tipo, fase, tarea, descripcion,
      responsable, sistema, orden, duracion_estimada_dias,
      es_critica, dependencias, workstream, 'pendiente'
    FROM mandato_checklist_templates
    WHERE tipo_operacion = p_tipo AND activo = true;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total_added := v_total_added + v_count;
    v_mandatos_updated := v_mandatos_updated + 1;
  END LOOP;
  RETURN json_build_object('mandatos_updated', v_mandatos_updated, 'tasks_added', v_total_added);
END;
$$;

CREATE OR REPLACE FUNCTION public.count_sync_affected_mandatos(p_tipo text)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT m.id)::int
  FROM mandatos m
  INNER JOIN mandato_checklist_tasks t ON t.mandato_id = m.id AND t.tipo_operacion = p_tipo
  WHERE m.tipo = p_tipo
    AND m.estado NOT IN ('completado', 'cancelado', 'archivado');
$$;
