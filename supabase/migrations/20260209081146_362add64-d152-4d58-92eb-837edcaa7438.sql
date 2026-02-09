
-- Tabla para tracking de acuerdos de confidencialidad
CREATE TABLE public.user_confidentiality_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  agreement_version integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, agreement_version)
);

-- RLS
ALTER TABLE public.user_confidentiality_agreements ENABLE ROW LEVEL SECURITY;

-- Users can read their own agreements
CREATE POLICY "Users can read own agreements"
  ON public.user_confidentiality_agreements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own agreement
CREATE POLICY "Users can accept agreement"
  ON public.user_confidentiality_agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all (for audit)
CREATE POLICY "Admins can read all agreements"
  ON public.user_confidentiality_agreements
  FOR SELECT
  TO authenticated
  USING (public.current_user_can_read());

-- Index
CREATE INDEX idx_user_confidentiality_user ON public.user_confidentiality_agreements(user_id);

-- Helper function to check if current user has accepted the latest agreement
CREATE OR REPLACE FUNCTION public.has_accepted_confidentiality(version_required integer DEFAULT 1)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_confidentiality_agreements
    WHERE user_id = auth.uid()
      AND agreement_version >= version_required
  );
$$;
