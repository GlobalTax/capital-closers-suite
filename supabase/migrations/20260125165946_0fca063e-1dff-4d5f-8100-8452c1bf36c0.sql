-- RPC function to get aggregated email metrics for dashboard
CREATE OR REPLACE FUNCTION public.get_email_metrics(
  p_period TEXT DEFAULT '24h'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_interval INTERVAL;
  v_result JSONB;
BEGIN
  -- Parse period
  v_interval := CASE p_period
    WHEN '1h' THEN '1 hour'::interval
    WHEN '24h' THEN '24 hours'::interval
    WHEN '7d' THEN '7 days'::interval
    WHEN '30d' THEN '30 days'::interval
    ELSE '24 hours'::interval
  END;
  
  SELECT jsonb_build_object(
    'total_sent', COUNT(*) FILTER (WHERE status = 'sent'),
    'total_failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'total_pending', COUNT(*) FILTER (WHERE status IN ('pending', 'queued', 'sending')),
    'total_cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'avg_attempts', COALESCE(AVG(attempts) FILTER (WHERE status = 'sent'), 0),
    'by_type', COALESCE(
      (SELECT jsonb_object_agg(queue_type, cnt)
       FROM (
         SELECT queue_type, COUNT(*) as cnt
         FROM email_queue
         WHERE created_at > now() - v_interval
         GROUP BY queue_type
       ) t),
      '{}'::jsonb
    ),
    'by_status', COALESCE(
      (SELECT jsonb_object_agg(status, cnt)
       FROM (
         SELECT status, COUNT(*) as cnt
         FROM email_queue
         WHERE created_at > now() - v_interval
         GROUP BY status
       ) t),
      '{}'::jsonb
    ),
    'by_hour', COALESCE(
      (SELECT jsonb_agg(hourly ORDER BY hour)
       FROM (
         SELECT jsonb_build_object(
           'hour', date_trunc('hour', created_at),
           'sent', COUNT(*) FILTER (WHERE status = 'sent'),
           'failed', COUNT(*) FILTER (WHERE status = 'failed'),
           'pending', COUNT(*) FILTER (WHERE status IN ('pending', 'queued'))
         ) as hourly, date_trunc('hour', created_at) as hour
         FROM email_queue
         WHERE created_at > now() - v_interval
         GROUP BY date_trunc('hour', created_at)
       ) t),
      '[]'::jsonb
    ),
    'period', p_period,
    'generated_at', now()
  ) INTO v_result
  FROM email_queue
  WHERE created_at > now() - v_interval;
  
  RETURN v_result;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_email_metrics(TEXT) TO authenticated;