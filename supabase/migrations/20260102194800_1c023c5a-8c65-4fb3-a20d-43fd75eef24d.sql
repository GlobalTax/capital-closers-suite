-- Add Brevo deal tracking columns to mandatos
ALTER TABLE mandatos 
ADD COLUMN IF NOT EXISTS brevo_deal_id text UNIQUE,
ADD COLUMN IF NOT EXISTS brevo_synced_at timestamptz;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mandatos_brevo_deal_id 
ON mandatos(brevo_deal_id) WHERE brevo_deal_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN mandatos.brevo_deal_id IS 'Unique deal ID from Brevo CRM for sync tracking';
COMMENT ON COLUMN mandatos.brevo_synced_at IS 'Last sync timestamp from Brevo';