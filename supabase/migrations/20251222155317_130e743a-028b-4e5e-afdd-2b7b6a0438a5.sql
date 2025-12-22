
-- =====================================================
-- FASE 4: GESTIÓN DOCUMENTAL AVANZADA
-- Carpetas, Versiones y Plantillas M&A
-- =====================================================

-- 1. Tabla de carpetas de documentos
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID REFERENCES mandatos(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  folder_type TEXT CHECK (folder_type IN ('informacion_general', 'due_diligence', 'negociacion', 'cierre', 'data_room', 'custom')),
  fase_asociada TEXT,
  orden INTEGER DEFAULT 0,
  is_data_room BOOLEAN DEFAULT false,
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Añadir columnas a documentos para soportar carpetas y versiones
ALTER TABLE documentos 
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;

-- 3. Tabla de plantillas de documentos M&A
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('NDA', 'LOI', 'Teaser', 'SPA', 'DD_Checklist', 'Contrato', 'Otro')),
  tipo_operacion TEXT CHECK (tipo_operacion IN ('compra', 'venta', 'ambos')),
  fase_aplicable TEXT,
  template_url TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_document_folders_mandato ON document_folders(mandato_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_parent ON document_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_documentos_folder ON documentos(folder_id);
CREATE INDEX IF NOT EXISTS idx_documentos_parent_doc ON documentos(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documentos_latest_version ON documentos(is_latest_version) WHERE is_latest_version = true;
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active) WHERE is_active = true;

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_document_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_folders_updated_at ON document_folders;
CREATE TRIGGER trg_document_folders_updated_at
  BEFORE UPDATE ON document_folders
  FOR EACH ROW EXECUTE FUNCTION update_document_folders_updated_at();

DROP TRIGGER IF EXISTS trg_document_templates_updated_at ON document_templates;
CREATE TRIGGER trg_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_document_folders_updated_at();

-- 6. Función para crear estructura de carpetas estándar M&A al crear un mandato
CREATE OR REPLACE FUNCTION create_mandato_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  dd_folder_id UUID;
BEGIN
  -- Crear carpetas principales
  INSERT INTO document_folders (mandato_id, name, folder_type, orden, icon)
  VALUES 
    (NEW.id, '01. Información General', 'informacion_general', 1, 'folder'),
    (NEW.id, '02. Due Diligence', 'due_diligence', 2, 'search'),
    (NEW.id, '03. Negociación', 'negociacion', 3, 'handshake'),
    (NEW.id, '04. Cierre', 'cierre', 4, 'check-circle'),
    (NEW.id, '05. Data Room', 'data_room', 5, 'lock')
  RETURNING id INTO dd_folder_id;

  -- Obtener el ID de Due Diligence para crear subcarpetas
  SELECT id INTO dd_folder_id FROM document_folders 
  WHERE mandato_id = NEW.id AND folder_type = 'due_diligence';

  -- Crear subcarpetas de Due Diligence
  IF dd_folder_id IS NOT NULL THEN
    INSERT INTO document_folders (mandato_id, parent_id, name, folder_type, orden, icon)
    VALUES 
      (NEW.id, dd_folder_id, 'Financiero', 'custom', 1, 'chart-bar'),
      (NEW.id, dd_folder_id, 'Legal', 'custom', 2, 'scale'),
      (NEW.id, dd_folder_id, 'Fiscal', 'custom', 3, 'file-text'),
      (NEW.id, dd_folder_id, 'Comercial', 'custom', 4, 'briefcase'),
      (NEW.id, dd_folder_id, 'Tecnología', 'custom', 5, 'cpu');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger para crear estructura al crear mandato (solo para nuevos mandatos)
DROP TRIGGER IF EXISTS trg_create_folder_structure ON mandatos;
CREATE TRIGGER trg_create_folder_structure
  AFTER INSERT ON mandatos
  FOR EACH ROW EXECUTE FUNCTION create_mandato_folder_structure();

-- 8. RLS para document_folders
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document folders"
  ON document_folders FOR ALL
  USING (is_user_admin(auth.uid()))
  WITH CHECK (is_user_admin(auth.uid()));

-- 9. RLS para document_templates  
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document templates"
  ON document_templates FOR ALL
  USING (is_user_admin(auth.uid()))
  WITH CHECK (is_user_admin(auth.uid()));

CREATE POLICY "Anyone can view active templates"
  ON document_templates FOR SELECT
  USING (is_active = true);

-- 10. Insertar plantillas M&A predefinidas
INSERT INTO document_templates (name, description, category, tipo_operacion, fase_aplicable) VALUES
  ('NDA Estándar', 'Acuerdo de Confidencialidad estándar para operaciones M&A', 'NDA', 'ambos', '1. Preparación'),
  ('NDA Bilateral', 'Acuerdo de Confidencialidad bilateral para exploraciones mutuas', 'NDA', 'ambos', '1. Preparación'),
  ('Teaser Vendedor', 'Documento teaser para presentar empresa en venta', 'Teaser', 'venta', '2. Marketing'),
  ('Teaser Comprador', 'Documento teaser para presentar perfil comprador', 'Teaser', 'compra', '2. Búsqueda'),
  ('LOI - Carta de Intenciones', 'Plantilla de Carta de Intenciones (Letter of Intent)', 'LOI', 'ambos', '3. Ofertas'),
  ('Checklist Due Diligence Financiero', 'Lista de documentos para DD Financiera', 'DD_Checklist', 'ambos', '4. Due Diligence'),
  ('Checklist Due Diligence Legal', 'Lista de documentos para DD Legal', 'DD_Checklist', 'ambos', '4. Due Diligence'),
  ('Checklist Due Diligence Fiscal', 'Lista de documentos para DD Fiscal', 'DD_Checklist', 'ambos', '4. Due Diligence'),
  ('SPA Template', 'Plantilla de Contrato de Compraventa (Share Purchase Agreement)', 'SPA', 'ambos', '5. Cierre'),
  ('Contrato de Servicios M&A', 'Contrato de servicios de asesoría M&A', 'Contrato', 'ambos', '1. Preparación')
ON CONFLICT DO NOTHING;

-- 11. Función para subir nueva versión de documento
CREATE OR REPLACE FUNCTION create_document_version(
  p_parent_document_id UUID,
  p_file_name TEXT,
  p_file_size_bytes BIGINT,
  p_mime_type TEXT,
  p_storage_path TEXT,
  p_uploaded_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
  v_new_version INTEGER;
  v_folder_id UUID;
  v_mandato_id UUID;
  v_tipo TEXT;
BEGIN
  -- Obtener datos del documento padre
  SELECT version, folder_id, mandato_id, tipo 
  INTO v_new_version, v_folder_id, v_mandato_id, v_tipo
  FROM documentos WHERE id = p_parent_document_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Documento padre no encontrado';
  END IF;

  -- Incrementar versión
  v_new_version := v_new_version + 1;

  -- Marcar versión anterior como no-latest
  UPDATE documentos SET is_latest_version = false WHERE id = p_parent_document_id;

  -- Insertar nueva versión
  INSERT INTO documentos (
    mandato_id, folder_id, file_name, file_size_bytes, mime_type, 
    storage_path, tipo, version, parent_document_id, is_latest_version, uploaded_by
  ) VALUES (
    v_mandato_id, v_folder_id, p_file_name, p_file_size_bytes, p_mime_type,
    p_storage_path, v_tipo, v_new_version, p_parent_document_id, true, p_uploaded_by
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Vista para documentos con información de versiones
CREATE OR REPLACE VIEW v_documentos_con_versiones AS
SELECT 
  d.*,
  f.name as folder_name,
  f.folder_type,
  f.is_data_room,
  (SELECT COUNT(*) FROM documentos WHERE parent_document_id = d.id OR id = d.id) as total_versions,
  (SELECT MAX(version) FROM documentos WHERE parent_document_id = d.id OR id = d.id) as latest_version
FROM documentos d
LEFT JOIN document_folders f ON d.folder_id = f.id
WHERE d.is_latest_version = true OR d.parent_document_id IS NULL;
