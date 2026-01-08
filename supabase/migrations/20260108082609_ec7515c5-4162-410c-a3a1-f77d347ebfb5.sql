-- Fix audit trigger to handle empty request.headers safely
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
  user_agent_val text;
  headers_text text;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email_val 
  FROM auth.users 
  WHERE id = auth.uid() 
  LIMIT 1;

  -- Safely extract user-agent from headers
  headers_text := current_setting('request.headers', true);
  IF headers_text IS NOT NULL AND headers_text != '' THEN
    BEGIN
      user_agent_val := (headers_text::json)->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
      user_agent_val := NULL;
    END;
  ELSE
    user_agent_val := NULL;
  END IF;

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
    user_agent_val
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;