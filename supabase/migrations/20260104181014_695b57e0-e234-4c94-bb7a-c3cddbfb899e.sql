-- =====================================================
-- BREVO BIDIRECTIONAL SYNC SYSTEM
-- =====================================================

-- 1. Create brevo_sync_queue table for async processing
CREATE TABLE IF NOT EXISTS public.brevo_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  priority integer DEFAULT 5,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  error_message text,
  payload jsonb,
  created_at timestamptz DEFAULT NOW(),
  processed_at timestamptz,
  next_retry_at timestamptz
);

-- Indices for queue processing
CREATE INDEX IF NOT EXISTS idx_brevo_sync_queue_status ON public.brevo_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_brevo_sync_queue_priority ON public.brevo_sync_queue(priority, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_brevo_sync_queue_entity ON public.brevo_sync_queue(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_brevo_sync_queue_next_retry ON public.brevo_sync_queue(next_retry_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.brevo_sync_queue ENABLE ROW LEVEL SECURITY;

-- Policy for admin users
CREATE POLICY "Admin users can manage brevo_sync_queue"
ON public.brevo_sync_queue
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- 2. Add brevo_last_modified_at columns for incremental sync
ALTER TABLE public.contactos ADD COLUMN IF NOT EXISTS brevo_last_modified_at timestamptz;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS brevo_last_modified_at timestamptz;

-- 3. Create trigger function for contactos
CREATE OR REPLACE FUNCTION public.queue_contacto_to_brevo()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if has valid email
  IF NEW.email IS NOT NULL AND NEW.email ~ '^[^@]+@[^@]+\.[^@]+$' THEN
    -- Check if there's already a pending item for this entity
    IF NOT EXISTS (
      SELECT 1 FROM public.brevo_sync_queue 
      WHERE entity_type = 'contact' 
      AND entity_id = NEW.id 
      AND status = 'pending'
    ) THEN
      INSERT INTO public.brevo_sync_queue (entity_type, entity_id, action, payload)
      VALUES (
        'contact', 
        NEW.id, 
        TG_OP,
        jsonb_build_object(
          'email', NEW.email,
          'nombre', NEW.nombre,
          'apellidos', NEW.apellidos,
          'cargo', NEW.cargo,
          'linkedin_url', NEW.linkedin_url,
          'empresa_id', NEW.empresa_id
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create trigger function for empresas
CREATE OR REPLACE FUNCTION public.queue_empresa_to_brevo()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's already a pending item for this entity
  IF NOT EXISTS (
    SELECT 1 FROM public.brevo_sync_queue 
    WHERE entity_type = 'company' 
    AND entity_id = NEW.id 
    AND status = 'pending'
  ) THEN
    INSERT INTO public.brevo_sync_queue (entity_type, entity_id, action, payload)
    VALUES (
      'company', 
      NEW.id, 
      TG_OP,
      jsonb_build_object(
        'nombre', NEW.nombre,
        'sector', NEW.sector,
        'website', NEW.website,
        'ciudad', NEW.ciudad,
        'pais', NEW.pais
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create trigger function for mandatos (as deals)
CREATE OR REPLACE FUNCTION public.queue_mandato_to_brevo()
RETURNS TRIGGER AS $$
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
        'nombre', NEW.nombre,
        'tipo', NEW.tipo,
        'estado', NEW.estado,
        'pipeline_stage', NEW.pipeline_stage,
        'valor_estimado', NEW.valor_estimado
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create the triggers (drop first if exist)
DROP TRIGGER IF EXISTS after_contacto_change_brevo ON public.contactos;
CREATE TRIGGER after_contacto_change_brevo
  AFTER INSERT OR UPDATE ON public.contactos
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_contacto_to_brevo();

DROP TRIGGER IF EXISTS after_empresa_change_brevo ON public.empresas;
CREATE TRIGGER after_empresa_change_brevo
  AFTER INSERT OR UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_empresa_to_brevo();

DROP TRIGGER IF EXISTS after_mandato_change_brevo ON public.mandatos;
CREATE TRIGGER after_mandato_change_brevo
  AFTER INSERT OR UPDATE ON public.mandatos
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_mandato_to_brevo();

-- 7. Create view for sync status dashboard
CREATE OR REPLACE VIEW public.v_brevo_sync_status AS
SELECT 
  'contactos' as entity_type,
  COUNT(*) as total,
  COUNT(brevo_id) as synced,
  COUNT(*) - COUNT(brevo_id) as pending_sync
FROM public.contactos
UNION ALL
SELECT 
  'empresas' as entity_type,
  COUNT(*) as total,
  COUNT(brevo_id) as synced,
  COUNT(*) - COUNT(brevo_id) as pending_sync
FROM public.empresas
UNION ALL
SELECT 
  'mandatos' as entity_type,
  COUNT(*) as total,
  COUNT(brevo_deal_id) as synced,
  COUNT(*) - COUNT(brevo_deal_id) as pending_sync
FROM public.mandatos;

-- 8. Create function to get queue stats
CREATE OR REPLACE FUNCTION public.get_brevo_queue_stats()
RETURNS TABLE (
  status text,
  entity_type text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bsq.status,
    bsq.entity_type,
    COUNT(*)::bigint
  FROM public.brevo_sync_queue bsq
  GROUP BY bsq.status, bsq.entity_type
  ORDER BY bsq.status, bsq.entity_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Create function to retry failed items
CREATE OR REPLACE FUNCTION public.retry_failed_brevo_sync(p_entity_type text DEFAULT NULL)
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.brevo_sync_queue
  SET 
    status = 'pending',
    attempts = 0,
    error_message = NULL,
    next_retry_at = NULL
  WHERE status = 'failed'
    AND (p_entity_type IS NULL OR entity_type = p_entity_type);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Create function to clean old completed items (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_brevo_sync_queue()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.brevo_sync_queue
  WHERE status IN ('completed', 'skipped')
    AND processed_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;