
DROP FUNCTION IF EXISTS public.sync_template_additions(text);
DROP FUNCTION IF EXISTS public.sync_template_full_reset(text);

CREATE FUNCTION public.sync_template_additions(p_tipo_operacion text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mandatos_updated int := 0;
  v_tasks_added int := 0;
  v_mandato record;
  v_template record;
  v_existing_count int;
BEGIN
  FOR v_mandato IN
    SELECT DISTINCT m.id as mandato_id
    FROM mandatos m
    INNER JOIN mandato_checklist_tasks mct ON mct.mandato_id = m.id
    WHERE m.tipo_operacion = p_tipo_operacion
      AND m.estado NOT IN ('cancelado', 'completado', 'archivado')
  LOOP
    FOR v_template IN
      SELECT id, fase_id, titulo, descripcion, orden, responsable_sugerido
      FROM mandato_checklist_templates
      WHERE tipo_operacion = p_tipo_operacion
        AND is_active = true
    LOOP
      SELECT COUNT(*) INTO v_existing_count
      FROM mandato_checklist_tasks
      WHERE mandato_id = v_mandato.mandato_id
        AND template_task_id = v_template.id;

      IF v_existing_count = 0 THEN
        INSERT INTO mandato_checklist_tasks (
          mandato_id, template_task_id, fase_id, titulo, descripcion,
          orden, responsable_sugerido, estado, completada
        ) VALUES (
          v_mandato.mandato_id, v_template.id, v_template.fase_id,
          v_template.titulo, v_template.descripcion, v_template.orden,
          v_template.responsable_sugerido, '⏳ Pendiente', false
        );
        v_tasks_added := v_tasks_added + 1;
      END IF;
    END LOOP;
    v_mandatos_updated := v_mandatos_updated + 1;
  END LOOP;

  RETURN jsonb_build_object('mandatos_updated', v_mandatos_updated, 'tasks_added', v_tasks_added);
END;
$$;

CREATE FUNCTION public.sync_template_full_reset(p_tipo_operacion text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mandatos_updated int := 0;
  v_tasks_added int := 0;
  v_tasks_deleted int := 0;
  v_mandato record;
  v_deleted int;
  v_inserted int;
BEGIN
  FOR v_mandato IN
    SELECT DISTINCT m.id as mandato_id
    FROM mandatos m
    INNER JOIN mandato_checklist_tasks mct ON mct.mandato_id = m.id
    WHERE m.tipo_operacion = p_tipo_operacion
      AND m.estado NOT IN ('cancelado', 'completado', 'archivado')
  LOOP
    DELETE FROM mandato_checklist_tasks WHERE mandato_id = v_mandato.mandato_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_tasks_deleted := v_tasks_deleted + v_deleted;

    INSERT INTO mandato_checklist_tasks (
      mandato_id, template_task_id, fase_id, titulo, descripcion,
      orden, responsable_sugerido, estado, completada
    )
    SELECT
      v_mandato.mandato_id, t.id, t.fase_id, t.titulo, t.descripcion,
      t.orden, t.responsable_sugerido, '⏳ Pendiente', false
    FROM mandato_checklist_templates t
    WHERE t.tipo_operacion = p_tipo_operacion AND t.is_active = true;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_tasks_added := v_tasks_added + v_inserted;

    v_mandatos_updated := v_mandatos_updated + 1;
  END LOOP;

  RETURN jsonb_build_object('mandatos_updated', v_mandatos_updated, 'tasks_deleted', v_tasks_deleted, 'tasks_added', v_tasks_added);
END;
$$;
