-- Add audit triggers for daily_plans and daily_plan_items tables
-- This will track all changes in the audit_logs table

-- Trigger for daily_plans
CREATE TRIGGER audit_daily_plans
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_plans
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger for daily_plan_items
CREATE TRIGGER audit_daily_plan_items
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_plan_items
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();