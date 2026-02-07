
-- ============================================
-- FASE 0: Infraestructura Transversal IA
-- ============================================

-- 0.1 Campos IA en empresas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS ai_enriched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_enrichment_source TEXT,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS ai_fields_locked TEXT[] DEFAULT '{}';

-- 0.2 Campos IA en company_meetings
ALTER TABLE public.company_meetings
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_action_items JSONB,
  ADD COLUMN IF NOT EXISTS ai_key_quotes JSONB,
  ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;

-- 0.3 Campos scoring en contactos
ALTER TABLE public.contactos
  ADD COLUMN IF NOT EXISTS relationship_score INTEGER,
  ADD COLUMN IF NOT EXISTS relationship_tier TEXT,
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

-- 0.4 Tabla ai_activity_log
CREATE TABLE IF NOT EXISTS public.ai_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd NUMERIC(10,6),
  entity_type TEXT,
  entity_id UUID,
  user_id UUID,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_activity_log_module ON public.ai_activity_log(module);
CREATE INDEX IF NOT EXISTS idx_ai_activity_log_created_at ON public.ai_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_activity_log_entity ON public.ai_activity_log(entity_type, entity_id);

ALTER TABLE public.ai_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read ai_activity_log"
  ON public.ai_activity_log FOR SELECT
  USING (current_user_can_read());

CREATE POLICY "Admin users can insert ai_activity_log"
  ON public.ai_activity_log FOR INSERT
  WITH CHECK (current_user_can_write());

-- Constraints en contactos
ALTER TABLE public.contactos
  ADD CONSTRAINT chk_relationship_tier 
  CHECK (relationship_tier IS NULL OR relationship_tier IN ('A', 'B', 'C'));

ALTER TABLE public.contactos
  ADD CONSTRAINT chk_relationship_score
  CHECK (relationship_score IS NULL OR (relationship_score >= 0 AND relationship_score <= 100));

COMMENT ON TABLE public.ai_activity_log IS 'Tracking de llamadas a modelos IA para auditoría y control de costos';
COMMENT ON COLUMN public.empresas.ai_fields_locked IS 'Campos editados manualmente que la IA no debe sobreescribir';
COMMENT ON COLUMN public.contactos.relationship_tier IS 'Tier: A (75-100), B (40-74), C (0-39)';
