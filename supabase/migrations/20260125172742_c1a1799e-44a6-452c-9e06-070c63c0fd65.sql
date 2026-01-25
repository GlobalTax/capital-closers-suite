-- ============================================
-- NDA POST-TEASER WORKFLOW
-- Flujo: Teaser → Engagement → NDA → Firma → CIM
-- ============================================

-- Campos NDA en teaser_recipients
ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS nda_status TEXT DEFAULT 'not_required' 
  CHECK (nda_status IN ('not_required', 'pending', 'sent', 'signed', 'expired', 'rejected'));

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS nda_sent_at TIMESTAMPTZ;

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS nda_signed_at TIMESTAMPTZ;

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS nda_language TEXT CHECK (nda_language IN ('ES', 'EN'));

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS nda_document_id UUID REFERENCES public.documentos(id);

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS nda_sent_by UUID;

-- Control de acceso CIM
ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS cim_access_granted BOOLEAN DEFAULT false;

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS cim_access_granted_at TIMESTAMPTZ;

ALTER TABLE public.teaser_recipients 
ADD COLUMN IF NOT EXISTS cim_access_granted_by UUID;

-- Índice para queries rápidos de NDA pendientes
CREATE INDEX IF NOT EXISTS idx_teaser_recipients_nda_status 
ON public.teaser_recipients(nda_status) 
WHERE nda_status IN ('pending', 'sent');

-- Tabla de eventos de tracking NDA
CREATE TABLE IF NOT EXISTS public.nda_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.teaser_recipients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'engagement_detected', 'nda_suggested', 'nda_sent', 
    'nda_opened', 'nda_signed', 'nda_expired', 
    'cim_access_granted', 'cim_accessed', 'nda_rejected',
    'manual_override'
  )),
  performed_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para nda_tracking_events
ALTER TABLE public.nda_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view NDA events"
ON public.nda_tracking_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admin users can insert NDA events"
ON public.nda_tracking_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- Índice para búsquedas por recipient
CREATE INDEX IF NOT EXISTS idx_nda_tracking_events_recipient 
ON public.nda_tracking_events(recipient_id, created_at DESC);

-- Función helper para verificar elegibilidad NDA
CREATE OR REPLACE FUNCTION public.is_nda_eligible(p_recipient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teaser_recipients
    WHERE id = p_recipient_id
    AND sent_at IS NOT NULL
    AND (
      opened_at IS NOT NULL OR 
      clicked_at IS NOT NULL OR 
      status = 'responded'
    )
  )
$$;

-- Trigger para sugerir NDA automáticamente cuando hay engagement
CREATE OR REPLACE FUNCTION public.suggest_nda_on_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si es primer open o click, sugerir NDA
  IF (NEW.opened_at IS NOT NULL AND OLD.opened_at IS NULL) OR
     (NEW.clicked_at IS NOT NULL AND OLD.clicked_at IS NULL) THEN
    
    -- Solo si NDA no requerido aún
    IF NEW.nda_status = 'not_required' THEN
      -- Actualizar a pending (sugerencia)
      NEW.nda_status := 'pending';
      
      -- Registrar evento
      INSERT INTO nda_tracking_events (recipient_id, event_type, metadata)
      VALUES (NEW.id, 'engagement_detected', jsonb_build_object(
        'trigger', CASE 
          WHEN NEW.opened_at IS NOT NULL AND OLD.opened_at IS NULL THEN 'email_opened'
          ELSE 'link_clicked'
        END,
        'timestamp', now()
      ));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_suggest_nda_on_engagement ON public.teaser_recipients;
CREATE TRIGGER trigger_suggest_nda_on_engagement
  BEFORE UPDATE ON public.teaser_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.suggest_nda_on_engagement();

-- Función para verificar acceso CIM
CREATE OR REPLACE FUNCTION public.can_access_cim(p_recipient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teaser_recipients
    WHERE id = p_recipient_id
    AND (nda_status = 'signed' OR cim_access_granted = true)
  )
$$;