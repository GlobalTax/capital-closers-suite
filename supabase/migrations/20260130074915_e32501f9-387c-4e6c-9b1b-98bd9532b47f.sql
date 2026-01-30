-- ============================================
-- FASE 2: RECREAR VISTAS CON SECURITY INVOKER
-- ============================================

-- 1. mandato_time_summary
DROP VIEW IF EXISTS public.mandato_time_summary;
CREATE VIEW public.mandato_time_summary
WITH (security_invoker = true)
AS
SELECT m.id AS mandato_id,
    m.tipo,
    m.descripcion,
    count(DISTINCT te.user_id) AS trabajadores_asignados,
    count(te.id) AS total_entradas,
    COALESCE(sum(te.duration_minutes), 0::bigint)::numeric / 60.0 AS total_horas,
    COALESCE(sum(
        CASE
            WHEN te.is_billable THEN te.duration_minutes
            ELSE 0
        END), 0::bigint)::numeric / 60.0 AS horas_facturables,
    COALESCE(avg(te.duration_minutes), 0::numeric) / 60.0 AS promedio_horas_por_entrada
   FROM mandatos m
     LEFT JOIN mandato_time_entries te ON te.mandato_id = m.id AND te.status <> 'rejected'::text
  GROUP BY m.id, m.tipo, m.descripcion;

-- 2. task_time_summary
DROP VIEW IF EXISTS public.task_time_summary;
CREATE VIEW public.task_time_summary
WITH (security_invoker = true)
AS
SELECT t.id AS task_id,
    t.tarea,
    t.fase,
    t.mandato_id,
    count(te.id) AS total_entradas,
    COALESCE(sum(te.duration_minutes), 0::bigint)::numeric / 60.0 AS total_horas,
    count(DISTINCT te.user_id) AS usuarios_trabajando
   FROM mandato_checklist_tasks t
     LEFT JOIN mandato_time_entries te ON te.task_id = t.id AND te.status <> 'rejected'::text
  GROUP BY t.id, t.tarea, t.fase, t.mandato_id;

-- 3. v_active_alerts
DROP VIEW IF EXISTS public.v_active_alerts;
CREATE VIEW public.v_active_alerts
WITH (security_invoker = true)
AS
SELECT a.id,
    a.mandato_id,
    a.alert_type,
    a.severity,
    a.title,
    a.description,
    a.is_read,
    a.is_dismissed,
    a.created_at,
    a.updated_at,
    a.expires_at,
    a.metadata,
    m.tipo AS mandato_tipo,
    m.estado AS mandato_estado,
    m.valor AS mandato_valor,
    m.pipeline_stage,
    e.nombre AS empresa_nombre,
    e.sector AS empresa_sector
   FROM mandato_alerts a
     JOIN mandatos m ON a.mandato_id = m.id
     LEFT JOIN empresas e ON m.empresa_principal_id = e.id
  WHERE a.is_dismissed = false
  ORDER BY (
        CASE a.severity
            WHEN 'critical'::text THEN 1
            WHEN 'warning'::text THEN 2
            ELSE 3
        END), a.created_at DESC;

-- 4. v_admin_users_safe
DROP VIEW IF EXISTS public.v_admin_users_safe;
CREATE VIEW public.v_admin_users_safe
WITH (security_invoker = true)
AS
SELECT id,
    user_id,
    role,
    is_active,
    created_at,
    last_login,
    CASE
        WHEN (EXISTS ( SELECT 1
           FROM admin_users au
          WHERE au.user_id = auth.uid() AND au.is_active = true)) THEN email
        ELSE '***@***'::text
    END AS email_masked,
    CASE
        WHEN (EXISTS ( SELECT 1
           FROM admin_users au
          WHERE au.user_id = auth.uid() AND au.is_active = true)) THEN full_name
        ELSE '***'::text
    END AS full_name_masked
   FROM admin_users;

-- 5. v_api_usage_monthly
DROP VIEW IF EXISTS public.v_api_usage_monthly;
CREATE VIEW public.v_api_usage_monthly
WITH (security_invoker = true)
AS
SELECT service,
    operation,
    date_trunc('month'::text, created_at) AS month,
    sum(credits_used) AS total_credits,
    sum(tokens_used) AS total_tokens,
    sum(cost_usd) AS total_cost,
    count(*) AS call_count
   FROM api_usage_log
  GROUP BY service, operation, (date_trunc('month'::text, created_at))
  ORDER BY (date_trunc('month'::text, created_at)) DESC, service, operation;

-- 6. v_brevo_sync_status
DROP VIEW IF EXISTS public.v_brevo_sync_status;
CREATE VIEW public.v_brevo_sync_status
WITH (security_invoker = true)
AS
SELECT 'contactos'::text AS entity_type,
    count(*) AS total,
    count(contactos.brevo_id) AS synced,
    count(*) - count(contactos.brevo_id) AS pending_sync
   FROM contactos
