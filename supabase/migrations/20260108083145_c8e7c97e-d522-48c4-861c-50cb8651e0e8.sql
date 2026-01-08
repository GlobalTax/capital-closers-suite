-- Fix trigger_create_deal_on_mandate to handle empty request.jwt.claims safely
CREATE OR REPLACE FUNCTION public.trigger_create_deal_on_mandate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_claims_text TEXT;
  auth_token TEXT;
BEGIN
  -- Solo disparar cuando el estado cambia a 'activo'
  IF NEW.estado = 'activo' AND (OLD IS NULL OR OLD.estado IS NULL OR OLD.estado != 'activo') THEN
    -- Insertar registro de sincronización pendiente
    INSERT INTO public.brevo_sync_log (entity_type, entity_id, sync_status)
    VALUES ('deal', NEW.id, 'pending')
    ON CONFLICT DO NOTHING;

    -- Safely extract token from JWT claims
    jwt_claims_text := current_setting('request.jwt.claims', true);
    IF jwt_claims_text IS NOT NULL AND jwt_claims_text != '' THEN
      BEGIN
        auth_token := (jwt_claims_text::json)->>'token';
      EXCEPTION WHEN OTHERS THEN
        auth_token := NULL;
      END;
    ELSE
      auth_token := NULL;
    END IF;

    -- Solo llamar a edge function si tenemos token
    IF auth_token IS NOT NULL THEN
      PERFORM
        net.http_post(
          url := 'https://fwhqtzkkvnjkazhaficj.supabase.co/functions/v1/sync-to-brevo',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || auth_token
          ),
          body := jsonb_build_object(
            'type', 'deal',
            'mandato_id', NEW.id::text,
            'empresa_id', NEW.empresa_principal_id::text,
            'data', jsonb_build_object(
              'id', NEW.id,
              'tipo', NEW.tipo,
              'estado', NEW.estado,
              'valor', NEW.valor,
              'fecha_inicio', NEW.fecha_inicio,
              'fecha_cierre', NEW.fecha_cierre,
              'descripcion', NEW.descripcion,
              'valoracion_esperada', NEW.valoracion_esperada,
              'empresa_principal_id', NEW.empresa_principal_id
            )
          )
        );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;