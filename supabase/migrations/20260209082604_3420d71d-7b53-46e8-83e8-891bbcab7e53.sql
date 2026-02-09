-- Remove lluis@capittal.es and samuel@capittal.es from daily hours report recipients
DELETE FROM public.report_email_recipients
WHERE LOWER(email) IN ('lluis@capittal.es', 'samuel@capittal.es')
  AND report_type = 'hours_daily';

-- Deactivate them from daily_plan_authorized_editors (keep records for audit)
UPDATE public.daily_plan_authorized_editors
SET is_active = false
WHERE LOWER(email) IN ('lluis@capittal.es', 's.navarro@nrro.es');