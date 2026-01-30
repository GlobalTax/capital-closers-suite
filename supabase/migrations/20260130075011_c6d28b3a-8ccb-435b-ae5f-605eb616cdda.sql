-- ============================================
-- FASE 2B: VISTAS RESTANTES CON SECURITY INVOKER
-- ============================================

-- v_empleados_completo
DROP VIEW IF EXISTS public.v_empleados_completo;
CREATE VIEW public.v_empleados_completo
WITH (security_invoker = true)
AS
SELECT e.id,
    e.empresa_id,
    e.departamento_id,
    e.codigo_empleado,
    e.nombre,
    e.puesto,
    e.tipo_contrato,
    e.salario_base,
    e.coste_total_mensual,
    e.is_active,
    e.created_at,
    emp.nombre AS empresa_nombre,
    d.nombre AS departamento_nombre
   FROM rh_empleados e
     LEFT JOIN rh_empresas emp ON e.empresa_id = emp.id
     LEFT JOIN rh_departamentos d ON e.departamento_id = d.id;

-- v_enrichment_stats
DROP VIEW IF EXISTS public.v_enrichment_stats;
CREATE VIEW public.v_enrichment_stats
WITH (security_invoker = true)
AS
SELECT 'portfolio'::text AS entity_type,
    count(*) AS total,
    count(*) FILTER (WHERE cr_portfolio.enriched_at IS NOT NULL) AS enriched,
    count(*) FILTER (WHERE cr_portfolio.enriched_at IS NULL AND cr_portfolio.website IS NOT NULL) AS pending_with_website,
    count(*) FILTER (WHERE cr_portfolio.enriched_at IS NULL AND cr_portfolio.website IS NULL) AS pending_no_website
   FROM cr_portfolio
  WHERE cr_portfolio.is_deleted = false
UNION ALL
 SELECT 'fund'::text AS entity_type,
    count(*) AS total,
    count(*) FILTER (WHERE cr_funds.enriched_at IS NOT NULL) AS enriched,
    count(*) FILTER (WHERE cr_funds.enriched_at IS NULL AND cr_funds.website IS NOT NULL) AS pending_with_website,
    count(*) FILTER (WHERE cr_funds.enriched_at IS NULL AND cr_funds.website IS NULL) AS pending_no_website
   FROM cr_funds
  WHERE cr_funds.is_deleted = false
UNION ALL
 SELECT 'people'::text AS entity_type,
    count(*) AS total,
    count(*) FILTER (WHERE cr_people.enriched_at IS NOT NULL) AS enriched,
    count(*) FILTER (WHERE cr_people.enriched_at IS NULL AND cr_people.linkedin_url IS NOT NULL) AS pending_with_website,
    count(*) FILTER (WHERE cr_people.enriched_at IS NULL AND cr_people.linkedin_url IS NULL) AS pending_no_website
   FROM cr_people
  WHERE cr_people.is_deleted = false
UNION ALL
 SELECT 'lead'::text AS entity_type,
    count(*) AS total,
    count(*) FILTER (WHERE acquisition_leads.company_enriched_at IS NOT NULL) AS enriched,
    count(*) FILTER (WHERE acquisition_leads.company_enriched_at IS NULL AND acquisition_leads.email_domain IS NOT NULL) AS pending_with_website,
    count(*) FILTER (WHERE acquisition_leads.company_enriched_at IS NULL AND acquisition_leads.email_domain IS NULL) AS pending_no_website
   FROM acquisition_leads
  WHERE acquisition_leads.is_deleted = false;

-- v_mandato_costs
DROP VIEW IF EXISTS public.v_mandato_costs;
CREATE VIEW public.v_mandato_costs
WITH (security_invoker = true)
AS
SELECT m.id AS mandato_id,
    m.descripcion,
    m.tipo,
    m.estado,
    e.nombre AS empresa_nombre,
    COALESCE(sum(te.duration_minutes)::numeric / 60.0, 0::numeric) AS total_hours,
    COALESCE(sum(
        CASE
            WHEN te.is_billable THEN te.duration_minutes
            ELSE 0
        END)::numeric / 60.0, 0::numeric) AS billable_hours,
    COALESCE(sum(te.duration_minutes::numeric / 60.0 * COALESCE(br.hourly_rate, 100::numeric)), 0::numeric) AS total_cost,
    COALESCE(sum(
        CASE
            WHEN te.is_billable THEN te.duration_minutes::numeric / 60.0 * COALESCE(br.hourly_rate, 100::numeric)
            ELSE 0::numeric
        END), 0::numeric) AS billable_cost,
    CASE
        WHEN sum(te.duration_minutes) > 0 THEN round(sum(
        CASE
            WHEN te.is_billable THEN te.duration_minutes
            ELSE 0
        END)::numeric / sum(te.duration_minutes)::numeric * 100::numeric, 1)
        ELSE 0::numeric
    END AS billable_percentage,
    count(te.id) AS entries_count
   FROM mandatos m
     LEFT JOIN empresas e ON m.empresa_principal_id = e.id
     LEFT JOIN mandato_time_entries te ON te.mandato_id = m.id
     LEFT JOIN admin_users au ON te.user_id = au.user_id
     LEFT JOIN billing_rates br ON au.role = br.role AND br.is_active = true
  GROUP BY m.id, m.descripcion, m.tipo, m.estado, e.nombre;

