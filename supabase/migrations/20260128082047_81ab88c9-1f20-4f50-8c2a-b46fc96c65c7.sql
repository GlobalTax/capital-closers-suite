-- Tipos de ausencia
CREATE TYPE public.absence_type AS ENUM ('vacation', 'sick_leave', 'personal', 'other');

-- Tabla de ausencias
CREATE TABLE public.user_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  absence_date DATE NOT NULL,
  absence_type absence_type NOT NULL DEFAULT 'vacation',
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Una ausencia por usuario por fecha
  UNIQUE(user_id, absence_date)
);

-- RLS
ALTER TABLE public.user_absences ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver y gestionar sus propias ausencias
CREATE POLICY "Users can manage their own absences"
ON public.user_absences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver y gestionar todas
CREATE POLICY "Admins can manage all absences"
ON public.user_absences
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  )
);

-- Índice para búsquedas por usuario y fecha
CREATE INDEX idx_user_absences_user_date ON public.user_absences(user_id, absence_date);

-- Añadir columna mandate_lead_id a daily_plan_items
ALTER TABLE public.daily_plan_items 
ADD COLUMN IF NOT EXISTS mandate_lead_id UUID REFERENCES public.mandate_leads(id) ON DELETE SET NULL;

-- Índice para búsquedas por lead
CREATE INDEX IF NOT EXISTS idx_daily_plan_items_mandate_lead
ON public.daily_plan_items(mandate_lead_id);