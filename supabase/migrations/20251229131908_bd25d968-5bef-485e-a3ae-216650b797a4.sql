-- Añadir campos de trazabilidad CRM a contact_leads
ALTER TABLE public.contact_leads 
  ADD COLUMN IF NOT EXISTS crm_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS crm_contacto_id UUID REFERENCES public.contactos(id),
  ADD COLUMN IF NOT EXISTS crm_empresa_id UUID REFERENCES public.empresas(id);

-- Añadir campos de trazabilidad CRM a general_contact_leads
ALTER TABLE public.general_contact_leads
  ADD COLUMN IF NOT EXISTS crm_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS crm_contacto_id UUID REFERENCES public.contactos(id),
  ADD COLUMN IF NOT EXISTS crm_empresa_id UUID REFERENCES public.empresas(id);

-- Añadir campos de trazabilidad CRM a company_valuations (ya tiene empresa_id)
ALTER TABLE public.company_valuations
  ADD COLUMN IF NOT EXISTS crm_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS crm_contacto_id UUID REFERENCES public.contactos(id);

-- Crear índices para optimizar consultas de sincronización
CREATE INDEX IF NOT EXISTS idx_contact_leads_crm_synced ON public.contact_leads(crm_synced_at) WHERE crm_synced_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_general_contact_leads_crm_synced ON public.general_contact_leads(crm_synced_at) WHERE crm_synced_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_valuations_crm_synced ON public.company_valuations(crm_synced_at) WHERE crm_synced_at IS NULL;

-- Crear tabla para log de sincronizaciones
CREATE TABLE IF NOT EXISTS public.crm_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
  leads_processed INTEGER DEFAULT 0,
  contactos_created INTEGER DEFAULT 0,
  empresas_created INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  triggered_by TEXT DEFAULT 'cron' -- cron, manual
);

-- Habilitar RLS en crm_sync_log
ALTER TABLE public.crm_sync_log ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan leer los logs
CREATE POLICY "Admins can read sync logs" ON public.crm_sync_log
  FOR SELECT USING (public.is_user_admin(auth.uid()));

-- Política para que service_role pueda insertar/actualizar
CREATE POLICY "Service role can manage sync logs" ON public.crm_sync_log
  FOR ALL USING (auth.role() = 'service_role');