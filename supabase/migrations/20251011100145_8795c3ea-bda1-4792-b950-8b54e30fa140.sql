-- ============================================
-- TABLA DE TRACKING DE SINCRONIZACIONES BREVO
-- ============================================

CREATE TABLE IF NOT EXISTS public.brevo_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id UUID NOT NULL,
  brevo_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'error')),
  sync_error TEXT,
  sync_attempts INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_brevo_sync_log_entity ON public.brevo_sync_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_brevo_sync_log_status ON public.brevo_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_brevo_sync_log_brevo_id ON public.brevo_sync_log(brevo_id);

-- RLS para que solo admins puedan ver los logs
ALTER TABLE public.brevo_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
  ON public.brevo_sync_log
  FOR SELECT
  USING (current_user_is_admin());

CREATE POLICY "System can insert sync logs"
  ON public.brevo_sync_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sync logs"
  ON public.brevo_sync_log
  FOR UPDATE
  USING (true);

-- ============================================
-- FUNCIONES PARA TRIGGERS DE SINCRONIZACIÓN
-- ============================================

-- Función para sincronizar contactos a Brevo
CREATE OR REPLACE FUNCTION public.trigger_sync_contact_to_brevo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar registro de sincronización pendiente
  INSERT INTO public.brevo_sync_log (entity_type, entity_id, sync_status)
  VALUES ('contact', NEW.id, 'pending')
  ON CONFLICT DO NOTHING;

  -- Llamar a edge function de forma asíncrona (no bloqueante)
  PERFORM
    net.http_post(
      url := 'https://fwhqtzkkvnjkazhaficj.supabase.co/functions/v1/sync-to-brevo',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
      ),
      body := jsonb_build_object(
        'type', 'contact',
        'id', NEW.id::text,
        'data', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'nombre', NEW.nombre,
          'apellidos', NEW.apellidos,
          'telefono', NEW.telefono,
          'cargo', NEW.cargo,
          'linkedin', NEW.linkedin,
          'empresa_principal_id', NEW.empresa_principal_id
        )
      )
    );
  
  RETURN NEW;
END;
$$;

-- Función para sincronizar empresas a Brevo
CREATE OR REPLACE FUNCTION public.trigger_sync_empresa_to_brevo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar registro de sincronización pendiente
  INSERT INTO public.brevo_sync_log (entity_type, entity_id, sync_status)
  VALUES ('company', NEW.id, 'pending')
  ON CONFLICT DO NOTHING;

  -- Llamar a edge function
  PERFORM
    net.http_post(
      url := 'https://fwhqtzkkvnjkazhaficj.supabase.co/functions/v1/sync-to-brevo',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
      ),
      body := jsonb_build_object(
        'type', 'company',
        'id', NEW.id::text,
        'data', jsonb_build_object(
          'id', NEW.id,
          'nombre', NEW.nombre,
          'cif', NEW.cif,
          'sector', NEW.sector,
          'subsector', NEW.subsector,
          'ubicacion', NEW.ubicacion,
          'facturacion', NEW.facturacion,
          'empleados', NEW.empleados,
          'sitio_web', NEW.sitio_web,
          'revenue', NEW.revenue,
          'ebitda', NEW.ebitda,
          'es_target', NEW.es_target,
          'estado_target', NEW.estado_target
        )
      )
    );
  
  RETURN NEW;
END;
$$;

-- Función para crear deal cuando mandato se activa
CREATE OR REPLACE FUNCTION public.trigger_create_deal_on_mandate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo disparar cuando el estado cambia a 'activo'
  IF NEW.estado = 'activo' AND (OLD.estado IS NULL OR OLD.estado != 'activo') THEN
    -- Insertar registro de sincronización pendiente
    INSERT INTO public.brevo_sync_log (entity_type, entity_id, sync_status)
    VALUES ('deal', NEW.id, 'pending')
    ON CONFLICT DO NOTHING;

    -- Llamar a edge function
    PERFORM
      net.http_post(
        url := 'https://fwhqtzkkvnjkazhaficj.supabase.co/functions/v1/sync-to-brevo',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'token'
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
  
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para sincronizar contactos
DROP TRIGGER IF EXISTS after_contacto_insert_or_update ON public.contactos;
CREATE TRIGGER after_contacto_insert_or_update
  AFTER INSERT OR UPDATE ON public.contactos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_contact_to_brevo();

-- Trigger para sincronizar empresas
DROP TRIGGER IF EXISTS after_empresa_insert_or_update ON public.empresas;
CREATE TRIGGER after_empresa_insert_or_update
  AFTER INSERT OR UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_empresa_to_brevo();

-- Trigger para crear deal cuando mandato se activa
DROP TRIGGER IF EXISTS after_mandato_activated ON public.mandatos;
CREATE TRIGGER after_mandato_activated
  AFTER INSERT OR UPDATE ON public.mandatos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_deal_on_mandate();