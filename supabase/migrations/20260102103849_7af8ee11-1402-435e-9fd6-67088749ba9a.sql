-- Tabla para registrar accesos/descargas de documentos
CREATE TABLE IF NOT EXISTS document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL,
  documento_nombre TEXT,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  user_email TEXT,
  access_type TEXT NOT NULL DEFAULT 'download' CHECK (access_type IN ('download', 'preview', 'share')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_access_logs_documento ON document_access_logs(documento_id);
CREATE INDEX idx_access_logs_user ON document_access_logs(user_id);
CREATE INDEX idx_access_logs_date ON document_access_logs(accessed_at DESC);

-- Comentarios
COMMENT ON TABLE document_access_logs IS 'Registro de accesos y descargas de documentos para auditoría';

-- RLS
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_access_logs_read" ON document_access_logs
FOR SELECT USING (current_user_can_read());

CREATE POLICY "document_access_logs_insert" ON document_access_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RPC para registrar acceso
CREATE OR REPLACE FUNCTION log_document_access(
  p_documento_id UUID,
  p_documento_nombre TEXT DEFAULT NULL,
  p_access_type TEXT DEFAULT 'download'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_log_id UUID;
BEGIN
  -- Obtener email del usuario actual
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE id = auth.uid() 
  LIMIT 1;

  -- Insertar registro de acceso
  INSERT INTO document_access_logs (
    documento_id,
    documento_nombre,
    user_id,
    user_email,
    access_type,
    ip_address,
    user_agent
  ) VALUES (
    p_documento_id,
    p_documento_nombre,
    auth.uid(),
    v_user_email,
    p_access_type,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION log_document_access IS 'Registra un acceso a documento para auditoría';