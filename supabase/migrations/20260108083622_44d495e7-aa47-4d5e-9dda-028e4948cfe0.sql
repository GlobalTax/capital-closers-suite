-- Fix queue_mandato_to_brevo to use correct mandatos column names
CREATE OR REPLACE FUNCTION public.queue_mandato_to_brevo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if there's already a pending item for this entity
  IF NOT EXISTS (
    SELECT 1 FROM public.brevo_sync_queue 
    WHERE entity_type = 'deal' 
    AND entity_id = NEW.id 
    AND status = 'pending'
  ) THEN
    INSERT INTO public.brevo_sync_queue (entity_type, entity_id, action, priority, payload)
    VALUES (
      'deal', 
      NEW.id, 
      TG_OP,
      3, -- Higher priority for deals
      jsonb_build_object(
        'tipo', NEW.tipo,
        'estado', NEW.estado,
        'pipeline_stage', NEW.pipeline_stage,
        'valor', NEW.valor,
        'descripcion', NEW.descripcion,
        'empresa_principal_id', NEW.empresa_principal_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;