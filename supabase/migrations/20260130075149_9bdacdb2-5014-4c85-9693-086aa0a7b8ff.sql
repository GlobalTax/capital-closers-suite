-- ============================================
-- FASE 3B: MÁS FUNCIONES CON search_path
-- ============================================

-- calculate_email_retry_at
CREATE OR REPLACE FUNCTION public.calculate_email_retry_at(attempts integer)
RETURNS timestamp with time zone
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
  delays INTEGER[] := ARRAY[60, 300, 1800];
  delay_seconds INTEGER;
BEGIN
  delay_seconds := delays[LEAST(attempts + 1, array_length(delays, 1))];
  RETURN now() + (delay_seconds || ' seconds')::interval;
END;
$function$;

-- gen_random_bytes
CREATE OR REPLACE FUNCTION public.gen_random_bytes(integer)
RETURNS bytea
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT extensions.gen_random_bytes($1);
$function$;

-- get_sector_dossier_stats
CREATE OR REPLACE FUNCTION public.get_sector_dossier_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSON;
  total_dossiers_count INT;
  unique_sectors_count INT;
  cache_hits INT;
  total_generations INT;
BEGIN
  SELECT COUNT(*) INTO total_dossiers_count
  FROM lead_ai_reports
  WHERE lead_type LIKE 'sector_dossier:%'
    AND generation_status = 'completed';
  
  SELECT COUNT(DISTINCT REPLACE(lead_type, 'sector_dossier:', ''))
  INTO unique_sectors_count
  FROM lead_ai_reports
  WHERE lead_type LIKE 'sector_dossier:%'
    AND generation_status = 'completed';
  
  SELECT 
    COUNT(CASE WHEN rn > 1 THEN 1 END) as hits,
    COUNT(*) as total
  INTO cache_hits, total_generations
  FROM (
    SELECT 
      lead_type,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY lead_type 
        ORDER BY created_at
      ) as rn
    FROM lead_ai_reports
    WHERE lead_type LIKE 'sector_dossier:%'
      AND generation_status = 'completed'
  ) ranked;
  
  SELECT json_build_object(
    'total_dossiers', total_dossiers_count,
    'unique_sectors', unique_sectors_count,
    'total_cost', COALESCE((
      SELECT SUM(cost_usd) 
      FROM lead_ai_reports 
      WHERE lead_type LIKE 'sector_dossier:%'
        AND generation_status = 'completed'
    ), 0),
    'total_tokens', COALESCE((
      SELECT SUM(tokens_used) 
      FROM lead_ai_reports 
      WHERE lead_type LIKE 'sector_dossier:%'
        AND generation_status = 'completed'
    ), 0),
    'cache_hit_rate', 
      CASE 
        WHEN total_generations > 0 
        THEN ROUND((cache_hits::NUMERIC / total_generations) * 100, 1)
        ELSE 0
      END,
    'avg_processing_time', COALESCE((
      SELECT ROUND(AVG(processing_time_seconds), 1)
      FROM lead_ai_reports
      WHERE lead_type LIKE 'sector_dossier:%'
        AND generation_status = 'completed'
        AND processing_time_seconds IS NOT NULL
    ), 0),
    'by_sector', (
      SELECT json_agg(
        json_build_object(
          'sector', REPLACE(lead_type, 'sector_dossier:', ''),
          'count', count,
          'avg_cost', avg_cost,
          'avg_tokens', avg_tokens,
          'useful_percentage', useful_pct,
          'last_generated', last_gen
        )
      )
      FROM (
        SELECT 
          r.lead_type,
          COUNT(*) as count,
          ROUND(AVG(r.cost_usd), 5) as avg_cost,
          ROUND(AVG(r.tokens_used), 0) as avg_tokens,
          MAX(r.created_at) as last_gen,
          CASE 
            WHEN COUNT(f.id) > 0 THEN
              ROUND(
                (COUNT(CASE WHEN f.is_useful = true THEN 1 END)::NUMERIC 
                / COUNT(f.id)) * 100, 
                1
              )
            ELSE 0
          END as useful_pct
        FROM lead_ai_reports r
        LEFT JOIN lead_ai_report_feedback f ON r.id = f.report_id
        WHERE r.lead_type LIKE 'sector_dossier:%'
          AND r.generation_status = 'completed'
        GROUP BY r.lead_type
        ORDER BY count DESC, last_gen DESC
        LIMIT 10
      ) sector_stats
    )
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- log_cr_fund_changes
CREATE OR REPLACE FUNCTION public.log_cr_fund_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  changed_field TEXT;
  old_val TEXT;
  new_val TEXT;
  fields_to_track TEXT[] := ARRAY[
    'name', 'fund_type', 'website', 'country_base', 'status', 'founded_year',
    'aum', 'current_fund_number', 'current_fund_size', 'description',
    'ticket_min', 'ticket_max', 'ebitda_min', 'ebitda_max', 'revenue_min', 'revenue_max',
    'notes_internal', 'source_url'
  ];
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.cr_fund_audit_log (fund_id, action, changed_by)
    VALUES (NEW.id, 'INSERT', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    FOREACH changed_field IN ARRAY fields_to_track
    LOOP
      EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', changed_field, changed_field)
      INTO old_val, new_val
      USING OLD, NEW;
      
      IF old_val IS DISTINCT FROM new_val THEN
        INSERT INTO public.cr_fund_audit_log (fund_id, action, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'UPDATE', changed_field, old_val, new_val, auth.uid());
      END IF;
    END LOOP;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.cr_fund_audit_log (fund_id, action, changed_by)
    VALUES (OLD.id, 'DELETE', auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- log_critical_security_violation
CREATE OR REPLACE FUNCTION public.log_critical_security_violation(violation_type text, target_table text, details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    user_id,
    ip_address,
    details
  ) VALUES (
    violation_type,
    'critical',
    auth.uid(),
    inet_client_addr(),
    jsonb_build_object(
      'timestamp', now(),
      'user_role', auth.role(),
      'target_table', target_table,
      'action', 'SECURITY_VIOLATION',
      'violation_details', details
    )
  );

  RAISE WARNING 'CRITICAL_SECURITY_VIOLATION: % on table % - User: % - Details: %', 
    violation_type, target_table, auth.uid(), details;
END;
$function$;

-- log_snapshot_to_history
CREATE OR REPLACE FUNCTION public.log_snapshot_to_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO campaign_cost_history (
    campaign_cost_id,
    campaign_name,
    channel,
    results,
    amount,
    cost_per_result,
    daily_budget,
    monthly_budget,
    target_cpl,
    internal_status,
    delivery_status,
    notes,
    changed_by,
    change_type
  )
  SELECT 
    NEW.id,
    c.name,
    c.channel,
    NEW.results,
    NEW.amount_spent,
    CASE WHEN NEW.results > 0 THEN NEW.amount_spent / NEW.results ELSE NULL END,
    NEW.daily_budget,
    NEW.monthly_budget,
    NEW.target_cpl,
    NEW.internal_status,
    c.delivery_status,
    NEW.notes,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END
  FROM campaigns c WHERE c.id = NEW.campaign_id;
  
  RETURN NEW;
END;
$function$;

-- set_lead_received_at_buyer
CREATE OR REPLACE FUNCTION public.set_lead_received_at_buyer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.lead_received_at IS NULL THEN
    NEW.lead_received_at := COALESCE(NEW.created_at, NOW());
  END IF;
  RETURN NEW;
END;
$function$;

-- unlink_valuation_from_empresa
CREATE OR REPLACE FUNCTION public.unlink_valuation_from_empresa(p_valuation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.company_valuations 
  SET empresa_id = NULL
  WHERE id = p_valuation_id;
  RETURN FOUND;
END;
$function$;

-- update_campaign_updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_capittal_sync_state_timestamp
CREATE OR REPLACE FUNCTION public.update_capittal_sync_state_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_cr_updated_at
CREATE OR REPLACE FUNCTION public.update_cr_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_mna_apollo_visitor_imports_updated_at
CREATE OR REPLACE FUNCTION public.update_mna_apollo_visitor_imports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_newsletter_campaigns_updated_at
CREATE OR REPLACE FUNCTION public.update_newsletter_campaigns_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_sidebar_updated_at
CREATE OR REPLACE FUNCTION public.update_sidebar_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- update_tarea_last_activity
CREATE OR REPLACE FUNCTION public.update_tarea_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.last_activity_at = now();
  
  IF NEW.estado = 'completada' THEN
    NEW.health_status = 'healthy';
  ELSIF NEW.fecha_vencimiento IS NOT NULL AND NEW.fecha_vencimiento < CURRENT_DATE THEN
    NEW.health_status = 'overdue';
  ELSIF NEW.last_activity_at < now() - INTERVAL '7 days' AND NEW.estado != 'completada' THEN
    NEW.health_status = 'at_risk';
  ELSE
    NEW.health_status = 'healthy';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;