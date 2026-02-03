-- Actualizar el trigger log_checklist_activity para capturar el usuario que hizo el cambio
CREATE OR REPLACE FUNCTION public.log_checklist_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.mandato_activity 
      (mandato_id, activity_type, activity_description, entity_id, created_by)
    VALUES 
      (NEW.mandato_id, 'tarea', NEW.tarea || ' → ' || NEW.estado, NEW.id, auth.uid());
    
    UPDATE public.mandatos 
    SET last_activity_at = now() 
    WHERE id = NEW.mandato_id;
  END IF;
  RETURN NEW;
END;
$$;