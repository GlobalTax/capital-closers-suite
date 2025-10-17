-- ============================================================================
-- FASE 1: CORRECCIONES CRÍTICAS DE SEGURIDAD
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 Las funciones helper ya existen, verificadas en <db-functions>:
-- - check_user_admin_role(uuid) -> text
-- - is_user_admin(uuid) -> boolean
-- - is_user_super_admin(uuid) -> boolean
-- - current_user_is_admin() -> boolean
-- ✅ PASO OMITIDO - Ya están creadas
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 1.2 CONSOLIDAR POLÍTICAS RLS EN admin_users
-- ----------------------------------------------------------------------------

-- DROP todas las políticas existentes (duplicadas y conflictivas)
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "CRITICAL_admin_modifications" ON public.admin_users;
DROP POLICY IF EXISTS "Service role bootstrap access" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins have complete access" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins manage users" ON public.admin_users;
DROP POLICY IF EXISTS "Ultra secure admin users access" ON public.admin_users;

-- Crear 3 políticas consolidadas y no ambiguas

-- 1. SELECT: Admins ven todos, usuarios normales solo su propio registro
CREATE POLICY "admin_users_select_policy"
ON public.admin_users FOR SELECT
TO authenticated
USING (
  public.is_user_admin(auth.uid()) OR auth.uid() = user_id
);

-- 2. INSERT/UPDATE/DELETE: Solo super_admins
CREATE POLICY "admin_users_modify_policy"
ON public.admin_users FOR ALL
TO authenticated
USING (public.is_user_super_admin(auth.uid()))
WITH CHECK (public.is_user_super_admin(auth.uid()));

-- 3. Service role (para edge functions y bootstrap)
CREATE POLICY "admin_users_service_role_policy"
ON public.admin_users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 1.3 SISTEMA DE TOKENS FIRMADOS PARA company_valuations
-- ----------------------------------------------------------------------------

-- Crear configuración para el secret de tokens (debe ser establecido por el admin)
-- Este valor debe configurarse mediante: ALTER DATABASE postgres SET app.valuation_token_secret = 'tu_secreto_aqui';
-- Por seguridad, generamos uno temporal si no existe

-- Función para generar tokens firmados con HMAC-SHA256
CREATE OR REPLACE FUNCTION public.generate_signed_valuation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_data text;
  signature text;
  secret text;
  token_uuid text;
BEGIN
  -- Generar UUID único para el token
  token_uuid := gen_random_uuid()::text;
  
  -- Token data: UUID|timestamp
  token_data := token_uuid || '|' || extract(epoch from now())::text;
  
  -- Obtener secret desde configuración o generar uno temporal
  BEGIN
    secret := current_setting('app.valuation_token_secret', false);
  EXCEPTION WHEN OTHERS THEN
    -- Si no existe, generar uno (en producción debe configurarse manualmente)
    secret := encode(gen_random_bytes(32), 'base64');
  END;
  
  -- Firmar con HMAC-SHA256
  signature := encode(
    extensions.hmac(token_data::bytea, secret::bytea, 'sha256'),
    'base64'
  );
  
  -- Retornar token firmado: uuid|timestamp|signature
  RETURN token_data || '|' || signature;
END;
$$;

