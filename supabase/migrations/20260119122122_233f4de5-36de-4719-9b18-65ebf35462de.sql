-- Habilitar REPLICA IDENTITY FULL para que Supabase Realtime funcione correctamente
ALTER TABLE public.sf_funds REPLICA IDENTITY FULL;
ALTER TABLE public.sf_matches REPLICA IDENTITY FULL;