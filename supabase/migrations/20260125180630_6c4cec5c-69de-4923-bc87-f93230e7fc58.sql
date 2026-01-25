-- Add CIM first access tracking (denormalized for fast queries)
ALTER TABLE teaser_recipients 
ADD COLUMN IF NOT EXISTS cim_first_accessed_at TIMESTAMPTZ;

-- Add IOI tracking fields
ALTER TABLE teaser_recipients 
ADD COLUMN IF NOT EXISTS ioi_received_at TIMESTAMPTZ;

ALTER TABLE teaser_recipients 
ADD COLUMN IF NOT EXISTS ioi_amount NUMERIC;

ALTER TABLE teaser_recipients 
ADD COLUMN IF NOT EXISTS ioi_notes TEXT;

-- Index for funnel queries
CREATE INDEX IF NOT EXISTS idx_teaser_recipients_funnel 
ON teaser_recipients(campaign_id, sent_at, opened_at, nda_status, cim_first_accessed_at, ioi_received_at);

-- Trigger to sync cim_accessed events to recipient
CREATE OR REPLACE FUNCTION sync_cim_accessed_to_recipient()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'cim_accessed' THEN
    UPDATE teaser_recipients
    SET cim_first_accessed_at = COALESCE(cim_first_accessed_at, NEW.created_at)
    WHERE id = NEW.recipient_id
      AND cim_first_accessed_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_cim_accessed ON nda_tracking_events;
CREATE TRIGGER trg_sync_cim_accessed
AFTER INSERT ON nda_tracking_events
FOR EACH ROW
WHEN (NEW.event_type = 'cim_accessed')
EXECUTE FUNCTION sync_cim_accessed_to_recipient();

-- View for aggregated funnel stats per campaign
CREATE OR REPLACE VIEW vw_campaign_funnel_stats AS
SELECT 
  campaign_id,
  COUNT(*) AS total_recipients,
  COUNT(*) FILTER (WHERE sent_at IS NOT NULL) AS teaser_sent,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS teaser_opened,
  COUNT(*) FILTER (WHERE nda_status IN ('sent', 'signed')) AS nda_sent,
  COUNT(*) FILTER (WHERE nda_status = 'signed') AS nda_signed,
  COUNT(*) FILTER (WHERE cim_first_accessed_at IS NOT NULL) AS cim_opened,
  COUNT(*) FILTER (WHERE ioi_received_at IS NOT NULL) AS ioi_received,
  -- Conversion rates
  CASE WHEN COUNT(*) FILTER (WHERE sent_at IS NOT NULL) > 0 
    THEN ROUND(COUNT(*) FILTER (WHERE opened_at IS NOT NULL)::NUMERIC / 
         COUNT(*) FILTER (WHERE sent_at IS NOT NULL) * 100, 1)
    ELSE 0 
  END AS open_rate,
  CASE WHEN COUNT(*) FILTER (WHERE opened_at IS NOT NULL) > 0 
    THEN ROUND(COUNT(*) FILTER (WHERE nda_status = 'signed')::NUMERIC / 
         COUNT(*) FILTER (WHERE opened_at IS NOT NULL) * 100, 1)
    ELSE 0 
  END AS nda_conversion,
  CASE WHEN COUNT(*) FILTER (WHERE nda_status = 'signed') > 0 
    THEN ROUND(COUNT(*) FILTER (WHERE cim_first_accessed_at IS NOT NULL)::NUMERIC / 
         COUNT(*) FILTER (WHERE nda_status = 'signed') * 100, 1)
    ELSE 0 
  END AS cim_conversion,
  CASE WHEN COUNT(*) FILTER (WHERE cim_first_accessed_at IS NOT NULL) > 0 
    THEN ROUND(COUNT(*) FILTER (WHERE ioi_received_at IS NOT NULL)::NUMERIC / 
         COUNT(*) FILTER (WHERE cim_first_accessed_at IS NOT NULL) * 100, 1)
    ELSE 0 
  END AS ioi_conversion
FROM teaser_recipients
GROUP BY campaign_id;