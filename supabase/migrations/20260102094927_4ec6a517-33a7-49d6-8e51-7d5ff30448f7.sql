-- =====================================================
-- MIGRACIÓN DE SEGURIDAD - FASE 3: VISTAS RESTANTES A SECURITY INVOKER
-- =====================================================

-- 1. v_empresa_valuations (VISTA CRÍTICA - datos sensibles de valoraciones)
DROP VIEW IF EXISTS public.v_empresa_valuations;
CREATE VIEW public.v_empresa_valuations
WITH (security_invoker = true)
AS
SELECT cv.id,
    cv.contact_name,
    cv.company_name,
    cv.cif,
    cv.email,
    cv.phone,
    cv.industry,
    cv.years_of_operation,
    cv.employee_range,
    cv.revenue,
    cv.ebitda,
    cv.net_profit_margin,
    cv.growth_rate,
    cv.location,
    cv.ownership_participation,
    cv.competitive_advantage,
    cv.final_valuation,
    cv.ebitda_multiple_used,
    cv.valuation_range_min,
    cv.valuation_range_max,
    cv.created_at,
    cv.ip_address,
    cv.user_agent,
    cv.email_sent,
    cv.whatsapp_sent,
    cv.email_sent_at,
    cv.whatsapp_sent_at,
    cv.unique_token,
    cv.email_opened,
    cv.email_opened_at,
    cv.email_message_id,
    cv.form_submitted_at,
    cv.valuation_status,
    cv.last_activity_at,
    cv.current_step,
    cv.completion_percentage,
    cv.time_spent_seconds,
    cv.last_modified_field,
    cv.phone_e164,
    cv.whatsapp_opt_in,
    cv.user_id,
    cv.is_deleted,
    cv.deleted_at,
    cv.activity_description,
    cv.referrer,
    cv.adjustment_amount,
    cv.has_adjustments,
    cv.source_project,
    cv.token_used_at,
    cv.token_expires_at,
    cv.assigned_to,
    cv.lead_status_crm,
    cv.assigned_at,
    cv.status_updated_at,
    cv.deleted_by,
    cv.deletion_reason,
    cv.empresa_id,
    e.id AS matched_empresa_id,
    e.nombre AS matched_empresa_nombre,
    CASE
        WHEN (cv.empresa_id IS NOT NULL) THEN 'linked'::text
        WHEN ((cv.cif IS NOT NULL) AND (e.cif IS NOT NULL) AND (lower(TRIM(BOTH FROM cv.cif)) = lower(TRIM(BOTH FROM e.cif)))) THEN 'cif_match'::text
        WHEN (lower(TRIM(BOTH FROM cv.company_name)) = lower(TRIM(BOTH FROM e.nombre))) THEN 'name_match'::text
        ELSE 'no_match'::text
    END AS match_type
FROM (company_valuations cv
    LEFT JOIN empresas e ON (((cv.empresa_id = e.id) OR ((cv.cif IS NOT NULL) AND (e.cif IS NOT NULL) AND (lower(TRIM(BOTH FROM cv.cif)) = lower(TRIM(BOTH FROM e.cif)))) OR (lower(TRIM(BOTH FROM cv.company_name)) = lower(TRIM(BOTH FROM e.nombre))))))
WHERE ((cv.is_deleted = false) OR (cv.is_deleted IS NULL));

-- 2. v_mandatos_stuck
DROP VIEW IF EXISTS public.v_mandatos_stuck;
CREATE VIEW public.v_mandatos_stuck
WITH (security_invoker = true)
AS
SELECT m.id,
    m.tipo,
    m.empresa_principal_id,
    m.estado,
    m.valor,
    m.fecha_inicio,
    m.fecha_cierre,
    m.descripcion,
    m.prioridad,
    m.created_at,
    m.updated_at,
    m.perfil_empresa_buscada,
    m.rango_inversion_min,
    m.rango_inversion_max,
    m.sectores_interes,
    m.timeline_objetivo,
    m.valoracion_esperada,
    m.tipo_comprador_buscado,
    m.estado_negociacion,
    m.numero_ofertas_recibidas,
    m.es_interno,
    m.import_log_id,
    m.pipeline_stage,
    m.probability,
    m.expected_close_date,
    m.weighted_value,
    m.days_in_stage,
    m.stage_entered_at,
    m.last_activity_at,
    ps.stage_name,
    ps.color AS stage_color,
    EXTRACT(day FROM (now() - m.last_activity_at)) AS days_inactive
FROM (mandatos m
    JOIN pipeline_stages ps ON ((ps.stage_key = m.pipeline_stage)))
WHERE ((m.estado <> ALL (ARRAY['cerrado'::text, 'cancelado'::text])) AND (m.last_activity_at < (now() - '30 days'::interval)))
ORDER BY (EXTRACT(day FROM (now() - m.last_activity_at))) DESC;

-- 3. v_nominas_completo (datos sensibles de nóminas)
DROP VIEW IF EXISTS public.v_nominas_completo;
CREATE VIEW public.v_nominas_completo
WITH (security_invoker = true)
AS
SELECT n.id,
    n.empleado_id,
    n.mes,
    n.anio,
    n.bruto,
    n.neto,
    n.coste_empresa,
    n.pdf_url,
    n.created_at,
    e.nombre AS empleado_nombre,
    emp.nombre AS empresa_nombre
FROM ((rh_nominas n
    JOIN rh_empleados e ON ((n.empleado_id = e.id)))
    JOIN rh_empresas emp ON ((e.empresa_id = emp.id)));

-- 4. v_pipeline_summary
DROP VIEW IF EXISTS public.v_pipeline_summary;
CREATE VIEW public.v_pipeline_summary
WITH (security_invoker = true)
AS
SELECT ps.stage_key,
    ps.stage_name,
    ps.stage_order,
    ps.color,
    ps.default_probability,
    count(m.id) AS deal_count,
    COALESCE(sum(m.valor), (0)::numeric) AS total_value,
    COALESCE(sum(m.weighted_value), (0)::numeric) AS weighted_value,
    COALESCE(avg(m.days_in_stage), (0)::numeric) AS avg_days_in_stage
FROM (pipeline_stages ps
    LEFT JOIN mandatos m ON (((m.pipeline_stage = ps.stage_key) AND (m.estado <> 'cancelado'::text))))
WHERE (ps.is_active = true)
GROUP BY ps.id, ps.stage_key, ps.stage_name, ps.stage_order, ps.color, ps.default_probability
ORDER BY ps.stage_order;

-- 5. v_sector_multiples
DROP VIEW IF EXISTS public.v_sector_multiples;
CREATE VIEW public.v_sector_multiples
WITH (security_invoker = true)
AS
SELECT sector_name,
    ebitda_multiple_min,
    ebitda_multiple_median,
    ebitda_multiple_max,
    revenue_multiple_min,
    revenue_multiple_median,
    revenue_multiple_max,
    net_profit_multiple_min,
    net_profit_multiple_median,
    net_profit_multiple_max
FROM advisor_valuation_multiples
WHERE (is_active = true)
ORDER BY display_order, sector_name;