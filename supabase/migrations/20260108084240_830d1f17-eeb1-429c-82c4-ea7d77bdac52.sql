-- Fix create_mandato_folder_structure to handle multi-row insert correctly
CREATE OR REPLACE FUNCTION create_mandato_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  dd_folder_id UUID;
BEGIN
  -- Crear carpetas principales (sin RETURNING para evitar error de múltiples filas)
  INSERT INTO document_folders (mandato_id, name, folder_type, orden, icon)
  VALUES 
    (NEW.id, '01. Información General', 'informacion_general', 1, 'folder'),
    (NEW.id, '02. Due Diligence', 'due_diligence', 2, 'search'),
    (NEW.id, '03. Negociación', 'negociacion', 3, 'handshake'),
    (NEW.id, '04. Cierre', 'cierre', 4, 'check-circle'),
    (NEW.id, '05. Data Room', 'data_room', 5, 'lock');

  -- Obtener el ID de Due Diligence para crear subcarpetas (SELECT separado)
  SELECT id INTO dd_folder_id FROM document_folders 
  WHERE mandato_id = NEW.id AND folder_type = 'due_diligence'
  LIMIT 1;

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