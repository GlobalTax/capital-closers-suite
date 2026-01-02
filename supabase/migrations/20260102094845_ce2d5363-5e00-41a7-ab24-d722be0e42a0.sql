-- =====================================================
-- MIGRACIÓN DE SEGURIDAD - FASE 2: CONVERTIR VISTAS A SECURITY INVOKER
-- =====================================================
-- Las vistas por defecto usan SECURITY DEFINER en PostgreSQL.
-- Esto bypasea RLS. Debemos recrearlas con SECURITY INVOKER.

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
    ((COALESCE(sum(te.duration_minutes), (0)::bigint))::numeric / 60.0) AS total_horas,
    ((COALESCE(sum(
        CASE
            WHEN te.is_billable THEN te.duration_minutes
            ELSE 0
        END), (0)::bigint))::numeric / 60.0) AS horas_facturables,
    (COALESCE(avg(te.duration_minutes), (0)::numeric) / 60.0) AS promedio_horas_por_entrada
FROM (mandatos m
    LEFT JOIN mandato_time_entries te ON (((te.mandato_id = m.id) AND (te.status <> 'rejected'::text))))
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
    ((COALESCE(sum(te.duration_minutes), (0)::bigint))::numeric / 60.0) AS total_horas,
    count(DISTINCT te.user_id) AS usuarios_trabajando
FROM (mandato_checklist_tasks t
    LEFT JOIN mandato_time_entries te ON (((te.task_id = t.id) AND (te.status <> 'rejected'::text))))
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
FROM ((mandato_alerts a
    JOIN mandatos m ON ((a.mandato_id = m.id)))
    LEFT JOIN empresas e ON ((m.empresa_principal_id = e.id)))
WHERE (a.is_dismissed = false)
ORDER BY
    CASE a.severity
        WHEN 'critical'::text THEN 1
        WHEN 'warning'::text THEN 2
        ELSE 3
    END, a.created_at DESC;

-- 4. v_documentos_con_versiones
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
        WHERE ((documentos.parent_document_id = d.id) OR (documentos.id = d.id))) AS total_versions,
    ( SELECT max(documentos.version) AS max
        FROM documentos
        WHERE ((documentos.parent_document_id = d.id) OR (documentos.id = d.id))) AS latest_version
FROM (documentos d
    LEFT JOIN document_folders f ON ((d.folder_id = f.id)))
WHERE ((d.is_latest_version = true) OR (d.parent_document_id IS NULL));

-- 5. v_empleados_completo
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
FROM ((rh_empleados e
    LEFT JOIN rh_empresas emp ON ((e.empresa_id = emp.id)))
    LEFT JOIN rh_departamentos d ON ((e.departamento_id = d.id)));