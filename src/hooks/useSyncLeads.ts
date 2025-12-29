import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncStats {
  pendingValuations: number;
  pendingContactLeads: number;
  pendingGeneralLeads: number;
  totalPending: number;
  syncedToday: number;
  lastSync: string | null;
}

interface SyncLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  leads_processed: number;
  contactos_created: number;
  empresas_created: number;
  errors: unknown;
  triggered_by: string;
}

export function useSyncLeads() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch sync stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['sync-leads-stats'],
    queryFn: async (): Promise<SyncStats> => {
      // Count pending valuations
      const { count: pendingValuations } = await supabase
        .from('company_valuations')
        .select('*', { count: 'exact', head: true })
        .is('crm_synced_at', null)
        .eq('is_deleted', false);

      // Count pending contact leads
      const { count: pendingContactLeads } = await supabase
        .from('contact_leads')
        .select('*', { count: 'exact', head: true })
        .is('crm_synced_at', null)
        .eq('is_deleted', false);

      // Count pending general leads
      const { count: pendingGeneralLeads } = await supabase
        .from('general_contact_leads')
        .select('*', { count: 'exact', head: true })
        .is('crm_synced_at', null);

      // Count synced today
      const today = new Date().toISOString().split('T')[0];
      const { count: syncedToday } = await supabase
        .from('crm_sync_log')
        .select('leads_processed', { count: 'exact', head: true })
        .gte('started_at', `${today}T00:00:00`)
        .eq('status', 'completed');

      // Get last sync
      const { data: lastSyncData } = await supabase
        .from('crm_sync_log')
        .select('completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        pendingValuations: pendingValuations || 0,
        pendingContactLeads: pendingContactLeads || 0,
        pendingGeneralLeads: pendingGeneralLeads || 0,
        totalPending: (pendingValuations || 0) + (pendingContactLeads || 0) + (pendingGeneralLeads || 0),
        syncedToday: syncedToday || 0,
        lastSync: lastSyncData?.completed_at || null
      };
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // Fetch sync history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['sync-leads-history'],
    queryFn: async (): Promise<SyncLog[]> => {
      const { data, error } = await supabase
        .from('crm_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    }
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('sync-leads-to-crm', {
        body: { triggered_by: 'manual' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setIsSyncing(false);
      toast.success(`Sincronización completada: ${data.leadsProcessed} leads procesados, ${data.contactosCreated} contactos creados, ${data.empresasCreated} empresas creadas`);
      queryClient.invalidateQueries({ queryKey: ['sync-leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sync-leads-history'] });
    },
    onError: (error) => {
      setIsSyncing(false);
      toast.error(`Error en sincronización: ${error.message}`);
    }
  });

  return {
    stats,
    statsLoading,
    history,
    historyLoading,
    isSyncing,
    syncNow: syncMutation.mutate,
    refetchStats
  };
}
