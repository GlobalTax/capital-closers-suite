-- Tabla para registrar toda la actividad de un mandato
CREATE TABLE public.mandato_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandato_id UUID NOT NULL REFERENCES public.mandatos(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('interaccion', 'tarea', 'documento', 'hora', 'nota', 'estado_cambio')),
  activity_description TEXT,
  entity_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_mandato_activity_mandato ON public.mandato_activity(mandato_id);
CREATE INDEX idx_mandato_activity_created ON public.mandato_activity(created_at DESC);
CREATE INDEX idx_mandato_activity_type ON public.mandato_activity(activity_type);

-- RLS
ALTER TABLE public.mandato_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view mandato activity"
  ON public.mandato_activity FOR SELECT
  USING (public.is_user_admin(auth.uid()));

CREATE POLICY "System can insert activity"
  ON public.mandato_activity FOR INSERT
  WITH CHECK (true);

-- Trigger para Interacciones
CREATE OR REPLACE FUNCTION public.log_interaccion_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mandato_id IS NOT NULL THEN
    INSERT INTO public.mandato_activity (mandato_id, activity_type, activity_description, entity_id, created_by)
    VALUES (NEW.mandato_id, 'interaccion', NEW.titulo, NEW.id, NEW.created_by);
    
    UPDATE public.mandatos SET last_activity_at = now() WHERE id = NEW.mandato_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_interaccion_activity
  AFTER INSERT ON public.interacciones
  FOR EACH ROW EXECUTE FUNCTION public.log_interaccion_activity();

-- Trigger para Time Entries
CREATE OR REPLACE FUNCTION public.log_time_entry_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.mandato_activity (mandato_id, activity_type, activity_description, entity_id, created_by)
  VALUES (NEW.mandato_id, 'hora', NEW.description, NEW.id, NEW.user_id);
  
  UPDATE public.mandatos SET last_activity_at = now() WHERE id = NEW.mandato_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_time_entry_activity
  AFTER INSERT ON public.mandato_time_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_time_entry_activity();

-- Trigger para Tareas Checklist (al completar/actualizar estado)
CREATE OR REPLACE FUNCTION public.log_checklist_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.mandato_activity (mandato_id, activity_type, activity_description, entity_id)
    VALUES (NEW.mandato_id, 'tarea', NEW.tarea || ' → ' || NEW.estado, NEW.id);
    
    UPDATE public.mandatos SET last_activity_at = now() WHERE id = NEW.mandato_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_checklist_activity
  AFTER UPDATE ON public.mandato_checklist_tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_checklist_activity();

-- Trigger para Documentos
CREATE OR REPLACE FUNCTION public.log_documento_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mandato_id IS NOT NULL THEN
    INSERT INTO public.mandato_activity (mandato_id, activity_type, activity_description, entity_id, created_by)
    VALUES (NEW.mandato_id, 'documento', NEW.file_name, NEW.id, NEW.uploaded_by);
    
    UPDATE public.mandatos SET last_activity_at = now() WHERE id = NEW.mandato_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_documento_activity
  AFTER INSERT ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.log_documento_activity();