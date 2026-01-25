-- =============================================
-- EMAIL QUEUE - Cola unificada de envíos
-- =============================================

-- Tabla principal de cola de emails
CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contexto
  queue_type TEXT NOT NULL CHECK (queue_type IN ('teaser', 'transactional', 'notification', 'digest', 'test')),
  reference_id UUID,
  reference_type TEXT,
  
  -- Destinatario
  to_email TEXT NOT NULL,
  to_name TEXT,
  
  -- Remitente
  from_email TEXT DEFAULT 'noreply@capittal.es',
  from_name TEXT DEFAULT 'Capittal M&A',
  reply_to TEXT,
  
  -- Contenido
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Adjuntos (array de {filename, content_base64, content_type})
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sending', 'sent', 'failed', 'bounced', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- Programación
  scheduled_at TIMESTAMPTZ,
  
  -- Reintentos
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Proveedor
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  provider_status TEXT,
  provider_response JSONB,
  
  -- Errores
  last_error TEXT,
  error_details JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  queued_at TIMESTAMPTZ,
  first_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Usuario que creó el email (opcional)
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para rendimiento
CREATE INDEX idx_email_queue_status_pending ON email_queue(status, priority, created_at) 
  WHERE status IN ('pending', 'queued');

CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_at) 
  WHERE status = 'pending' AND scheduled_at IS NOT NULL;

CREATE INDEX idx_email_queue_retry ON email_queue(next_retry_at) 
  WHERE status = 'failed' AND attempts < max_attempts;

CREATE INDEX idx_email_queue_reference ON email_queue(reference_type, reference_id);

CREATE INDEX idx_email_queue_to_email ON email_queue(to_email);

CREATE INDEX idx_email_queue_created_at ON email_queue(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all emails" ON email_queue
  FOR SELECT USING (current_user_can_read());

CREATE POLICY "Admin users can insert emails" ON email_queue
  FOR INSERT WITH CHECK (current_user_can_write());

CREATE POLICY "Admin users can update emails" ON email_queue
  FOR UPDATE USING (current_user_can_write());

-- Función para calcular next_retry_at con backoff exponencial
CREATE OR REPLACE FUNCTION calculate_email_retry_at(attempts INTEGER)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  delays INTEGER[] := ARRAY[60, 300, 1800]; -- 1min, 5min, 30min
  delay_seconds INTEGER;
BEGIN
  delay_seconds := delays[LEAST(attempts + 1, array_length(delays, 1))];
  RETURN now() + (delay_seconds || ' seconds')::interval;
END;
$$;

-- Función para encolar un email
CREATE OR REPLACE FUNCTION enqueue_email(
  p_to_email TEXT,
  p_subject TEXT,
  p_html_content TEXT,
  p_queue_type TEXT DEFAULT 'transactional',
  p_from_email TEXT DEFAULT 'noreply@capittal.es',
  p_from_name TEXT DEFAULT 'Capittal M&A',
  p_to_name TEXT DEFAULT NULL,
  p_text_content TEXT DEFAULT NULL,
  p_attachments JSONB DEFAULT '[]'::jsonb,
  p_priority INTEGER DEFAULT 5,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_id UUID;
BEGIN
  INSERT INTO email_queue (
    to_email, to_name, subject, html_content, text_content,
    queue_type, from_email, from_name, attachments,
    priority, scheduled_at, reference_id, reference_type, metadata
  ) VALUES (
    p_to_email, p_to_name, p_subject, p_html_content, p_text_content,
    p_queue_type, p_from_email, p_from_name, p_attachments,
    p_priority, COALESCE(p_scheduled_at, now()), p_reference_id, p_reference_type, p_metadata
  )
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$;

-- Vista para métricas de cola
CREATE OR REPLACE VIEW v_email_queue_stats AS
SELECT
  queue_type,
  status,
  COUNT(*) as count,
  AVG(attempts) as avg_attempts,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
WHERE created_at > now() - interval '24 hours'
GROUP BY queue_type, status
ORDER BY queue_type, status;

-- Comentarios
COMMENT ON TABLE email_queue IS 'Cola unificada de emails con soporte para reintentos y rate limiting';
COMMENT ON COLUMN email_queue.priority IS '1=urgente, 10=bajo prioridad';
COMMENT ON COLUMN email_queue.queue_type IS 'Tipo: teaser, transactional, notification, digest, test';
COMMENT ON COLUMN email_queue.provider_response IS 'Respuesta completa del proveedor de email';