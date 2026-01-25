-- =============================================
-- TEASER CAMPAIGNS SYSTEM - Campañas por Oleadas
-- =============================================

-- 1. Tabla principal de campañas
CREATE TABLE public.teaser_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID NOT NULL REFERENCES mandatos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  idioma TEXT NOT NULL CHECK (idioma IN ('ES', 'EN')),
  teaser_document_id UUID REFERENCES documentos(id),
  
  -- Configuración de envío
  from_email TEXT DEFAULT 'teaser@capittal.es',
  from_name TEXT DEFAULT 'Capittal M&A',
  subject TEXT NOT NULL,
  template_id UUID,
  custom_message TEXT,
  
  -- Estado y métricas
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'paused', 'cancelled')),
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  
  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 2. Tabla de oleadas (waves)
CREATE TABLE public.teaser_waves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES teaser_campaigns(id) ON DELETE CASCADE,
  wave_number INTEGER NOT NULL,
  nombre TEXT,
  
  -- Programación
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Estado y métricas
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sending', 'completed', 'failed', 'paused')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Rate limiting
  batch_size INTEGER DEFAULT 10,
  delay_between_batches_ms INTEGER DEFAULT 1000,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(campaign_id, wave_number)
);

-- 3. Tabla de destinatarios
CREATE TABLE public.teaser_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES teaser_campaigns(id) ON DELETE CASCADE,
  wave_id UUID REFERENCES teaser_waves(id) ON DELETE SET NULL,
  
  -- Destinatario (puede venir de diferentes fuentes)
  contacto_id UUID REFERENCES contactos(id) ON DELETE SET NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  mandato_empresa_id UUID REFERENCES mandato_empresas(id) ON DELETE SET NULL,
  
  -- Datos del destinatario (copiados para histórico)
  email TEXT NOT NULL,
  nombre TEXT,
  empresa_nombre TEXT,
  
  -- Estado de envío
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'skipped')),
  skip_reason TEXT,
  
  -- Tracking de proveedor
  provider_message_id TEXT,
  provider_status TEXT,
  
  -- Timestamps de eventos
  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Contadores
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Detalles de error/bounce
  bounce_type TEXT,
  error_message TEXT,
  
  -- Token único para tracking (URLs en email)
  tracking_id UUID DEFAULT gen_random_uuid() UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de plantillas de email
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  idioma TEXT NOT NULL CHECK (idioma IN ('ES', 'EN')),
  tipo TEXT DEFAULT 'teaser' CHECK (tipo IN ('teaser', 'follow_up', 'reminder', 'custom')),
  
  -- Contenido
  subject_template TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Variables disponibles como JSON array
  variables JSONB DEFAULT '["contact_name", "company", "mandato_nombre", "teaser_link"]'::jsonb,
  
  -- Estado
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla de eventos de tracking (histórico detallado)
CREATE TABLE public.teaser_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES teaser_recipients(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES teaser_campaigns(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  
  -- Metadata del evento
  ip_address INET,
  user_agent TEXT,
  clicked_url TEXT,
  bounce_type TEXT,
  
  -- Timestamp
  occurred_at TIMESTAMPTZ DEFAULT now(),
  
  -- Provider data
  provider_event_id TEXT,
  provider_data JSONB
);

-- =============================================
-- ÍNDICES
-- =============================================

-- Campañas
CREATE INDEX idx_teaser_campaigns_mandato ON teaser_campaigns(mandato_id);
CREATE INDEX idx_teaser_campaigns_status ON teaser_campaigns(status);
CREATE INDEX idx_teaser_campaigns_created ON teaser_campaigns(created_at DESC);

-- Oleadas
CREATE INDEX idx_teaser_waves_campaign ON teaser_waves(campaign_id);
CREATE INDEX idx_teaser_waves_status ON teaser_waves(status);
CREATE INDEX idx_teaser_waves_scheduled ON teaser_waves(scheduled_at) WHERE status = 'scheduled';

-- Destinatarios
CREATE INDEX idx_teaser_recipients_campaign ON teaser_recipients(campaign_id);
CREATE INDEX idx_teaser_recipients_wave ON teaser_recipients(wave_id);
CREATE INDEX idx_teaser_recipients_status ON teaser_recipients(status);
CREATE INDEX idx_teaser_recipients_tracking ON teaser_recipients(tracking_id);
CREATE INDEX idx_teaser_recipients_email ON teaser_recipients(email);
CREATE INDEX idx_teaser_recipients_contacto ON teaser_recipients(contacto_id) WHERE contacto_id IS NOT NULL;

-- Eventos de tracking
CREATE INDEX idx_tracking_events_recipient ON teaser_tracking_events(recipient_id);
CREATE INDEX idx_tracking_events_campaign ON teaser_tracking_events(campaign_id);
CREATE INDEX idx_tracking_events_type ON teaser_tracking_events(event_type);
CREATE INDEX idx_tracking_events_occurred ON teaser_tracking_events(occurred_at DESC);

-- Plantillas
CREATE INDEX idx_email_templates_idioma ON email_templates(idioma);
CREATE INDEX idx_email_templates_tipo ON email_templates(tipo);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para updated_at en campañas
CREATE TRIGGER update_teaser_campaigns_updated_at
  BEFORE UPDATE ON teaser_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en oleadas
CREATE TRIGGER update_teaser_waves_updated_at
  BEFORE UPDATE ON teaser_waves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en destinatarios
CREATE TRIGGER update_teaser_recipients_updated_at
  BEFORE UPDATE ON teaser_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en plantillas
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FUNCIONES AUXILIARES
-- =============================================

-- Función para actualizar métricas de campaña
CREATE OR REPLACE FUNCTION public.update_campaign_metrics(p_campaign_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE teaser_campaigns
  SET 
    total_recipients = (SELECT COUNT(*) FROM teaser_recipients WHERE campaign_id = p_campaign_id),
    total_sent = (SELECT COUNT(*) FROM teaser_recipients WHERE campaign_id = p_campaign_id AND status IN ('sent', 'delivered', 'opened', 'clicked')),
    total_delivered = (SELECT COUNT(*) FROM teaser_recipients WHERE campaign_id = p_campaign_id AND status IN ('delivered', 'opened', 'clicked')),
    total_opened = (SELECT COUNT(*) FROM teaser_recipients WHERE campaign_id = p_campaign_id AND opened_at IS NOT NULL),
    total_clicked = (SELECT COUNT(*) FROM teaser_recipients WHERE campaign_id = p_campaign_id AND clicked_at IS NOT NULL),
    total_bounced = (SELECT COUNT(*) FROM teaser_recipients WHERE campaign_id = p_campaign_id AND status = 'bounced'),
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;

-- Función para actualizar métricas de oleada
CREATE OR REPLACE FUNCTION public.update_wave_metrics(p_wave_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE teaser_waves
  SET 
    total_recipients = (SELECT COUNT(*) FROM teaser_recipients WHERE wave_id = p_wave_id),
    sent_count = (SELECT COUNT(*) FROM teaser_recipients WHERE wave_id = p_wave_id AND status IN ('sent', 'delivered', 'opened', 'clicked')),
    delivered_count = (SELECT COUNT(*) FROM teaser_recipients WHERE wave_id = p_wave_id AND status IN ('delivered', 'opened', 'clicked')),
    opened_count = (SELECT COUNT(*) FROM teaser_recipients WHERE wave_id = p_wave_id AND opened_at IS NOT NULL),
    clicked_count = (SELECT COUNT(*) FROM teaser_recipients WHERE wave_id = p_wave_id AND clicked_at IS NOT NULL),
    failed_count = (SELECT COUNT(*) FROM teaser_recipients WHERE wave_id = p_wave_id AND status IN ('failed', 'bounced')),
    updated_at = now()
  WHERE id = p_wave_id;
END;
$$;

-- Función para registrar evento de tracking
CREATE OR REPLACE FUNCTION public.record_tracking_event(
  p_tracking_id UUID,
  p_event_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_clicked_url TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, recipient_id UUID, campaign_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient teaser_recipients%ROWTYPE;
BEGIN
  -- Buscar destinatario por tracking_id
  SELECT * INTO v_recipient FROM teaser_recipients WHERE tracking_id = p_tracking_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Insertar evento
  INSERT INTO teaser_tracking_events (
    recipient_id, campaign_id, event_type, ip_address, user_agent, clicked_url
  ) VALUES (
    v_recipient.id, v_recipient.campaign_id, p_event_type, p_ip_address, p_user_agent, p_clicked_url
  );
  
  -- Actualizar destinatario según tipo de evento
  IF p_event_type = 'opened' THEN
    UPDATE teaser_recipients
    SET 
      opened_at = COALESCE(opened_at, now()),
      open_count = open_count + 1,
      status = CASE WHEN status NOT IN ('clicked') THEN 'opened' ELSE status END
    WHERE id = v_recipient.id;
  ELSIF p_event_type = 'clicked' THEN
    UPDATE teaser_recipients
    SET 
      clicked_at = COALESCE(clicked_at, now()),
      click_count = click_count + 1,
      status = 'clicked'
    WHERE id = v_recipient.id;
  END IF;
  
  -- Actualizar métricas
  PERFORM update_wave_metrics(v_recipient.wave_id);
  PERFORM update_campaign_metrics(v_recipient.campaign_id);
  
  RETURN QUERY SELECT true, v_recipient.id, v_recipient.campaign_id;
END;
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Habilitar RLS
ALTER TABLE teaser_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaser_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaser_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaser_tracking_events ENABLE ROW LEVEL SECURITY;

-- Políticas para campañas (solo admin)
CREATE POLICY "Admin can manage teaser campaigns"
ON teaser_campaigns FOR ALL
USING (public.current_user_can_write());

CREATE POLICY "Admin can view teaser campaigns"
ON teaser_campaigns FOR SELECT
USING (public.current_user_can_read());

-- Políticas para oleadas (solo admin)
CREATE POLICY "Admin can manage teaser waves"
ON teaser_waves FOR ALL
USING (public.current_user_can_write());

CREATE POLICY "Admin can view teaser waves"
ON teaser_waves FOR SELECT
USING (public.current_user_can_read());

-- Políticas para destinatarios (admin + tracking público)
CREATE POLICY "Admin can manage teaser recipients"
ON teaser_recipients FOR ALL
USING (public.current_user_can_write());

CREATE POLICY "Admin can view teaser recipients"
ON teaser_recipients FOR SELECT
USING (public.current_user_can_read());

-- Políticas para plantillas (solo admin)
CREATE POLICY "Admin can manage email templates"
ON email_templates FOR ALL
USING (public.current_user_can_write());

CREATE POLICY "Admin can view email templates"
ON email_templates FOR SELECT
USING (public.current_user_can_read());

-- Políticas para eventos de tracking (solo admin lectura)
CREATE POLICY "Admin can view tracking events"
ON teaser_tracking_events FOR SELECT
USING (public.current_user_can_read());

CREATE POLICY "System can insert tracking events"
ON teaser_tracking_events FOR INSERT
WITH CHECK (true);

-- =============================================
-- PLANTILLAS POR DEFECTO
-- =============================================

-- Plantilla ES por defecto
INSERT INTO email_templates (nombre, idioma, tipo, subject_template, html_content, text_content, is_default, is_active)
VALUES (
  'Teaser M&A - Español',
  'ES',
  'teaser',
  'Oportunidad de inversión: {{mandato_nombre}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oportunidad de inversión</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://crm-capittal.lovable.app/lovable-uploads/c94f7e65-38d5-4f86-88d1-5126edbe14a2.png" alt="Capittal" style="max-width: 180px;">
  </div>
  
  <p>Estimado/a {{contact_name}},</p>
  
  <p>Desde <strong>Capittal M&A</strong> le hacemos llegar información sobre una oportunidad de inversión que podría ser de su interés.</p>
  
  <p>Adjunto encontrará el teaser ejecutivo con los principales datos de la operación. Este documento es estrictamente confidencial y está destinado únicamente para su evaluación.</p>
  
  {{custom_message}}
  
  <p>Si desea ampliar información o manifestar su interés, no dude en ponerse en contacto con nosotros.</p>
  
  <p style="margin-top: 30px;">
    Atentamente,<br>
    <strong>Equipo Capittal M&A</strong>
  </p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #666;">
    Este mensaje y sus adjuntos son confidenciales y están destinados exclusivamente a su destinatario. 
    Si ha recibido este email por error, por favor notifíquenoslo y elimínelo de su sistema.
  </p>
  
  <p style="font-size: 11px; color: #999; text-align: center;">
    Capittal M&A | Madrid, España<br>
    <a href="https://capittal.es" style="color: #666;">www.capittal.es</a>
  </p>
</body>
</html>',
  'Estimado/a {{contact_name}},

Desde Capittal M&A le hacemos llegar información sobre una oportunidad de inversión que podría ser de su interés.

Adjunto encontrará el teaser ejecutivo con los principales datos de la operación. Este documento es estrictamente confidencial y está destinado únicamente para su evaluación.

{{custom_message}}

Si desea ampliar información o manifestar su interés, no dude en ponerse en contacto con nosotros.

Atentamente,
Equipo Capittal M&A

---
Capittal M&A | Madrid, España
www.capittal.es',
  true,
  true
);

-- Plantilla EN por defecto
INSERT INTO email_templates (nombre, idioma, tipo, subject_template, html_content, text_content, is_default, is_active)
VALUES (
  'Teaser M&A - English',
  'EN',
  'teaser',
  'Investment Opportunity: {{mandato_nombre}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investment Opportunity</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://crm-capittal.lovable.app/lovable-uploads/c94f7e65-38d5-4f86-88d1-5126edbe14a2.png" alt="Capittal" style="max-width: 180px;">
  </div>
  
  <p>Dear {{contact_name}},</p>
  
  <p>On behalf of <strong>Capittal M&A</strong>, we are pleased to share with you information about an investment opportunity that may be of interest to you.</p>
  
  <p>Please find attached the executive teaser with the main details of the transaction. This document is strictly confidential and intended solely for your evaluation.</p>
  
  {{custom_message}}
  
  <p>Should you wish to receive additional information or express your interest, please do not hesitate to contact us.</p>
  
  <p style="margin-top: 30px;">
    Best regards,<br>
    <strong>Capittal M&A Team</strong>
  </p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #666;">
    This message and its attachments are confidential and intended solely for the addressee. 
    If you have received this email in error, please notify us and delete it from your system.
  </p>
  
  <p style="font-size: 11px; color: #999; text-align: center;">
    Capittal M&A | Madrid, Spain<br>
    <a href="https://capittal.es" style="color: #666;">www.capittal.es</a>
  </p>
</body>
</html>',
  'Dear {{contact_name}},

On behalf of Capittal M&A, we are pleased to share with you information about an investment opportunity that may be of interest to you.

Please find attached the executive teaser with the main details of the transaction. This document is strictly confidential and intended solely for your evaluation.

{{custom_message}}

Should you wish to receive additional information or express your interest, please do not hesitate to contact us.

Best regards,
Capittal M&A Team

---
Capittal M&A | Madrid, Spain
www.capittal.es',
  true,
  true
);