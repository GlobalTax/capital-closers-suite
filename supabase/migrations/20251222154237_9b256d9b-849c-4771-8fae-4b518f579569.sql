-- =====================================================
-- MOTOR DE ALERTAS AUTOMÁTICAS M&A - CORREGIDO
-- =====================================================

-- 1. Función auxiliar para verificar condiciones de mandato
CREATE OR REPLACE FUNCTION public.check_mandato_alert_conditions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM generate_mandato_alerts();
  RETURN NEW;
END;
$$;

-- 2. Función auxiliar para verificar condiciones de tareas
CREATE OR REPLACE FUNCTION public.check_task_alert_conditions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM generate_mandato_alerts();
  RETURN NEW;
END;
$$;

-- 3. Trigger para cambios en mandatos
DROP TRIGGER IF EXISTS trg_check_mandato_alerts ON mandatos;
CREATE TRIGGER trg_check_mandato_alerts
AFTER UPDATE OF pipeline_stage, probability, last_activity_at, estado
ON mandatos
FOR EACH STATEMENT
EXECUTE FUNCTION check_mandato_alert_conditions();

-- 4. Trigger para cambios en tareas del checklist
DROP TRIGGER IF EXISTS trg_check_task_alerts ON mandato_checklist_tasks;
CREATE TRIGGER trg_check_task_alerts
AFTER UPDATE OF estado, fecha_limite
ON mandato_checklist_tasks
FOR EACH STATEMENT
EXECUTE FUNCTION check_task_alert_conditions();

-- 5. Habilitar Realtime para mandato_alerts
ALTER TABLE mandato_alerts REPLICA IDENTITY FULL;

-- 6. Función mejorada generate_mandato_alerts con 6 tipos de alertas (CORREGIDO: tarea en vez de nombre)
CREATE OR REPLACE FUNCTION public.generate_mandato_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  mandato_record RECORD;
  task_record RECORD;
  days_inactive INTEGER;
  alert_severity TEXT;
  alert_exists BOOLEAN;
