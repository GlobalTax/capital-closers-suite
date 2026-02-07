-- Add AI fields to company_meetings
ALTER TABLE public.company_meetings
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_action_items jsonb,
  ADD COLUMN IF NOT EXISTS ai_key_quotes text[],
  ADD COLUMN IF NOT EXISTS ai_processed_at timestamptz;