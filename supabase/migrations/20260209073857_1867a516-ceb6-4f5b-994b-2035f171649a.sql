
-- Nuevas columnas en buyer_matches para tracking de hitos
ALTER TABLE buyer_matches
  ADD COLUMN IF NOT EXISTS contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS teaser_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS nda_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz;

-- Tabla buyer_outreach
CREATE TABLE public.buyer_outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES buyer_matches(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES corporate_buyers(id),
  mandato_id uuid NOT NULL REFERENCES mandatos(id),
  channel text NOT NULL DEFAULT 'email',
  outreach_type text NOT NULL DEFAULT 'contacto',
  subject text,
  message_preview text,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.buyer_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read buyer_outreach"
  ON public.buyer_outreach FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated insert buyer_outreach"
  ON public.buyer_outreach FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update buyer_outreach"
  ON public.buyer_outreach FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated delete buyer_outreach"
  ON public.buyer_outreach FOR DELETE
  TO authenticated
  USING (true);

-- Indices
CREATE INDEX idx_buyer_outreach_match ON public.buyer_outreach(match_id);
CREATE INDEX idx_buyer_outreach_buyer ON public.buyer_outreach(buyer_id);
CREATE INDEX idx_buyer_outreach_mandato ON public.buyer_outreach(mandato_id);

-- Trigger: al insertar outreach, actualizar hitos en buyer_matches
CREATE OR REPLACE FUNCTION public.update_buyer_match_milestones()
RETURNS TRIGGER AS $$
BEGIN
  -- Siempre actualizar last_interaction_at
  UPDATE buyer_matches
    SET last_interaction_at = COALESCE(NEW.sent_at, NEW.created_at)
    WHERE id = NEW.match_id;

  -- Actualizar hito específico solo si es la primera vez
  IF NEW.outreach_type = 'contacto' THEN
    UPDATE buyer_matches
      SET contacted_at = COALESCE(NEW.sent_at, NEW.created_at)
      WHERE id = NEW.match_id AND contacted_at IS NULL;
  ELSIF NEW.outreach_type = 'teaser' THEN
    UPDATE buyer_matches
      SET teaser_sent_at = COALESCE(NEW.sent_at, NEW.created_at)
      WHERE id = NEW.match_id AND teaser_sent_at IS NULL;
  ELSIF NEW.outreach_type = 'nda' THEN
    UPDATE buyer_matches
      SET nda_sent_at = COALESCE(NEW.sent_at, NEW.created_at)
      WHERE id = NEW.match_id AND nda_sent_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_buyer_outreach_milestones
  AFTER INSERT ON public.buyer_outreach
  FOR EACH ROW
  EXECUTE FUNCTION public.update_buyer_match_milestones();
