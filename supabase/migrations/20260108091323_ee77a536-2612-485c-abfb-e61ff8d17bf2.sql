-- Fix queue_contacto_to_brevo to use correct field names
CREATE OR REPLACE FUNCTION public.queue_contacto_to_brevo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email ~ '^[^@]+@[^@]+\.[^@]+$' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.brevo_sync_queue 
      WHERE entity_type = 'contact' 
      AND entity_id = NEW.id 
      AND status = 'pending'
    ) THEN
      INSERT INTO public.brevo_sync_queue (entity_type, entity_id, action, payload)
      VALUES (
        'contact', 
        NEW.id, 
        TG_OP,
        jsonb_build_object(
          'email', NEW.email,
          'nombre', NEW.nombre,
          'apellidos', NEW.apellidos,
          'cargo', NEW.cargo,
          'linkedin', NEW.linkedin,
          'empresa_principal_id', NEW.empresa_principal_id
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix queue_empresa_to_brevo to use correct field names
CREATE OR REPLACE FUNCTION public.queue_empresa_to_brevo()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.brevo_sync_queue 
    WHERE entity_type = 'company' 
    AND entity_id = NEW.id 
    AND status = 'pending'
  ) THEN
    INSERT INTO public.brevo_sync_queue (entity_type, entity_id, action, payload)
    VALUES (
      'company', 
      NEW.id, 
      TG_OP,
      jsonb_build_object(
        'nombre', NEW.nombre,
        'sector', NEW.sector,
        'sitio_web', NEW.sitio_web,
        'ubicacion', NEW.ubicacion
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;