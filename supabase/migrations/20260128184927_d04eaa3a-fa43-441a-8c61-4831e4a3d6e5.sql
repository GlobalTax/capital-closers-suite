-- ============================================
-- Tabla principal: company_meetings
-- ============================================
CREATE TABLE company_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  preparation_notes TEXT,
  meeting_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_company_meetings_company ON company_meetings(company_id);
CREATE INDEX idx_company_meetings_date ON company_meetings(meeting_date DESC);

-- Trigger para updated_at (reutiliza función existente)
CREATE TRIGGER set_company_meetings_updated_at
  BEFORE UPDATE ON company_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Tabla de documentos: company_meeting_documents
-- ============================================
CREATE TABLE company_meeting_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES company_meetings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para buscar documentos por reunión
CREATE INDEX idx_meeting_documents_meeting ON company_meeting_documents(meeting_id);

-- ============================================
-- Habilitar RLS
-- ============================================
ALTER TABLE company_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_meeting_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Políticas RLS para company_meetings
-- ============================================
CREATE POLICY "meetings_read" ON company_meetings
FOR SELECT USING (public.current_user_can_read());

CREATE POLICY "meetings_insert" ON company_meetings
FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "meetings_update" ON company_meetings
FOR UPDATE USING (public.current_user_can_write());

CREATE POLICY "meetings_delete" ON company_meetings
FOR DELETE USING (public.current_user_can_write());

-- ============================================
-- Políticas RLS para company_meeting_documents
-- ============================================
CREATE POLICY "meeting_docs_read" ON company_meeting_documents
FOR SELECT USING (public.current_user_can_read());

CREATE POLICY "meeting_docs_insert" ON company_meeting_documents
FOR INSERT WITH CHECK (public.current_user_can_write());

CREATE POLICY "meeting_docs_delete" ON company_meeting_documents
FOR DELETE USING (public.current_user_can_write());