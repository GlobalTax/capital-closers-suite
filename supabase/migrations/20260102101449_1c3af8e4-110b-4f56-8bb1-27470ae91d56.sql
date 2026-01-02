-- Función RPC para métricas de reportes (mueve agregaciones del cliente al servidor)
CREATE OR REPLACE FUNCTION report_metrics(filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  fecha_inicio timestamptz;
  fecha_fin timestamptz;
  tipo_mandato text;
  
  -- KPIs
  kpis_data jsonb;
  total_value numeric := 0;
  weighted_value numeric := 0;
  activos_count int := 0;
  cerrados_count int := 0;
  total_hours numeric := 0;
  billable_hours numeric := 0;
  risk_deals_count int := 0;
  
  -- Pipeline
  pipeline_data jsonb;
  
  -- Time
  time_data jsonb;
  
  -- Comparison
  comparison_data jsonb;
  
  -- Alerts
  alerts_data jsonb;
BEGIN
  -- Extraer filtros
  fecha_inicio := COALESCE((filters->>'fecha_inicio')::timestamptz, date_trunc('quarter', now()));
  fecha_fin := COALESCE((filters->>'fecha_fin')::timestamptz, now());
  tipo_mandato := COALESCE(filters->>'tipo_mandato', 'todos');

  -- ========== KPIs ==========
  SELECT 
    COALESCE(SUM(CASE WHEN estado NOT IN ('cerrado', 'cancelado') THEN valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN estado NOT IN ('cerrado', 'cancelado') THEN weighted_value ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE estado NOT IN ('cerrado', 'cancelado')),
    COUNT(*) FILTER (WHERE estado = 'cerrado'),
    COUNT(*) FILTER (WHERE days_in_stage > 30 AND estado NOT IN ('cerrado', 'cancelado'))
  INTO total_value, weighted_value, activos_count, cerrados_count, risk_deals_count
  FROM mandatos
  WHERE created_at BETWEEN fecha_inicio AND fecha_fin
    AND (tipo_mandato = 'todos' OR tipo = tipo_mandato);

  -- Time totals
  SELECT 
    COALESCE(SUM(duration_minutes) / 60.0, 0),
    COALESCE(SUM(duration_minutes) FILTER (WHERE is_billable) / 60.0, 0)
  INTO total_hours, billable_hours
  FROM mandato_time_entries
  WHERE start_time BETWEEN fecha_inicio AND fecha_fin;

  kpis_data := jsonb_build_array(
    jsonb_build_object('id', 'total_value', 'title', 'Valor Total Pipeline', 'value', total_value, 'icon', 'TrendingUp', 'color', 'text-primary', 'description', activos_count || ' deals activos'),
    jsonb_build_object('id', 'weighted_value', 'title', 'Valor Ponderado', 'value', weighted_value, 'icon', 'Scale', 'color', 'text-purple-500', 'description', 'Por probabilidad'),
    jsonb_build_object('id', 'active_deals', 'title', 'Deals Activos', 'value', activos_count, 'icon', 'Briefcase', 'color', 'text-blue-500', 'description', cerrados_count || ' cerrados'),
    jsonb_build_object('id', 'conversion_rate', 'title', 'Tasa Conversión', 'value', CASE WHEN (activos_count + cerrados_count) > 0 THEN ROUND((cerrados_count::numeric / (activos_count + cerrados_count)) * 100) ELSE 0 END, 'icon', 'Target', 'color', 'text-green-500'),
    jsonb_build_object('id', 'total_hours', 'title', 'Horas Totales', 'value', ROUND(total_hours::numeric, 1), 'icon', 'Clock', 'color', 'text-orange-500', 'description', ROUND(billable_hours::numeric, 1) || 'h facturables'),
    jsonb_build_object('id', 'billable_rate', 'title', 'Tasa Facturable', 'value', CASE WHEN total_hours > 0 THEN ROUND((billable_hours / total_hours) * 100) ELSE 0 END, 'icon', 'DollarSign', 'color', 'text-emerald-500'),
    jsonb_build_object('id', 'risk_deals', 'title', 'Deals en Riesgo', 'value', risk_deals_count, 'icon', 'AlertTriangle', 'color', CASE WHEN risk_deals_count > 0 THEN 'text-red-500' ELSE 'text-muted-foreground' END, 'description', '>30 días estancados')
  );

  -- ========== PIPELINE METRICS ==========
  SELECT COALESCE(jsonb_agg(stage_metrics ORDER BY stage_order), '[]'::jsonb)
  INTO pipeline_data
  FROM (
    SELECT 
      COALESCE(pipeline_stage, 'prospeccion') as stage_key,
      CASE COALESCE(pipeline_stage, 'prospeccion')
        WHEN 'prospeccion' THEN 'Prospección'
        WHEN 'loi' THEN 'LOI'
        WHEN 'due_diligence' THEN 'Due Diligence'
        WHEN 'negociacion' THEN 'Negociación'
        WHEN 'cierre' THEN 'Cierre'
        ELSE 'Otro'
      END as stage_name,
      CASE COALESCE(pipeline_stage, 'prospeccion')
        WHEN 'prospeccion' THEN 1
        WHEN 'loi' THEN 2
        WHEN 'due_diligence' THEN 3
        WHEN 'negociacion' THEN 4
        WHEN 'cierre' THEN 5
        ELSE 6
      END as stage_order,
      CASE COALESCE(pipeline_stage, 'prospeccion')
        WHEN 'prospeccion' THEN '#3b82f6'
        WHEN 'loi' THEN '#8b5cf6'
        WHEN 'due_diligence' THEN '#f59e0b'
        WHEN 'negociacion' THEN '#ef4444'
        WHEN 'cierre' THEN '#22c55e'
        ELSE '#6b7280'
      END as color,
      COUNT(*) as deal_count,
      COALESCE(SUM(valor), 0) as total_value,
      COALESCE(SUM(weighted_value), 0) as weighted_value,
      COALESCE(ROUND(AVG(days_in_stage)), 0) as avg_days_in_stage
    FROM mandatos
    WHERE created_at BETWEEN fecha_inicio AND fecha_fin
      AND (tipo_mandato = 'todos' OR tipo = tipo_mandato)
    GROUP BY pipeline_stage
  ) stage_metrics;

  -- ========== TIME METRICS ==========
  SELECT jsonb_build_object(
    'totalHours', ROUND(total_hours::numeric, 1),
    'billableHours', ROUND(billable_hours::numeric, 1),
    'nonBillableHours', ROUND((total_hours - billable_hours)::numeric, 1),
    'hoursByType', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('type', work_type, 'hours', ROUND(hours::numeric, 1)))
      FROM (
        SELECT COALESCE(work_type, 'Otros') as work_type, SUM(duration_minutes) / 60.0 as hours
        FROM mandato_time_entries
        WHERE start_time BETWEEN fecha_inicio AND fecha_fin
        GROUP BY work_type
      ) t
    ), '[]'::jsonb),
    'hoursByWeek', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('week', week_start, 'hours', ROUND(hours::numeric, 1), 'billable', ROUND(billable::numeric, 1)) ORDER BY week_start)
      FROM (
        SELECT 
          date_trunc('week', start_time)::date as week_start,
          SUM(duration_minutes) / 60.0 as hours,
          SUM(duration_minutes) FILTER (WHERE is_billable) / 60.0 as billable
        FROM mandato_time_entries
        WHERE start_time BETWEEN fecha_inicio AND fecha_fin
        GROUP BY date_trunc('week', start_time)
      ) w
    ), '[]'::jsonb)
  ) INTO time_data;

  -- ========== COMPARISON METRICS ==========
  SELECT jsonb_build_object(
    'compra', (
      SELECT jsonb_build_object(
        'count', COUNT(*),
        'totalValue', COALESCE(SUM(valor), 0),
        'avgValue', COALESCE(ROUND(AVG(valor)), 0),
        'conversionRate', CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE estado = 'cerrado')::numeric / COUNT(*)) * 100) ELSE 0 END
      )
      FROM mandatos
      WHERE tipo = 'compra' AND created_at BETWEEN fecha_inicio AND fecha_fin
    ),
    'venta', (
      SELECT jsonb_build_object(
        'count', COUNT(*),
        'totalValue', COALESCE(SUM(valor), 0),
        'avgValue', COALESCE(ROUND(AVG(valor)), 0),
        'conversionRate', CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE estado = 'cerrado')::numeric / COUNT(*)) * 100) ELSE 0 END
      )
      FROM mandatos
      WHERE tipo = 'venta' AND created_at BETWEEN fecha_inicio AND fecha_fin
    ),
    'bySector', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('sector', sector, 'compra', compra_count, 'venta', venta_count) ORDER BY (compra_count + venta_count) DESC)
      FROM (
        SELECT 
          COALESCE(sectores_interes[1], 'Sin sector') as sector,
          COUNT(*) FILTER (WHERE tipo = 'compra') as compra_count,
          COUNT(*) FILTER (WHERE tipo = 'venta') as venta_count
        FROM mandatos
        WHERE created_at BETWEEN fecha_inicio AND fecha_fin
        GROUP BY sectores_interes[1]
        LIMIT 8
      ) s
    ), '[]'::jsonb)
  ) INTO comparison_data;

  -- ========== ALERTS ==========
  SELECT jsonb_build_object(
    'stuckDeals', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'nombre', COALESCE(descripcion, 'Sin nombre'),
        'stage', COALESCE(pipeline_stage, 'prospeccion'),
        'daysInStage', days_in_stage,
        'valor', valor
      ) ORDER BY days_in_stage DESC)
      FROM mandatos
      WHERE estado NOT IN ('cerrado', 'cancelado')
        AND days_in_stage > 30
      LIMIT 10
    ), '[]'::jsonb),
    'upcomingClosings', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'nombre', COALESCE(descripcion, 'Sin nombre'),
        'expected_close_date', expected_close_date,
        'valor', valor,
        'daysUntilClose', (expected_close_date - CURRENT_DATE)
      ) ORDER BY expected_close_date)
      FROM mandatos
      WHERE expected_close_date IS NOT NULL
        AND expected_close_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 30)
        AND estado NOT IN ('cerrado', 'cancelado')
      LIMIT 10
    ), '[]'::jsonb),
    'overdueChecklists', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'tarea', tarea,
        'fecha_limite', fecha_limite,
        'mandato_id', mandato_id
      ))
      FROM mandato_checklist_tasks
      WHERE estado = '⏳ Pendiente'
        AND fecha_limite < CURRENT_DATE
      LIMIT 20
    ), '[]'::jsonb),
    'criticalAlerts', risk_deals_count,
    'warningAlerts', 0
  ) INTO alerts_data;

  -- ========== RESULTADO FINAL ==========
  result := jsonb_build_object(
    'kpis', kpis_data,
    'pipelineMetrics', pipeline_data,
    'timeMetrics', time_data,
    'comparisonMetrics', comparison_data,
    'alertMetrics', alerts_data
  );

  RETURN result;
END;
$$;

-- Permisos para usuarios autenticados
GRANT EXECUTE ON FUNCTION report_metrics(jsonb) TO authenticated;