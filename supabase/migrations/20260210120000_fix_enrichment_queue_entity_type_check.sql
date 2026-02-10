-- Fix: enrichment_queue_entity_type_check constraint blocks 'empresa' value
-- which is used by the auto_queue_enrichment trigger on empresas INSERT.
-- Drop the overly restrictive constraint and recreate it with 'empresa' included.

ALTER TABLE public.enrichment_queue
  DROP CONSTRAINT IF EXISTS enrichment_queue_entity_type_check;

ALTER TABLE public.enrichment_queue
  ADD CONSTRAINT enrichment_queue_entity_type_check
  CHECK (entity_type IN ('empresa', 'contacto', 'mandato'));