-- v_mandatos_winloss
DROP VIEW IF EXISTS public.v_mandatos_winloss;
CREATE VIEW public.v_mandatos_winloss
WITH (security_invoker = true)
AS
SELECT m.id,
    m.tipo,
    m.estado,
    m.outcome,
    m.loss_reason,
    m.loss_notes,
    m.valor,
    m.won_value,
    m.pipeline_stage,
    m.closed_at,
    e.nombre AS empresa_nombre,
    e.sector
   FROM mandatos m
     LEFT JOIN empresas e ON m.empresa_principal_id = e.id
  WHERE m.outcome = ANY (ARRAY['won'::mandato_outcome, 'lost'::mandato_outcome, 'cancelled'::mandato_outcome]);

-- v_nominas_completo
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
   FROM rh_nominas n
     JOIN rh_empleados e ON n.empleado_id = e.id
     JOIN rh_empresas emp ON e.empresa_id = emp.id;

-- v_pipeline_summary
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
    COALESCE(sum(m.valor), 0::numeric) AS total_value,
    COALESCE(sum(m.weighted_value), 0::numeric) AS weighted_value,
    COALESCE(avg(m.days_in_stage), 0::numeric) AS avg_days_in_stage
   FROM pipeline_stages ps
     LEFT JOIN mandatos m ON m.pipeline_stage = ps.stage_key AND m.estado <> 'cancelado'::text
  WHERE ps.is_active = true
  GROUP BY ps.id, ps.stage_key, ps.stage_name, ps.stage_order, ps.color, ps.default_probability
  ORDER BY ps.stage_order;

-- v_sector_multiples
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
  WHERE is_active = true
  ORDER BY display_order, sector_name;

-- v_time_entry_value_stats
DROP VIEW IF EXISTS public.v_time_entry_value_stats;
CREATE VIEW public.v_time_entry_value_stats
WITH (security_invoker = true)
AS
SELECT mandato_id,
    value_type,
    count(*) AS entries_count,
    sum(duration_minutes) AS total_minutes,
    round(sum(duration_minutes)::numeric / 60.0, 2) AS total_hours
   FROM mandato_time_entries
  WHERE status = 'approved'::text
  GROUP BY mandato_id, value_type;

-- vw_campaign_funnel_stats
DROP VIEW IF EXISTS public.vw_campaign_funnel_stats;
CREATE VIEW public.vw_campaign_funnel_stats
WITH (security_invoker = true)
AS
SELECT campaign_id,
    count(*) AS total_recipients,
    count(*) FILTER (WHERE sent_at IS NOT NULL) AS teaser_sent,
    count(*) FILTER (WHERE opened_at IS NOT NULL) AS teaser_opened,
    count(*) FILTER (WHERE nda_status = ANY (ARRAY['sent'::text, 'signed'::text])) AS nda_sent,
    count(*) FILTER (WHERE nda_status = 'signed'::text) AS nda_signed,
    count(*) FILTER (WHERE cim_first_accessed_at IS NOT NULL) AS cim_opened,
    count(*) FILTER (WHERE ioi_received_at IS NOT NULL) AS ioi_received,
    CASE
        WHEN count(*) FILTER (WHERE sent_at IS NOT NULL) > 0 THEN round(count(*) FILTER (WHERE opened_at IS NOT NULL)::numeric / count(*) FILTER (WHERE sent_at IS NOT NULL)::numeric * 100::numeric, 1)
        ELSE 0::numeric
    END AS open_rate,
    CASE
        WHEN count(*) FILTER (WHERE opened_at IS NOT NULL) > 0 THEN round(count(*) FILTER (WHERE nda_status = 'signed'::text)::numeric / count(*) FILTER (WHERE opened_at IS NOT NULL)::numeric * 100::numeric, 1)
        ELSE 0::numeric
    END AS nda_conversion,
    CASE
        WHEN count(*) FILTER (WHERE nda_status = 'signed'::text) > 0 THEN round(count(*) FILTER (WHERE cim_first_accessed_at IS NOT NULL)::numeric / count(*) FILTER (WHERE nda_status = 'signed'::text)::numeric * 100::numeric, 1)
        ELSE 0::numeric
    END AS cim_conversion,
    CASE
        WHEN count(*) FILTER (WHERE cim_first_accessed_at IS NOT NULL) > 0 THEN round(count(*) FILTER (WHERE ioi_received_at IS NOT NULL)::numeric / count(*) FILTER (WHERE cim_first_accessed_at IS NOT NULL)::numeric * 100::numeric, 1)
        ELSE 0::numeric
    END AS ioi_conversion
   FROM teaser_recipients
  GROUP BY campaign_id;