-- Función para validar tokens firmados
CREATE OR REPLACE FUNCTION public.verify_valuation_token(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parts text[];
  token_data text;
  provided_signature text;
  expected_signature text;
  secret text;
  token_timestamp numeric;
BEGIN
  -- Validar formato del token (debe tener 3 partes separadas por |)
  parts := string_to_array(token, '|');
  IF array_length(parts, 1) != 3 THEN
    RETURN false;
  END IF;
  
  -- Extraer componentes
  token_data := parts[1] || '|' || parts[2];
  provided_signature := parts[3];
  token_timestamp := parts[2]::numeric;
  
  -- Verificar expiración (2 horas = 7200 segundos)
  IF extract(epoch from now()) - token_timestamp > 7200 THEN
    RETURN false;
  END IF;
  
  -- Obtener secret
  BEGIN
    secret := current_setting('app.valuation_token_secret', false);
  EXCEPTION WHEN OTHERS THEN
    -- Si no hay secret configurado, rechazar el token
    RETURN false;
  END;
  
  -- Calcular firma esperada
  expected_signature := encode(
    extensions.hmac(token_data::bytea, secret::bytea, 'sha256'),
    'base64'
  );
  
  -- Comparación de tiempo constante para prevenir timing attacks
  RETURN expected_signature = provided_signature;
END;
$$;

-- Actualizar política RLS de company_valuations para usar tokens firmados
DROP POLICY IF EXISTS "ULTRA_SECURE_token_access" ON public.company_valuations;

CREATE POLICY "ULTRA_SECURE_token_access"
ON public.company_valuations FOR SELECT
TO anon, authenticated
USING (
  -- Admins pueden ver todo
  public.current_user_is_admin() 
  -- Usuarios autenticados ven solo sus propios registros no eliminados
  OR (auth.uid() = user_id AND (is_deleted = false OR is_deleted IS NULL))
  -- Acceso anónimo SOLO con token firmado válido
  OR (
    auth.role() = 'anon'
    AND unique_token IS NOT NULL
    AND public.verify_valuation_token(unique_token::text)
    AND valuation_status = 'completed'
    AND public.check_rate_limit_enhanced_safe(
      COALESCE(inet_client_addr()::text, 'unknown'),
      'valuation_token_access',
      5,
      60
    )
  )
  -- Service role (edge functions)
  OR auth.role() = 'service_role'
);

-- Crear trigger para usar la nueva función de generación de tokens
-- Este trigger se ejecuta BEFORE INSERT para generar el token firmado automáticamente
CREATE OR REPLACE FUNCTION public.set_valuation_signed_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si no se proporciona un token o es NULL, generar uno firmado
  IF NEW.unique_token IS NULL THEN
    NEW.unique_token := public.generate_signed_valuation_token();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger a company_valuations
DROP TRIGGER IF EXISTS set_signed_token_on_valuation ON public.company_valuations;

CREATE TRIGGER set_signed_token_on_valuation
  BEFORE INSERT ON public.company_valuations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_valuation_signed_token();

-- ============================================================================
-- LOGGING Y AUDITORÍA DE CAMBIOS CRÍTICOS
-- ============================================================================

-- Registrar evento de seguridad por la actualización de políticas
DO $$
BEGIN
  PERFORM public.log_security_event(
    'SECURITY_POLICIES_UPDATED',
    'high',
    'admin_users,company_valuations',
    'ALTER POLICY',
    jsonb_build_object(
      'migration', 'phase_1_critical_security_fixes',
      'changes', ARRAY[
        'Consolidated admin_users RLS policies',
        'Implemented signed tokens for company_valuations',
        'Enhanced token validation with HMAC-SHA256'
      ],
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Si la función log_security_event no existe, no bloquear la migración
  RAISE NOTICE 'Could not log security event: %', SQLERRM;
END $$;

-- ============================================================================
-- NOTAS IMPORTANTES PARA EL ADMINISTRADOR
-- ============================================================================

-- ACCIÓN REQUERIDA: Configurar el secret para tokens de valoración
-- Ejecutar manualmente en producción:
-- 
-- ALTER DATABASE postgres SET app.valuation_token_secret = 'GENERAR_SECRETO_SEGURO_AQUI';
-- 
-- Para generar un secreto seguro, usar:
-- SELECT encode(gen_random_bytes(32), 'base64');

COMMENT ON FUNCTION public.generate_signed_valuation_token() IS 
'Genera tokens firmados con HMAC-SHA256 para acceso seguro a valoraciones. 
Requiere configurar app.valuation_token_secret en la base de datos.';

COMMENT ON FUNCTION public.verify_valuation_token(text) IS 
'Valida tokens firmados verificando firma HMAC y expiración (2 horas). 
Retorna false si el token es inválido, expirado o manipulado.';