BEGIN
  -- Limpiar alertas de mandatos cerrados
  UPDATE mandato_alerts 
  SET is_dismissed = true 
  WHERE mandato_id IN (
    SELECT id FROM mandatos WHERE estado IN ('cerrado', 'cancelado')
  ) AND is_dismissed = false;

  -- 1. ALERTAS DE MANDATOS INACTIVOS (14+ días sin actividad)
  FOR mandato_record IN 
    SELECT m.id, m.tipo, m.last_activity_at, m.probability, m.pipeline_stage,
           m.expected_close_date, m.days_in_stage, e.nombre as empresa_nombre
    FROM mandatos m
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    WHERE m.estado NOT IN ('cerrado', 'cancelado')
    AND m.last_activity_at < now() - interval '14 days'
  LOOP
    days_inactive := EXTRACT(DAY FROM (now() - mandato_record.last_activity_at));
    alert_severity := CASE 
      WHEN days_inactive > 30 THEN 'critical'
      WHEN days_inactive > 21 THEN 'warning'
      ELSE 'info'
    END;
    
    SELECT EXISTS(
      SELECT 1 FROM mandato_alerts 
      WHERE mandato_id = mandato_record.id 
      AND alert_type = 'inactive_mandate' 
      AND is_dismissed = false
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
      INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
      VALUES (
        mandato_record.id, 'inactive_mandate', alert_severity,
        CASE WHEN days_inactive > 30 THEN '⚠️ Mandato crítico sin actividad'
             ELSE '📋 Mandato requiere seguimiento' END,
        format('Sin actividad durante %s días. Empresa: %s', days_inactive, COALESCE(mandato_record.empresa_nombre, 'No especificada')),
        jsonb_build_object('days_inactive', days_inactive, 'last_activity', mandato_record.last_activity_at, 'tipo', mandato_record.tipo)
      );
    END IF;
  END LOOP;

  -- 2. ALERTAS DE DEALS ESTANCADOS (30+ días en mismo stage)
  FOR mandato_record IN 
    SELECT m.id, m.tipo, m.pipeline_stage, m.days_in_stage, m.stage_entered_at, e.nombre as empresa_nombre
    FROM mandatos m
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    WHERE m.estado NOT IN ('cerrado', 'cancelado')
    AND m.days_in_stage > 30
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM mandato_alerts 
      WHERE mandato_id = mandato_record.id 
      AND alert_type = 'stuck_deal' 
      AND is_dismissed = false
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
      INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
      VALUES (
        mandato_record.id, 'stuck_deal', 'warning',
        '🔄 Deal estancado en pipeline',
        format('Lleva %s días en etapa "%s". Empresa: %s', mandato_record.days_in_stage, COALESCE(mandato_record.pipeline_stage, 'Sin etapa'), COALESCE(mandato_record.empresa_nombre, 'No especificada')),
        jsonb_build_object('days_in_stage', mandato_record.days_in_stage, 'pipeline_stage', mandato_record.pipeline_stage)
      );
    END IF;
  END LOOP;

  -- 3. ALERTAS DE TAREAS VENCIDAS (columna correcta: tarea)
  FOR task_record IN 
    SELECT t.id as task_id, t.mandato_id, t.tarea as task_name, t.fecha_limite,
           t.es_critica, e.nombre as empresa_nombre,
           EXTRACT(DAY FROM (now() - t.fecha_limite)) as days_overdue
    FROM mandato_checklist_tasks t
    JOIN mandatos m ON t.mandato_id = m.id
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    WHERE m.estado NOT IN ('cerrado', 'cancelado')
    AND t.estado NOT IN ('completada', '✅ Completa')
    AND t.fecha_limite < now()
  LOOP
    alert_severity := CASE 
      WHEN task_record.es_critica THEN 'critical'
      WHEN task_record.days_overdue > 7 THEN 'critical'
      WHEN task_record.days_overdue > 3 THEN 'warning'
      ELSE 'info'
    END;
    
    IF task_record.es_critica THEN
      SELECT EXISTS(
        SELECT 1 FROM mandato_alerts 
        WHERE mandato_id = task_record.mandato_id 
        AND alert_type = 'critical_task_overdue' 
        AND is_dismissed = false
        AND metadata->>'task_id' = task_record.task_id::text
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
        VALUES (
          task_record.mandato_id, 'critical_task_overdue', 'critical',
          '🔥 Tarea CRÍTICA vencida',
          format('"%s" vencida hace %s días. Empresa: %s', task_record.task_name, task_record.days_overdue::int, COALESCE(task_record.empresa_nombre, 'No especificada')),
          jsonb_build_object('task_id', task_record.task_id, 'task_name', task_record.task_name, 'days_overdue', task_record.days_overdue)
        );
      END IF;
    ELSE
      SELECT EXISTS(
        SELECT 1 FROM mandato_alerts 
        WHERE mandato_id = task_record.mandato_id 
        AND alert_type = 'overdue_task' 
        AND is_dismissed = false
        AND metadata->>'task_id' = task_record.task_id::text
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
        VALUES (
          task_record.mandato_id, 'overdue_task', alert_severity,
          '⏰ Tarea del checklist vencida',
          format('"%s" vencida hace %s días. Empresa: %s', task_record.task_name, task_record.days_overdue::int, COALESCE(task_record.empresa_nombre, 'No especificada')),
          jsonb_build_object('task_id', task_record.task_id, 'task_name', task_record.task_name, 'days_overdue', task_record.days_overdue)
        );
      END IF;
    END IF;
  END LOOP;

  -- 4. ALERTAS DE FECHAS DE CIERRE PRÓXIMAS (7 días)
  FOR mandato_record IN 
    SELECT m.id, m.tipo, m.expected_close_date, e.nombre as empresa_nombre,
           EXTRACT(DAY FROM (m.expected_close_date - now())) as days_until_close
    FROM mandatos m
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    WHERE m.estado NOT IN ('cerrado', 'cancelado')
    AND m.expected_close_date IS NOT NULL
    AND m.expected_close_date > now()
    AND m.expected_close_date <= now() + interval '7 days'
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM mandato_alerts 
      WHERE mandato_id = mandato_record.id 
      AND alert_type = 'upcoming_deadline' 
      AND is_dismissed = false
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
      INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
      VALUES (
        mandato_record.id, 'upcoming_deadline',
        CASE WHEN mandato_record.days_until_close <= 3 THEN 'warning' ELSE 'info' END,
        '📅 Fecha de cierre próxima',
        format('Cierre previsto en %s días. Empresa: %s', mandato_record.days_until_close::int, COALESCE(mandato_record.empresa_nombre, 'No especificada')),
        jsonb_build_object('days_until_close', mandato_record.days_until_close, 'expected_close_date', mandato_record.expected_close_date)
      );
    END IF;
  END LOOP;

  -- 5. ALERTAS DE PROBABILIDAD BAJA EN STAGE AVANZADO
  FOR mandato_record IN 
    SELECT m.id, m.tipo, m.pipeline_stage, m.probability, e.nombre as empresa_nombre
    FROM mandatos m
    LEFT JOIN empresas e ON m.empresa_principal_id = e.id
    WHERE m.estado NOT IN ('cerrado', 'cancelado')
    AND m.probability IS NOT NULL
    AND m.probability < 40
    AND m.pipeline_stage IN ('due_diligence', 'negociacion', 'cierre', 'documentation')
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM mandato_alerts 
      WHERE mandato_id = mandato_record.id 
      AND alert_type = 'low_probability' 
      AND is_dismissed = false
    ) INTO alert_exists;
    
    IF NOT alert_exists THEN
      INSERT INTO mandato_alerts (mandato_id, alert_type, severity, title, description, metadata)
      VALUES (
        mandato_record.id, 'low_probability', 'warning',
        '📉 Probabilidad baja en fase avanzada',
        format('Probabilidad del %s%% en etapa "%s". Empresa: %s', mandato_record.probability, mandato_record.pipeline_stage, COALESCE(mandato_record.empresa_nombre, 'No especificada')),
        jsonb_build_object('probability', mandato_record.probability, 'pipeline_stage', mandato_record.pipeline_stage)
      );
    END IF;
  END LOOP;
END;
$$;

-- 7. Ejecutar generación inicial de alertas
SELECT generate_mandato_alerts();