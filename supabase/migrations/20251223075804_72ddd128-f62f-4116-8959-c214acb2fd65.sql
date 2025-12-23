-- =============================================
-- FIX: Bucle infinito de cambio de contraseña
-- =============================================

-- 1. Crear función SECURITY DEFINER para actualizar needs_credentials
-- Esto bypasea las políticas RLS restrictivas
CREATE OR REPLACE FUNCTION public.complete_password_setup()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE admin_users
  SET 
    needs_credentials = false,
    updated_at = now()
  WHERE user_id = auth.uid();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log para auditoría
  IF updated_count > 0 THEN
    RAISE LOG 'PASSWORD_SETUP_COMPLETE: user_id=%, timestamp=%', auth.uid(), now();
  END IF;
  
  RETURN updated_count > 0;
END;
$$;

-- 2. Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.complete_password_setup() TO authenticated;

-- 3. Arreglar usuarios existentes atrapados en el bucle
-- (usuarios que ya hicieron login pero siguen con needs_credentials = true)
UPDATE admin_users
SET 
  needs_credentials = false,
  updated_at = now()
WHERE 
  needs_credentials = true
  AND last_login IS NOT NULL;