-- =====================================================
-- MIGRACIÓN DE SEGURIDAD - FASE 4: FUNCIONES RESTANTES CON search_path
-- =====================================================

-- Las funciones de trigger que pueden faltar search_path

-- 1. calculate_time_entry_duration
CREATE OR REPLACE FUNCTION public.calculate_time_entry_duration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. update_mandato_days_in_stage
CREATE OR REPLACE FUNCTION public.update_mandato_days_in_stage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    NEW.stage_entered_at := now();
    NEW.days_in_stage := 0;
  ELSE
    NEW.days_in_stage := EXTRACT(DAY FROM (now() - COALESCE(NEW.stage_entered_at, NEW.created_at)));
  END IF;
  NEW.last_activity_at := now();
  RETURN NEW;
END;
$function$;

-- 3. update_mandato_stage_tracking
CREATE OR REPLACE FUNCTION public.update_mandato_stage_tracking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado 
     OR OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    NEW.stage_entered_at := NOW();
    NEW.days_in_stage := 0;
  END IF;
  NEW.last_activity_at := NOW();
  RETURN NEW;
END;
$function$;

-- 4. update_contacto_on_interaccion
CREATE OR REPLACE FUNCTION public.update_contacto_on_interaccion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.contacto_id IS NOT NULL THEN
    UPDATE public.contactos 
    SET updated_at = NOW() 
    WHERE id = NEW.contacto_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. check_mandato_alert_conditions
CREATE OR REPLACE FUNCTION public.check_mandato_alert_conditions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM generate_mandato_alerts();
  RETURN NEW;
END;
$function$;

-- 6. check_task_alert_conditions
CREATE OR REPLACE FUNCTION public.check_task_alert_conditions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM generate_mandato_alerts();
  RETURN NEW;
END;
$function$;

-- 7. increment_document_download_count
CREATE OR REPLACE FUNCTION public.increment_document_download_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.documents
  SET download_count = download_count + 1,
      updated_at = NOW()
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$function$;

-- 8. increment_job_application_count
CREATE OR REPLACE FUNCTION public.increment_job_application_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.job_posts 
  SET application_count = application_count + 1 
  WHERE id = NEW.job_post_id;
  RETURN NEW;
END;
$function$;

-- 9. log_application_status_change
CREATE OR REPLACE FUNCTION public.log_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.job_application_activities (
      application_id,
      activity_type,
      description,
      performed_by,
      metadata
    ) VALUES (
      NEW.id,
      'status_change',
      'Estado cambiado de ' || OLD.status || ' a ' || NEW.status,
      NEW.reviewed_by,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;