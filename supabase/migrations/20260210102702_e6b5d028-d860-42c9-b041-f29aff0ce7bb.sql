
-- Fix enrichment_queue constraint to include 'empresa'
ALTER TABLE public.enrichment_queue
  DROP CONSTRAINT IF EXISTS enrichment_queue_entity_type_check;

ALTER TABLE public.enrichment_queue
  ADD CONSTRAINT enrichment_queue_entity_type_check
  CHECK (entity_type IN ('portfolio', 'fund', 'people', 'lead', 'empresa'));

-- Clean dirty data: empty CIF strings to NULL
UPDATE public.empresas SET cif = NULL WHERE cif = '';
