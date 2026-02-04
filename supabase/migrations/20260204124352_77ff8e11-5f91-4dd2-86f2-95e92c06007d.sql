-- Schedule cron job to process plan modification notifications every minute
SELECT cron.schedule(
  'process-plan-modification-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fwhqtzkkvnjkazhaficj.supabase.co/functions/v1/send-plan-modification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aHF0emtrdm5qa2F6aGFmaWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjc5NTMsImV4cCI6MjA2NTQwMzk1M30.Qhb3pRgx3HIoLSjeIulRHorgzw-eqL3WwXhpncHMF7I'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);