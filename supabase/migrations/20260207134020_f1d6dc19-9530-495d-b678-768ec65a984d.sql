
-- Add auto-queue trigger for new empresas
CREATE OR REPLACE FUNCTION public.auto_queue_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if the empresa has no enrichment data yet
  IF NEW.fecha_enriquecimiento IS NULL THEN
    INSERT INTO public.enrichment_queue (entity_type, entity_id, priority, status)
    VALUES ('empresa', NEW.id, 3, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_queue_enrichment' AND tgrelid = 'public.empresas'::regclass) THEN
    CREATE TRIGGER trg_auto_queue_enrichment
      AFTER INSERT ON public.empresas
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_queue_enrichment();
  END IF;
END $$;

-- Add unique partial index to prevent duplicate pending items
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_empresa_pending 
  ON public.enrichment_queue(entity_id) WHERE entity_type = 'empresa' AND status = 'pending';
