-- =====================================================
-- Daily Plan Modification Notifications System
-- =====================================================

-- 1. Table: Authorized editors who trigger notifications
CREATE TABLE public.daily_plan_authorized_editors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_plan_authorized_editors ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage authorized editors
CREATE POLICY "super_admin_manage_authorized_editors" 
ON public.daily_plan_authorized_editors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin' 
    AND is_active = true
  )
);

-- Allow trigger function to read (SECURITY DEFINER will bypass RLS anyway)
CREATE POLICY "allow_read_for_trigger" 
ON public.daily_plan_authorized_editors 
FOR SELECT 
USING (true);

-- 2. Table: Notifications outbox
CREATE TABLE public.daily_plan_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  plan_owner_id UUID NOT NULL,
  editor_id UUID NOT NULL,
  editor_email TEXT NOT NULL,
  editor_name TEXT,
  planned_for_date DATE NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  item_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error TEXT
);

-- Enable RLS
ALTER TABLE public.daily_plan_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "admins_view_notifications" 
ON public.daily_plan_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin') 
    AND is_active = true
  )
);

-- Index for processing pending notifications
CREATE INDEX idx_daily_plan_notifications_pending 
ON public.daily_plan_notifications (processed_at) 
WHERE processed_at IS NULL;

-- Index for lookups by plan
CREATE INDEX idx_daily_plan_notifications_plan 
ON public.daily_plan_notifications (plan_id);

-- 3. Trigger function to queue notifications
CREATE OR REPLACE FUNCTION public.notify_plan_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_plan_owner_id UUID;
  v_planned_for_date DATE;
  v_editor_id UUID;
  v_editor_email TEXT;
  v_editor_name TEXT;
  v_item_title TEXT;
  v_is_authorized BOOLEAN;
BEGIN
  -- Get plan_id from the affected row
  v_plan_id := COALESCE(NEW.plan_id, OLD.plan_id);
  v_item_title := COALESCE(NEW.title, OLD.title);
  
  -- Get plan owner and date
  SELECT user_id, planned_for_date 
  INTO v_plan_owner_id, v_planned_for_date
  FROM daily_plans 
  WHERE id = v_plan_id;
  
  -- Skip if plan not found
  IF v_plan_owner_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Get current user (editor)
  v_editor_id := auth.uid();
  
  -- Skip if no authenticated user
  IF v_editor_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Skip if editor is the plan owner (self-modification)
  IF v_editor_id = v_plan_owner_id THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Get editor email from auth.users
  SELECT email INTO v_editor_email
  FROM auth.users WHERE id = v_editor_id;
  
  -- Get editor name from admin_users
  SELECT full_name INTO v_editor_name
  FROM admin_users WHERE user_id = v_editor_id;
  
  -- Check if editor is authorized to trigger notifications
  SELECT EXISTS(
    SELECT 1 FROM daily_plan_authorized_editors 
    WHERE LOWER(email) = LOWER(v_editor_email) AND is_active = true
  ) INTO v_is_authorized;
  
  -- Only queue notification if editor is authorized
  IF v_is_authorized THEN
    INSERT INTO daily_plan_notifications (
      plan_id, plan_owner_id, editor_id, editor_email, editor_name,
      planned_for_date, operation, item_title
    ) VALUES (
      v_plan_id, v_plan_owner_id, v_editor_id, v_editor_email, v_editor_name,
      v_planned_for_date, TG_OP, v_item_title
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Create trigger on daily_plan_items
CREATE TRIGGER notify_plan_modification_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.daily_plan_items
FOR EACH ROW
EXECUTE FUNCTION public.notify_plan_modification();

-- 5. Insert initial authorized editors
INSERT INTO public.daily_plan_authorized_editors (email, name) VALUES
  ('lluis@capittal.es', 'Lluis Montanya'),
  ('s.navarro@nrro.es', 'Samuel Navarro')
ON CONFLICT (email) DO NOTHING;