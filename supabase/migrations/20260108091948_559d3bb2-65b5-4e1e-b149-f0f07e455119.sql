-- Remove duplicate Brevo triggers that cause the error "operator does not exist: text ->> unknown"
-- These old triggers use direct HTTP calls and fail when executed from RPC context

-- Drop the old triggers
DROP TRIGGER IF EXISTS after_contacto_insert_or_update ON public.contactos;
DROP TRIGGER IF EXISTS after_empresa_insert_or_update ON public.empresas;

-- Drop the old functions that are no longer needed
DROP FUNCTION IF EXISTS public.trigger_sync_contact_to_brevo();
DROP FUNCTION IF EXISTS public.trigger_sync_empresa_to_brevo();