-- ============================================
-- SISTEMA DE ARCHIVOS PARA CHECKLIST M&A
-- ============================================

-- Crear tabla de archivos asociados a tareas
CREATE TABLE public.mandato_checklist_task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.mandato_checklist_tasks(id) ON DELETE CASCADE,
  
  -- Información del archivo
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Metadata
  uploaded_by UUID REFERENCES auth.users(id),
  description TEXT,
  file_category TEXT CHECK (file_category IN ('documento', 'imagen', 'hoja_calculo', 'presentacion', 'otro')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para optimización
CREATE INDEX idx_task_files_task_id ON public.mandato_checklist_task_files(task_id);
CREATE INDEX idx_task_files_uploaded_by ON public.mandato_checklist_task_files(uploaded_by);
CREATE INDEX idx_task_files_created_at ON public.mandato_checklist_task_files(created_at DESC);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_checklist_task_files_updated_at
  BEFORE UPDATE ON public.mandato_checklist_task_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.mandato_checklist_task_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage task files"
  ON public.mandato_checklist_task_files
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Crear bucket de Storage para archivos de checklist
INSERT INTO storage.buckets (id, name, public)
VALUES ('mandato-checklist-files', 'mandato-checklist-files', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage (solo admins)
CREATE POLICY "Admins can upload checklist files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mandato-checklist-files' 
    AND current_user_is_admin()
  );

CREATE POLICY "Admins can view checklist files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mandato-checklist-files' 
    AND current_user_is_admin()
  );

CREATE POLICY "Admins can update checklist files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'mandato-checklist-files' 
    AND current_user_is_admin()
  );

CREATE POLICY "Admins can delete checklist files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'mandato-checklist-files' 
    AND current_user_is_admin()
  );

-- Comentarios para documentación
COMMENT ON TABLE public.mandato_checklist_task_files IS 'Archivos adjuntos a tareas del checklist M&A';
COMMENT ON COLUMN public.mandato_checklist_task_files.file_path IS 'Ruta del archivo en Supabase Storage';
COMMENT ON COLUMN public.mandato_checklist_task_files.file_category IS 'Categoría del archivo: documento, imagen, hoja_calculo, presentacion, otro';