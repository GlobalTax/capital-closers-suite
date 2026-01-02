-- =====================================================
-- MIGRACIÓN DE SEGURIDAD - FASE 1: FUNCIONES CON search_path
-- =====================================================

-- Añadir search_path a funciones vulnerables para prevenir ataques de path injection

-- 1. update_advisor_valuations_updated_at
CREATE OR REPLACE FUNCTION public.update_advisor_valuations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 2. update_form_sessions_updated_at
CREATE OR REPLACE FUNCTION public.update_form_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 3. update_ai_imports_updated_at
CREATE OR REPLACE FUNCTION public.update_ai_imports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. update_document_folders_updated_at
CREATE OR REPLACE FUNCTION public.update_document_folders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. update_saved_operations_updated_at
CREATE OR REPLACE FUNCTION public.update_saved_operations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 6. update_buyer_testimonials_updated_at
CREATE OR REPLACE FUNCTION public.update_buyer_testimonials_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 7. update_operation_notes_timestamp
CREATE OR REPLACE FUNCTION public.update_operation_notes_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 8. update_operation_documents_updated_at
CREATE OR REPLACE FUNCTION public.update_operation_documents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 9. set_document_deleted_at
CREATE OR REPLACE FUNCTION public.set_document_deleted_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    NEW.deleted_at = now();
    NEW.deleted_by = auth.uid();
  END IF;
  IF NEW.is_deleted = false AND OLD.is_deleted = true THEN
    NEW.deleted_at = NULL;
    NEW.deleted_by = NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- 10. manage_document_version
CREATE OR REPLACE FUNCTION public.manage_document_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  IF NEW.parent_document_id IS NOT NULL THEN
    UPDATE public.operation_documents
    SET is_latest_version = false
    WHERE operation_id = NEW.operation_id
      AND (id = NEW.parent_document_id OR parent_document_id = NEW.parent_document_id)
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 11. update_list_contact_count
CREATE OR REPLACE FUNCTION public.update_list_contact_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.contact_lists 
    SET contact_count = contact_count + 1 
    WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.contact_lists 
    SET contact_count = contact_count - 1 
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 12. update_tag_usage_count
CREATE OR REPLACE FUNCTION public.update_tag_usage_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.contact_tags 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.contact_tags 
    SET usage_count = usage_count - 1 
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 13. log_booking_assignment
CREATE OR REPLACE FUNCTION public.log_booking_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO public.booking_assignment_history (booking_id, assigned_to, assigned_by, assigned_at)
    VALUES (NEW.id, NEW.assigned_to, NEW.assigned_by, COALESCE(NEW.assigned_at, now()));
  END IF;
  RETURN NEW;
END;
$function$;

-- 14. update_valuation_activity
CREATE OR REPLACE FUNCTION public.update_valuation_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.last_activity_at = now();
  
  IF NEW.final_valuation IS NOT NULL THEN
    NEW.valuation_status = 'completed';
    NEW.completion_percentage = 100;
  ELSIF NEW.revenue IS NOT NULL AND NEW.ebitda IS NOT NULL THEN
    NEW.valuation_status = 'in_progress';
    NEW.completion_percentage = CASE 
      WHEN NEW.contact_name IS NOT NULL AND NEW.company_name IS NOT NULL 
           AND NEW.email IS NOT NULL AND NEW.industry IS NOT NULL 
           AND NEW.employee_range IS NOT NULL AND NEW.revenue IS NOT NULL 
           AND NEW.ebitda IS NOT NULL THEN 75
      ELSE 50
    END;
  ELSE
    NEW.valuation_status = 'in_progress';
    NEW.completion_percentage = CASE 
      WHEN NEW.contact_name IS NOT NULL AND NEW.company_name IS NOT NULL 
           AND NEW.email IS NOT NULL AND NEW.industry IS NOT NULL 
           AND NEW.employee_range IS NOT NULL THEN 25
      ELSE 10
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 15. create_mention_notifications
CREATE OR REPLACE FUNCTION public.create_mention_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  mentioned_user UUID;
BEGIN
  IF NEW.mentions IS NOT NULL AND jsonb_array_length(NEW.mentions) > 0 THEN
    FOR mentioned_user IN 
      SELECT (jsonb_array_elements_text(NEW.mentions))::UUID
    LOOP
      IF mentioned_user != NEW.user_id THEN
        INSERT INTO note_mentions (note_id, mentioned_user_id)
        VALUES (NEW.id, mentioned_user)
        ON CONFLICT (note_id, mentioned_user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 16. log_operation_changes
CREATE OR REPLACE FUNCTION public.log_operation_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  change_type_val TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    change_type_val := 'create';
    INSERT INTO operation_history (operation_id, changed_by, field_changed, old_value, new_value, change_type)
    VALUES (NEW.id, (SELECT user_id FROM admin_users WHERE user_id = auth.uid() LIMIT 1), 'created', NULL, to_jsonb(NEW), change_type_val);
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO operation_history (operation_id, changed_by, field_changed, old_value, new_value, change_type)
      VALUES (NEW.id, (SELECT user_id FROM admin_users WHERE user_id = auth.uid() LIMIT 1), 'status', to_jsonb(OLD.status), to_jsonb(NEW.status), 'status_change');
    END IF;
    
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO operation_history (operation_id, changed_by, field_changed, old_value, new_value, change_type)
      VALUES (NEW.id, (SELECT user_id FROM admin_users WHERE user_id = auth.uid() LIMIT 1), 'assigned_to', to_jsonb(OLD.assigned_to), to_jsonb(NEW.assigned_to), 'assignment');
    END IF;
    
    IF OLD.valuation_amount IS DISTINCT FROM NEW.valuation_amount THEN
      INSERT INTO operation_history (operation_id, changed_by, field_changed, old_value, new_value, change_type)
      VALUES (NEW.id, (SELECT user_id FROM admin_users WHERE user_id = auth.uid() LIMIT 1), 'valuation_amount', to_jsonb(OLD.valuation_amount), to_jsonb(NEW.valuation_amount), 'update');
    END IF;
    
    IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
      INSERT INTO operation_history (operation_id, changed_by, field_changed, old_value, new_value, change_type)
      VALUES (NEW.id, (SELECT user_id FROM admin_users WHERE user_id = auth.uid() LIMIT 1), 'company_name', to_jsonb(OLD.company_name), to_jsonb(NEW.company_name), 'update');
    END IF;
    
    IF OLD.sector IS DISTINCT FROM NEW.sector THEN
      INSERT INTO operation_history (operation_id, changed_by, field_changed, old_value, new_value, change_type)
      VALUES (NEW.id, (SELECT user_id FROM admin_users WHERE user_id = auth.uid() LIMIT 1), 'sector', to_jsonb(OLD.sector), to_jsonb(NEW.sector), 'update');
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO operation_history (operation_id, changed_by, field_changed, old_value, new_value, change_type)
    VALUES (OLD.id, (SELECT user_id FROM admin_users WHERE user_id = auth.uid() LIMIT 1), 'deleted', to_jsonb(OLD), NULL, 'delete');
  END IF;
  
  RETURN NEW;
END;
$function$;