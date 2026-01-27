-- Crear tabla daily_plans
CREATE TABLE public.daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planned_for_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (user_id, planned_for_date)
);

-- Crear tabla daily_plan_items
CREATE TABLE public.daily_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.daily_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  priority TEXT DEFAULT 'media' 
    CHECK (priority IN ('urgente', 'alta', 'media', 'baja')),
  mandato_id UUID REFERENCES public.mandatos(id) ON DELETE SET NULL,
  work_task_type_id UUID REFERENCES public.work_task_types(id) ON DELETE SET NULL,
  assigned_by_admin BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  actual_time_entry_id UUID REFERENCES public.mandato_time_entries(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_daily_plans_user_date ON public.daily_plans(user_id, planned_for_date);
CREATE INDEX idx_daily_plans_status ON public.daily_plans(status);
CREATE INDEX idx_daily_plan_items_plan ON public.daily_plan_items(plan_id);

-- Trigger para updated_at
CREATE TRIGGER update_daily_plans_updated_at
  BEFORE UPDATE ON public.daily_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plan_items ENABLE ROW LEVEL SECURITY;

-- Politicas para daily_plans
CREATE POLICY "Users can view own plans" ON public.daily_plans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own plans" ON public.daily_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft plans" ON public.daily_plans
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all plans" ON public.daily_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );

CREATE POLICY "Admins can update any plan" ON public.daily_plans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );

-- Politicas para daily_plan_items
CREATE POLICY "Users can view own plan items" ON public.daily_plan_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans 
      WHERE id = daily_plan_items.plan_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan items" ON public.daily_plan_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_plans 
      WHERE id = daily_plan_items.plan_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan items" ON public.daily_plan_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans 
      WHERE id = daily_plan_items.plan_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan items" ON public.daily_plan_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.daily_plans 
      WHERE id = daily_plan_items.plan_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all plan items" ON public.daily_plan_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );

CREATE POLICY "Admins can insert plan items" ON public.daily_plan_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );

CREATE POLICY "Admins can update all plan items" ON public.daily_plan_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );

CREATE POLICY "Admins can delete all plan items" ON public.daily_plan_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
      AND is_active = TRUE
    )
  );