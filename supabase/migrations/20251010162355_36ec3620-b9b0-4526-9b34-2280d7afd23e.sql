-- ============================================
-- AUDIT LOGGING SYSTEM - Complete Implementation (Fixed)
-- ============================================

-- 1. Create audit_logs table with comprehensive tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- 3. Create generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  changed_fields text[];
  user_email_val text;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email_val 
  FROM auth.users 
  WHERE id = auth.uid() 
  LIMIT 1;

  -- Prepare data based on operation type
  IF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Detect changed fields
    SELECT array_agg(key)
    INTO changed_fields
    FROM jsonb_each(new_data)
    WHERE new_data->key IS DISTINCT FROM old_data->key;
  ELSIF (TG_OP = 'INSERT') THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    changed_fields,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    user_email_val,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data,
    changed_fields,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Apply audit triggers to critical tables (only existing tables)
CREATE TRIGGER audit_mandatos
  AFTER INSERT OR UPDATE OR DELETE ON public.mandatos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_contactos
  AFTER INSERT OR UPDATE OR DELETE ON public.contactos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_empresas
  AFTER INSERT OR UPDATE OR DELETE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_interacciones
  AFTER INSERT OR UPDATE OR DELETE ON public.interacciones
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_tareas
  AFTER INSERT OR UPDATE OR DELETE ON public.tareas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_documentos
  AFTER INSERT OR UPDATE OR DELETE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_mandato_checklist_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.mandato_checklist_tasks
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 5. Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for audit_logs
CREATE POLICY "Super admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (is_user_super_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- No UPDATE or DELETE policies - logs are immutable

-- 7. Create cleanup function for old logs (optional, for data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - INTERVAL '12 months';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;