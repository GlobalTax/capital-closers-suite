-- Add missing columns to daily_plans and daily_plan_items

-- Add total_estimated_minutes to daily_plans (cached calculation)
ALTER TABLE public.daily_plans 
ADD COLUMN IF NOT EXISTS total_estimated_minutes INTEGER DEFAULT 0;

-- Add created_by to daily_plan_items
ALTER TABLE public.daily_plan_items 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create function to auto-update total_estimated_minutes
CREATE OR REPLACE FUNCTION public.update_daily_plan_total_minutes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE daily_plans
  SET total_estimated_minutes = (
    SELECT COALESCE(SUM(estimated_minutes), 0)
    FROM daily_plan_items
    WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to auto-calculate total minutes when items change
DROP TRIGGER IF EXISTS trg_update_plan_total_minutes ON public.daily_plan_items;
CREATE TRIGGER trg_update_plan_total_minutes
AFTER INSERT OR UPDATE OF estimated_minutes OR DELETE ON public.daily_plan_items
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_plan_total_minutes();

-- Backfill existing plans with calculated totals
UPDATE public.daily_plans dp
SET total_estimated_minutes = (
  SELECT COALESCE(SUM(estimated_minutes), 0)
  FROM public.daily_plan_items dpi
  WHERE dpi.plan_id = dp.id
);