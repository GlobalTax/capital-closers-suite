
-- Create mandato_scoring_history table
CREATE TABLE public.mandato_scoring_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mandato_id UUID NOT NULL REFERENCES public.mandatos(id) ON DELETE CASCADE,
  previous_probability INTEGER,
  new_probability INTEGER NOT NULL,
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  reasoning TEXT,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  positive_signals JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  signals_snapshot JSONB DEFAULT '{}'::jsonb,
  scored_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by mandato
CREATE INDEX idx_mandato_scoring_history_mandato ON public.mandato_scoring_history(mandato_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.mandato_scoring_history ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users with CRM access
CREATE POLICY "Authenticated users can read scoring history"
  ON public.mandato_scoring_history
  FOR SELECT
  USING (current_user_can_read());

-- Insert only via service role (no insert policy for regular users)
