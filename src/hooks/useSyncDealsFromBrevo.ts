import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface SyncResult {
  totalDeals: number;
  mandatosCreated: number;
  mandatosUpdated: number;
  empresasCreated: number;
  empresasLinked: number;
  errors: string[];
}

export function useSyncDealsFromBrevo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const syncDealsFromBrevo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sync-deals-from-brevo');

      if (fnError) {
        throw new Error(fnError.message);
      }

      setResult(data as SyncResult);
      
      // Invalidate mandatos queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['mandatos'] });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    result,
    error,
    syncDealsFromBrevo,
  };
}
