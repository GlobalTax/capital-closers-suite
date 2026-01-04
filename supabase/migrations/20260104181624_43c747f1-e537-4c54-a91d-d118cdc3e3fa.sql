-- Create CRON jobs for Brevo bidirectional sync

-- Job 1: Process brevo sync queue every 5 minutes (CRM → Brevo)
SELECT cron.schedule(
  'process-brevo-queue',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://fwhqtzkkvnjkazhaficj.supabase.co/functions/v1/process-brevo-queue',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aHF0emtrdm5qa2F6aGFmaWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjc5NTMsImV4cCI6MjA2NTQwMzk1M30.Qhb3pRgx3HIoLSjeIulRHorgzw-eqL3WwXhpncHMF7I"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Job 2: Sync from Brevo every hour (Brevo → CRM)
SELECT cron.schedule(
  'sync-from-brevo-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://fwhqtzkkvnjkazhaficj.supabase.co/functions/v1/sync-from-brevo',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aHF0emtrdm5qa2F6aGFmaWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4Mjc5NTMsImV4cCI6MjA2NTQwMzk1M30.Qhb3pRgx3HIoLSjeIulRHorgzw-eqL3WwXhpncHMF7I"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Job 3: Cleanup old completed sync queue items daily at 3 AM
SELECT cron.schedule(
  'cleanup-brevo-sync-queue',
  '0 3 * * *',
  $$
  SELECT public.cleanup_brevo_sync_queue();
  $$
);