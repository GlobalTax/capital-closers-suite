-- =====================================================
-- MIGRACIÓN DE SEGURIDAD - FASE 5: MÁS FUNCIONES CON search_path
-- =====================================================

-- Funciones adicionales que probablemente faltan search_path

-- 1. set_deleted_at
CREATE OR REPLACE FUNCTION public.set_deleted_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    NEW.deleted_at = now();
  END IF;
  IF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
    NEW.deleted_at = NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. set_deleted_at_contacts
CREATE OR REPLACE FUNCTION public.set_deleted_at_contacts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_deleted = TRUE AND (OLD.is_deleted IS NULL OR OLD.is_deleted = FALSE) THEN
    NEW.deleted_at = now();
  END IF;
  IF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
    NEW.deleted_at = NULL;
    NEW.deletion_reason = NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. set_deleted_at_operations
CREATE OR REPLACE FUNCTION public.set_deleted_at_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    NEW.deleted_at = now();
  END IF;
  IF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
    NEW.deleted_at = NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. set_user_id_on_valuation
CREATE OR REPLACE FUNCTION public.set_user_id_on_valuation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. update_admin_users_updated_at
CREATE OR REPLACE FUNCTION public.update_admin_users_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 6. update_banners_updated_at
CREATE OR REPLACE FUNCTION public.update_banners_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 7. update_investor_leads_updated_at
CREATE OR REPLACE FUNCTION public.update_investor_leads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 8. update_updated_at_general_contact_leads
CREATE OR REPLACE FUNCTION public.update_updated_at_general_contact_leads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;