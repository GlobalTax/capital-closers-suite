import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncLogEntry {
  id: string;
  started_at: string;
  completed_at: string | null;
  triggered_by: 'webhook' | 'polling' | 'manual';
  contacts_processed: number;
  contacts_created: number;
  contacts_updated: number;
  contacts_skipped: number;
  contacts_archived: number;
  errors: Array<{ capittalId: string; error: string }>;
  status: 'running' | 'completed' | 'failed' | 'partial';
  error_message: string | null;
  last_capittal_timestamp: string | null;
}

export interface SyncState {
  id: string;
  last_sync_at: string | null;
  last_modified_timestamp: string | null;
  is_enabled: boolean;
  polling_interval_minutes: number;
  updated_at: string;
}

export interface SyncStats {
  totalSynced: number;
  lastSyncAt: string | null;
  todayCreated: number;
  todayUpdated: number;
  isEnabled: boolean;
  pollingInterval: number;
}

async function fetchSyncState(): Promise<SyncState | null> {
  const { data, error } = await (supabase as any)
    .from('capittal_sync_state')
    .select('*')
    .eq('id', 'contacts')
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching sync state:', error);
    return null;
  }
  
  return data as SyncState | null;
}

async function fetchSyncHistory(limit = 10): Promise<SyncLogEntry[]> {
  const { data, error } = await supabase
    .from('capittal_contact_sync_log' as any)
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching sync history:', error);
    return [];
  }
  
  return (data || []).map((log: any) => ({
    ...log,
    errors: Array.isArray(log.errors) ? log.errors : [],
  })) as SyncLogEntry[];
}

async function fetchSyncStats(): Promise<SyncStats> {
  const [stateResult, todayLogsResult, totalResult] = await Promise.all([
    fetchSyncState(),
    supabase
      .from('capittal_contact_sync_log' as any)
      .select('contacts_created, contacts_updated')
      .gte('started_at', new Date().toISOString().split('T')[0])
      .eq('status', 'completed'),
    supabase
      .from('contactos')
      .select('id', { count: 'exact', head: true })
      .eq('source', 'capittal'),
  ]);

  const todayLogs = (todayLogsResult.data || []) as any[];
  const todayCreated = todayLogs.reduce((sum, log) => sum + (log.contacts_created || 0), 0);
  const todayUpdated = todayLogs.reduce((sum, log) => sum + (log.contacts_updated || 0), 0);

  return {
    totalSynced: totalResult.count || 0,
    lastSyncAt: stateResult?.last_sync_at || null,
    todayCreated,
    todayUpdated,
    isEnabled: stateResult?.is_enabled ?? true,
    pollingInterval: stateResult?.polling_interval_minutes ?? 5,
  };
}

async function triggerSync(): Promise<{ success: boolean; result?: any; error?: string }> {
  const { data, error } = await supabase.functions.invoke('sync-contacts-from-capittal', {
    body: { triggered_by: 'manual' },
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

async function updateSyncSettings(settings: { is_enabled?: boolean; polling_interval_minutes?: number }) {
  const { error } = await supabase
    .from('capittal_sync_state' as any)
    .update(settings)
    .eq('id', 'contacts');
  
  if (error) {
    throw new Error(error.message);
  }
}

export function useSyncContactsFromCapittal() {
  const queryClient = useQueryClient();

  const { data: syncState, isLoading: stateLoading } = useQuery({
    queryKey: ['capittal-sync-state'],
    queryFn: fetchSyncState,
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['capittal-sync-stats'],
    queryFn: fetchSyncStats,
    refetchInterval: 60000,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['capittal-sync-history'],
    queryFn: () => fetchSyncHistory(20),
    refetchInterval: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: (data) => {
      if (data.success) {
        const result = data.result;
        toast.success(
          `Sync completado: ${result?.contactsCreated || 0} creados, ${result?.contactsUpdated || 0} actualizados`
        );
      } else {
        toast.error(data.error || 'Error en sincronización');
      }
      queryClient.invalidateQueries({ queryKey: ['capittal-sync-state'] });
      queryClient.invalidateQueries({ queryKey: ['capittal-sync-stats'] });
      queryClient.invalidateQueries({ queryKey: ['capittal-sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const settingsMutation = useMutation({
    mutationFn: updateSyncSettings,
    onSuccess: () => {
      toast.success('Configuración guardada');
      queryClient.invalidateQueries({ queryKey: ['capittal-sync-state'] });
      queryClient.invalidateQueries({ queryKey: ['capittal-sync-stats'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    syncState,
    stats,
    history: history || [],
    isLoading: stateLoading || statsLoading || historyLoading,
    isSyncing: syncMutation.isPending,
    syncNow: syncMutation.mutate,
    updateSettings: settingsMutation.mutate,
    isUpdatingSettings: settingsMutation.isPending,
  };
}