UNION ALL
 SELECT 'empresas'::text AS entity_type,
    count(*) AS total,
    count(empresas.brevo_id) AS synced,
    count(*) - count(empresas.brevo_id) AS pending_sync
   FROM empresas
UNION ALL
 SELECT 'mandatos'::text AS entity_type,
    count(*) AS total,
    count(mandatos.brevo_deal_id) AS synced,
    count(*) - count(mandatos.brevo_deal_id) AS pending_sync
   FROM mandatos;

-- 7. v_cr_portfolio_con_actividad
DROP VIEW IF EXISTS public.v_cr_portfolio_con_actividad;
CREATE VIEW public.v_cr_portfolio_con_actividad
WITH (security_invoker = true)
AS
SELECT p.id,
    p.fund_id,
    p.company_name,
    p.website,
    p.country,
    p.sector,
    p.sector_pe,
    p.investment_year,
    p.investment_type,
    p.ownership_type,
    p.status,
    p.exit_year,
    p.exit_type,
    p.description,
    p.source_url,
    p.notes,
    p.is_deleted,
    p.deleted_at,
    p.created_at,
    p.updated_at,
    p.last_news_scan_at,
    p.news_alert_count,
    p.last_web_check_at,
    p.scan_priority,
    p.skip_news_scan,
    p.enriched_data,
    p.enriched_at,
    p.employee_count_estimate,
    p.revenue_estimate,
    p.technologies,
    p.key_people,
    p.social_links,
    p.enrichment_source,
    COALESCE(p.fund_name, f.name) AS fund_display_name,
    f.fund_type,
    ( SELECT max(i.sent_at) AS max
           FROM cr_portfolio_interactions i
          WHERE i.portfolio_id = p.id) AS ultima_interaccion,
    ( SELECT count(*) AS count
           FROM cr_portfolio_interactions i
          WHERE i.portfolio_id = p.id) AS total_interacciones
   FROM cr_portfolio p
     LEFT JOIN cr_funds f ON p.fund_id = f.id
  WHERE p.is_deleted = false;

-- 8. v_documentos_con_versiones
DROP VIEW IF EXISTS public.v_documentos_con_versiones;
CREATE VIEW public.v_documentos_con_versiones
WITH (security_invoker = true)
AS
SELECT d.id,
    d.mandato_id,
    d.file_name,
    d.file_size_bytes,
    d.mime_type,
    d.storage_path,
    d.tipo,
    d.created_at,
    d.updated_at,
    d.uploaded_by,
    d.tags,
    d.folder_id,
    d.version,
    d.parent_document_id,
    d.is_latest_version,
    f.name AS folder_name,
    f.folder_type,
    f.is_data_room,
    ( SELECT count(*) AS count
           FROM documentos
          WHERE documentos.parent_document_id = d.id OR documentos.id = d.id) AS total_versions,
    ( SELECT max(documentos.version) AS max
           FROM documentos
          WHERE documentos.parent_document_id = d.id OR documentos.id = d.id) AS latest_version
   FROM documentos d
     LEFT JOIN document_folders f ON d.folder_id = f.id
  WHERE d.is_latest_version = true OR d.parent_document_id IS NULL;

-- 9. v_email_queue_stats
DROP VIEW IF EXISTS public.v_email_queue_stats;
CREATE VIEW public.v_email_queue_stats
WITH (security_invoker = true)
AS
SELECT queue_type,
    status,
    count(*) AS count,
    avg(attempts) AS avg_attempts,
    min(created_at) AS oldest,
    max(created_at) AS newest
   FROM email_queue
  WHERE created_at > (now() - '24:00:00'::interval)
  GROUP BY queue_type, status
  ORDER BY queue_type, status;

-- 10. v_empresa_valuations
DROP VIEW IF EXISTS public.v_empresa_valuations;
CREATE VIEW public.v_empresa_valuations
WITH (security_invoker = true)
AS
SELECT cv.id,
    cv.company_name,
    cv.industry,
    cv.revenue,
    cv.ebitda,
    cv.final_valuation,
    cv.created_at,
    cv.is_deleted,
    cv.empresa_id,
    cv.cif,
    cv.email,
    cv.contact_name,
    cv.phone,
    e.id AS matched_empresa_id,
    e.nombre AS matched_empresa_nombre,
    CASE
        WHEN cv.empresa_id IS NOT NULL THEN 'linked'::text
        WHEN cv.cif IS NOT NULL AND e.cif IS NOT NULL AND lower(TRIM(BOTH FROM cv.cif)) = lower(TRIM(BOTH FROM e.cif)) THEN 'cif_match'::text
        WHEN lower(TRIM(BOTH FROM cv.company_name)) = lower(TRIM(BOTH FROM e.nombre)) THEN 'name_match'::text
        ELSE 'no_match'::text
    END AS match_type
   FROM company_valuations cv
     LEFT JOIN empresas e ON cv.empresa_id = e.id OR cv.cif IS NOT NULL AND e.cif IS NOT NULL AND lower(TRIM(BOTH FROM cv.cif)) = lower(TRIM(BOTH FROM e.cif)) OR lower(TRIM(BOTH FROM cv.company_name)) = lower(TRIM(BOTH FROM e.nombre))
  WHERE cv.is_deleted = false OR cv.is_deleted IS NULL;

