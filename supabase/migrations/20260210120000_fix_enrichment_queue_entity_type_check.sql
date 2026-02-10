-- Fix: Create enrichment_queue table if it doesn't exist.
-- The table was originally created via Supabase Studio (not in migrations),
-- and the auto_queue_enrichment trigger on empresas INSERT depends on it.

CREATE TABLE IF NOT EXISTS public.enrichment_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text DEFAULT 'pending',
  priority integer DEFAULT 5,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error_message text,
  result_data jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Fix check constraint: original only allowed ('portfolio','fund','people','lead')
-- but trigger auto_queue_enrichment inserts 'empresa'. Add it to the allowed values.
ALTER TABLE public.enrichment_queue
  DROP CONSTRAINT IF EXISTS enrichment_queue_entity_type_check;

ALTER TABLE public.enrichment_queue
  ADD CONSTRAINT enrichment_queue_entity_type_check
  CHECK (entity_type IN ('portfolio', 'fund', 'people', 'lead', 'empresa'));

-- Enable RLS (standard for all tables)
ALTER TABLE public.enrichment_queue ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write (adjust as needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'enrichment_queue' AND policyname = 'enrichment_queue_authenticated_all'
  ) THEN
    CREATE POLICY enrichment_queue_authenticated_all ON public.enrichment_queue
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Unique partial index to prevent duplicate pending items (from earlier migration)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_empresa_pending
  ON public.enrichment_queue(entity_id) WHERE entity_type = 'empresa' AND status = 'pending';
