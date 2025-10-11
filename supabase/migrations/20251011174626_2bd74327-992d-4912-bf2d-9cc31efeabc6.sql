-- ============================================
-- GESTIÓN DE USUARIOS - MEJORAS DE SEGURIDAD
-- ============================================

-- 1. DROP de policies potencialmente inseguras
DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON public.admin_users;

-- 2. Crear policy ultra-restrictiva para SELECT
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
CREATE POLICY "Admins can view admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  is_user_admin(auth.uid()) OR auth.uid() = user_id
);

-- 3. Solo super_admins pueden INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Super admins manage users" ON public.admin_users;
CREATE POLICY "Super admins manage users"
ON public.admin_users
FOR ALL
TO authenticated
USING (is_user_super_admin(auth.uid()))
WITH CHECK (is_user_super_admin(auth.uid()));

-- 4. Trigger para auditoría de cambios en usuarios
CREATE OR REPLACE FUNCTION log_admin_user_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_user_id,
    target_user_email,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.email, OLD.email),
    to_jsonb(OLD),
    to_jsonb(NEW),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS admin_user_changes_trigger ON public.admin_users;
CREATE TRIGGER admin_user_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION log_admin_user_changes();

-- 5. Función mejorada para crear usuarios temporales
CREATE OR REPLACE FUNCTION public.create_temporary_user_enhanced(
  p_email text,
  p_full_name text,
  p_role admin_role DEFAULT 'editor'::admin_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
  result_data jsonb;
BEGIN
  -- Solo super admins
  IF NOT is_user_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Solo super administradores pueden crear usuarios';
  END IF;
  
  -- Validar email único
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE email = p_email) THEN
    RAISE EXCEPTION 'El email % ya existe', p_email;
  END IF;
  
  -- Generar contraseña temporal segura (20 caracteres)
  temp_password := encode(extensions.gen_random_bytes(15), 'base64');
  temp_password := replace(replace(replace(temp_password, '/', 'A'), '+', 'B'), '=', 'C') || '1!';
  
  -- Generar user_id
  new_user_id := gen_random_uuid();
  
  -- Crear registro en admin_users
  INSERT INTO public.admin_users (
    user_id,
    email,
    full_name,
    role,
    is_active,
    needs_credentials,
    credentials_sent_at
  ) VALUES (
    new_user_id,
    p_email,
    p_full_name,
    p_role,
    true,
    true,
    now()
  );
  
  -- Log de seguridad
  PERFORM public.log_security_event(
    'USER_CREATED_BY_ADMIN',
    'high',
    'admin_users',
    'create_user',
    jsonb_build_object(
      'created_user_email', p_email,
      'created_user_role', p_role,
      'created_by', auth.uid()
    )
  );
  
  result_data := jsonb_build_object(
    'user_id', new_user_id,
    'email', p_email,
    'temporary_password', temp_password,
    'requires_password_change', true,
    'message', 'Usuario creado. Enviar credenciales por email seguro.'
  );
  
  RETURN result_data;
END;
$$;