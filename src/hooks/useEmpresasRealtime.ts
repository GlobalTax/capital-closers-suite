import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useEmpresasRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('empresas-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'empresas'
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['empresas'] });
          toast.info('Nueva empresa sincronizada', {
            description: (payload.new as { nombre?: string }).nombre,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'empresas'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['empresas'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'empresas'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['empresas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
