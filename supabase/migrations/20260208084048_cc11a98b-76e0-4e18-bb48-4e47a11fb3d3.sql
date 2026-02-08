
-- Table for buyer matching results
CREATE TABLE public.buyer_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id uuid NOT NULL REFERENCES public.mandatos(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.corporate_buyers(id) ON DELETE CASCADE,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasoning text,
  fit_dimensions jsonb DEFAULT '{}',
  risk_factors text[] DEFAULT '{}',
  recommended_approach text,
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'contacted', 'dismissed', 'converted')),
  dismissed_reason text,
  generated_at timestamptz DEFAULT now(),
  generated_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_buyer_matches_mandato ON public.buyer_matches(mandato_id);
CREATE INDEX idx_buyer_matches_buyer ON public.buyer_matches(buyer_id);
CREATE INDEX idx_buyer_matches_score ON public.buyer_matches(match_score DESC);
CREATE UNIQUE INDEX idx_buyer_matches_unique ON public.buyer_matches(mandato_id, buyer_id);

-- Enable RLS
ALTER TABLE public.buyer_matches ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated admin users
CREATE POLICY "Authenticated admins can read buyer_matches"
  ON public.buyer_matches FOR SELECT
  TO authenticated
  USING (public.current_user_can_read());

-- Write access for admin users  
CREATE POLICY "Admins can insert buyer_matches"
  ON public.buyer_matches FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_can_write());

CREATE POLICY "Admins can update buyer_matches"
  ON public.buyer_matches FOR UPDATE
  TO authenticated
  USING (public.current_user_can_write());

CREATE POLICY "Admins can delete buyer_matches"
  ON public.buyer_matches FOR DELETE
  TO authenticated
  USING (public.current_user_can_write());

-- Service role bypass for edge functions
CREATE POLICY "Service role full access buyer_matches"
  ON public.buyer_matches FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