-- 11. v_empresas_con_actividad
DROP VIEW IF EXISTS public.v_empresas_con_actividad;
CREATE VIEW public.v_empresas_con_actividad
WITH (security_invoker = true)
AS
SELECT e.id,
    e.nombre,
    e.cif,
    e.sector,
    e.subsector,
    e.ubicacion,
    e.facturacion,
    e.empleados,
    e.sitio_web,
    e.descripcion,
    e.revenue,
    e.ebitda,
    e.margen_ebitda,
    e.deuda,
    e.capital_circulante,
    e.es_target,
    e.estado_target,
    e.nivel_interes,
    e.created_at,
    e.updated_at,
    e.import_log_id,
    e.ebitda_margin,
    e.source_valuation_id,
    e.brevo_id,
    e.brevo_synced_at,
    e.source_pro_valuation_id,
    e.brevo_last_modified_at,
    e.potencial_search_fund,
    e."año_datos_financieros",
    e.cnae_codigo,
    e.cnae_descripcion,
    e.actividades_destacadas,
    e.fuente_enriquecimiento,
    e.fecha_enriquecimiento,
    e.sector_id,
    e.apollo_org_id,
    e.apollo_intent_level,
    e.apollo_score,
    e.apollo_last_synced_at,
    e.apollo_raw_data,
    e.apollo_visitor_date,
    e.apollo_visitor_source,
    e.apollo_enriched_at,
    e.linkedin_url,
    e.facebook_url,
    e.founded_year,
    e.keywords,
    e.technologies,
    e.departmental_headcount,
    e.alexa_ranking,
    e.origen,
    e.source,
    e.source_id,
    GREATEST(( SELECT max(i.fecha) AS max
           FROM interacciones i
          WHERE i.empresa_id = e.id), cv.last_activity_at, ( SELECT max(cl.updated_at) AS max
           FROM contact_leads cl
          WHERE cl.empresa_id = e.id), e.updated_at) AS ultima_actividad
   FROM empresas e
     LEFT JOIN company_valuations cv ON e.source_valuation_id = cv.id;

-- 12. v_mandatos_stuck
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
    EXTRACT(day FROM now() - m.last_activity_at) AS days_inactive
   FROM mandatos m
     JOIN pipeline_stages ps ON ps.stage_key = m.pipeline_stage
  WHERE (m.estado <> ALL (ARRAY['cerrado'::text, 'cancelado'::text])) AND m.last_activity_at < (now() - '30 days'::interval)
  ORDER BY (EXTRACT(day FROM now() - m.last_activity_at)) DESC;

-- 13. vw_mandate_pipeline
DROP VIEW IF EXISTS public.vw_mandate_pipeline;
CREATE VIEW public.vw_mandate_pipeline
WITH (security_invoker = true)
AS
SELECT m.id AS mandato_id,
    m.codigo AS mandato_codigo,
    m.descripcion AS mandato_descripcion,
    m.tipo AS mandato_tipo,
    m.estado AS mandato_estado,
    m.sectores_interes,
    m.rango_inversion_min,
    m.rango_inversion_max,
    ml.id AS mandate_lead_id,
    ml.admin_lead_id,
    COALESCE(al.company_name, ml.company_name) AS empresa_nombre,
    COALESCE(al.cif, ml.company_cif) AS empresa_cif,
    COALESCE(al.sector, ml.sector) AS sector,
    COALESCE(al.location, ml.location) AS ubicacion,
    al.facturacion,
    al.ebitda,
    al.empleados,
    COALESCE(al.contact_name, ml.contact_name) AS contacto_nombre,
    COALESCE(al.contact_email, ml.contact_email) AS contacto_email,
    al.contact_phone AS contacto_telefono,
    ml.stage,
    ml.priority AS prioridad,
    ml.assigned_to AS responsable_id,
    au.full_name AS responsable_nombre,
    ml.match_type,
    ml.match_score,
    ml.match_reason,
    ml.source AS fuente,
    ml.created_at AS fecha_asignacion,
    ml.last_activity_at AS ultima_actividad,
    ml.assigned_at AS fecha_responsable,
    EXTRACT(day FROM now() - ml.created_at)::integer AS dias_en_pipeline,
    ml.empresa_id,
    ml.valuation_id,
    al.source_type AS lead_source_type,
    al.source_id AS lead_source_id,
    al.match_status AS admin_lead_match_status
   FROM mandate_leads ml
     LEFT JOIN admin_leads al ON ml.admin_lead_id = al.id
     JOIN mandatos m ON ml.mandato_id = m.id
     LEFT JOIN admin_users au ON ml.assigned_to = au.user_id;