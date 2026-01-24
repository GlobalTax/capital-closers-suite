import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseSearchFundsRealtimeReturn {
  isConnected: boolean;
}

export function useSearchFundsRealtime(): UseSearchFundsRealtimeReturn {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Canal para sf_funds (fondos)
    const fundsChannel = supabase
      .channel('sf-funds-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sf_funds'
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['search-funds-with-stats'] });
          queryClient.invalidateQueries({ queryKey: ['search-fund-countries'] });
          queryClient.invalidateQueries({ queryKey: ['search-fund-sectors'] });
          const newFund = payload.new as { name?: string };
          if (newFund?.name) {
            toast.info('Nuevo Search Fund añadido', {
              description: newFund.name,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sf_funds'
        },
        (payload) => {
          const updatedFund = payload.new as { id?: string };
          queryClient.invalidateQueries({ queryKey: ['search-funds-with-stats'] });
          queryClient.invalidateQueries({ queryKey: ['search-fund-countries'] });
          queryClient.invalidateQueries({ queryKey: ['search-fund-sectors'] });
          if (updatedFund?.id) {
            queryClient.invalidateQueries({ queryKey: ['search-fund', updatedFund.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sf_funds'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['search-funds-with-stats'] });
          queryClient.invalidateQueries({ queryKey: ['search-fund-countries'] });
          queryClient.invalidateQueries({ queryKey: ['search-fund-sectors'] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Canal para sf_matches (asociaciones con mandatos)
    const matchesChannel = supabase
      .channel('sf-matches-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sf_matches'
        },
        (payload) => {
          // Invalidar stats cuando cambian matches
          queryClient.invalidateQueries({ queryKey: ['search-funds-with-stats'] });
          queryClient.invalidateQueries({ queryKey: ['search-fund-matches'] });
          
          // Invalidar queries específicas del fund afectado
          const record = (payload.new || payload.old) as { fund_id?: string };
          if (record?.fund_id) {
            queryClient.invalidateQueries({ queryKey: ['sf-fund-matches', record.fund_id] });
          }
        }
      )
      .subscribe();

    // Canal para sf_outreach
    const outreachChannel = supabase
      .channel('sf-outreach-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sf_outreach'
        },
        (payload) => {
          const record = (payload.new || payload.old) as { fund_id?: string };
          if (record?.fund_id) {
            queryClient.invalidateQueries({ 
              queryKey: ['search-fund-outreach', record.fund_id] 
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(fundsChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(outreachChannel);
    };
  }, [queryClient]);

  return { isConnected };
}
