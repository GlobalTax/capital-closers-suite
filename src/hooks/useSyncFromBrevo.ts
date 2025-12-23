import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SyncResult {
  contactos_created: number;
  contactos_updated: number;
  contactos_skipped: number;
  empresas_created: number;
  empresas_linked: number;
  errors: string[];
  total_brevo_contacts: number;
}

interface SyncState {
  loading: boolean;
  result: SyncResult | null;
  error: string | null;
}

export function useSyncFromBrevo() {
  const [state, setState] = useState<SyncState>({
    loading: false,
    result: null,
    error: null
  });

  const syncFromBrevo = async () => {
    setState({ loading: true, result: null, error: null });

    try {
      const { data, error } = await supabase.functions.invoke('sync-from-brevo', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      setState({ loading: false, result: data.result, error: null });

      toast({
        title: "Sincronización completada",
        description: `${data.result.contactos_created} contactos creados, ${data.result.contactos_updated} actualizados`,
      });

      return data.result;
    } catch (error: any) {
      const errorMessage = error.message || 'Error al sincronizar';
      setState({ loading: false, result: null, error: errorMessage });

      toast({
        title: "Error en sincronización",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  };

  return {
    ...state,
    syncFromBrevo
  };
}
