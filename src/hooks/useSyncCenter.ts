import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Unified interfaces
export interface SyncIntegration {
  id: string;
  name: string;
  description: string;
  icon: 'brevo' | 'capittal' | 'database' | 'users' | 'operations';
  lastSyncAt: string | null;
  status: 'active' | 'error' | 'pending' | 'disabled' | 'never';
  pendingCount: number;
  syncedToday: number;
  errorsLastRun: number;
  supportsDryRun: boolean;
  isEnabled: boolean;
  historyUrl?: string;
}

export interface UnifiedLogEntry {
  id: string;
  source: string;
  sourceLabel: string;
  executedAt: string;
  completedAt: string | null;
  status: 'completed' | 'failed' | 'partial' | 'running';
  createdCount: number;
  updatedCount: number;
  errorsCount: number;
  errors: string[];
  triggeredBy: string;
  durationMs: number | null;
}

// Fetch unified stats for all integrations
async function fetchIntegrationStats(): Promise<SyncIntegration[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch in parallel
  const [
    brevoStatus,
    capittalLog,
    operationsLog,
    leadsLog,
    brevoQueueStats,
  ] = await Promise.all([
    // Brevo sync status
    supabase.from('brevo_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    // Capittal contacts last sync
    supabase.from('capittal_contact_sync_log' as any)
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    // Operations last sync
    supabase.from('operation_sync_log')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    // Leads last sync
    supabase.from('crm_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    // Brevo queue pending
    supabase.from('brevo_sync_queue')
      .select('status', { count: 'exact' })
      .eq('status', 'pending'),
  ]);

  // Count pending items for each source
  const [
    pendingValuations,
    pendingOperations,
    pendingLeads,
  ] = await Promise.all([
    // Valuations without empresa
    supabase.from('company_valuations')
      .select('*', { count: 'exact', head: true })
      .is('empresa_id', null),
    
    // Operations not synced
    supabase.from('company_operations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_deleted', false),
    
    // Leads not synced
    supabase.from('company_valuations')
      .select('*', { count: 'exact', head: true })
      .is('crm_synced_at', null),
  ]);

  // Get synced mandatos count for operations
  const { count: syncedMandatos } = await supabase
    .from('mandatos')
    .select('*', { count: 'exact', head: true })
    .not('external_operation_id', 'is', null);

  const integrations: SyncIntegration[] = [
    {
      id: 'brevo-contacts',
      name: 'Brevo Contacts',
      description: 'Sincronización bidireccional de contactos con Brevo',
      icon: 'brevo',
      lastSyncAt: brevoStatus.data?.created_at || null,
      status: brevoStatus.data?.sync_status === 'error' ? 'error' : 
              brevoStatus.data ? 'active' : 'never',
      pendingCount: brevoQueueStats.count || 0,
      syncedToday: 0,
      errorsLastRun: brevoStatus.data?.sync_error ? 1 : 0,
      supportsDryRun: false,
      isEnabled: true,
      historyUrl: '/integraciones/brevo',
    },
    {
      id: 'brevo-deals',
      name: 'Brevo Deals',
      description: 'Importar deals de Brevo como mandatos',
      icon: 'brevo',
      lastSyncAt: brevoStatus.data?.created_at || null,
      status: brevoStatus.data ? 'active' : 'never',
      pendingCount: 0,
      syncedToday: 0,
      errorsLastRun: 0,
      supportsDryRun: false,
      isEnabled: true,
      historyUrl: '/integraciones/brevo',
    },
    {
      id: 'capittal-contacts',
      name: 'Capittal Contacts',
      description: 'Sincronizar contactos desde Capittal CRM',
      icon: 'capittal',
      lastSyncAt: (capittalLog.data as any)?.started_at || null,
      status: (capittalLog.data as any)?.status === 'failed' ? 'error' :
              (capittalLog.data as any)?.status === 'partial' ? 'error' :
              capittalLog.data ? 'active' : 'never',
      pendingCount: 0,
      syncedToday: (capittalLog.data as any)?.contacts_created || 0,
      errorsLastRun: ((capittalLog.data as any)?.errors as any[])?.length || 0,
      supportsDryRun: false,
      isEnabled: true,
      historyUrl: '/sync-contacts-capittal',
    },
    {
      id: 'valuations',
      name: 'Valoraciones → CRM',
      description: 'Sincronizar valoraciones con empresas y contactos',
      icon: 'database',
      lastSyncAt: null, // Would need dedicated log table
      status: (pendingValuations.count || 0) > 0 ? 'pending' : 'active',
      pendingCount: pendingValuations.count || 0,
      syncedToday: 0,
      errorsLastRun: 0,
      supportsDryRun: true,
      isEnabled: true,
      historyUrl: '/sync-valuations',
    },
    {
      id: 'operations',
      name: 'Operations → Mandatos',
      description: 'Sincronizar operaciones Capittal con mandatos GoDeal',
      icon: 'operations',
      lastSyncAt: operationsLog.data?.executed_at || null,
      status: operationsLog.data?.status === 'failed' ? 'error' :
              operationsLog.data?.status === 'partial' ? 'error' :
              operationsLog.data ? 'active' : 'never',
      pendingCount: Math.max(0, (pendingOperations.count || 0) - (syncedMandatos || 0)),
      syncedToday: operationsLog.data?.mandatos_created || 0,
      errorsLastRun: operationsLog.data?.errors_count || 0,
      supportsDryRun: true,
      isEnabled: true,
      historyUrl: '/sync-operations',
    },
    {
      id: 'leads',
      name: 'Leads → CRM',
      description: 'Sincronizar leads con contactos y empresas',
      icon: 'users',
      lastSyncAt: leadsLog.data?.started_at || null,
      status: leadsLog.data?.status === 'failed' ? 'error' :
              leadsLog.data ? 'active' : 'never',
      pendingCount: pendingLeads.count || 0,
      syncedToday: leadsLog.data?.contactos_created || 0,
      errorsLastRun: (leadsLog.data?.errors as any[])?.length || 0,
      supportsDryRun: false,
      isEnabled: true,
    },
  ];

  return integrations;
}

// Fetch unified logs from all sources
async function fetchUnifiedLogs(limit = 30): Promise<UnifiedLogEntry[]> {
  const [brevoLogs, capittalLogs, operationsLogs, leadsLogs] = await Promise.all([
    supabase.from('brevo_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
    
    supabase.from('capittal_contact_sync_log' as any)
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit),
    
    supabase.from('operation_sync_log')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit),
    
    supabase.from('crm_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit),
  ]);

  const unified: UnifiedLogEntry[] = [];

  // Normalize Brevo logs
  (brevoLogs.data || []).forEach((log: any) => {
    unified.push({
      id: log.id,
      source: 'brevo',
      sourceLabel: `Brevo ${log.entity_type || 'Contact'}`,
      executedAt: log.created_at,
      completedAt: log.last_sync_at,
      status: log.sync_status === 'error' ? 'failed' : 
              log.sync_status === 'success' ? 'completed' : 'running',
      createdCount: 1,
      updatedCount: 0,
      errorsCount: log.sync_error ? 1 : 0,
      errors: log.sync_error ? [log.sync_error] : [],
      triggeredBy: log.sync_type || 'auto',
      durationMs: log.duration_ms,
    });
  });

  // Normalize Capittal logs
  (capittalLogs.data || []).forEach((log: any) => {
    unified.push({
      id: log.id,
      source: 'capittal',
      sourceLabel: 'Capittal Contacts',
      executedAt: log.started_at,
      completedAt: log.completed_at,
      status: log.status === 'failed' ? 'failed' :
              log.status === 'partial' ? 'partial' :
              log.status === 'completed' ? 'completed' : 'running',
      createdCount: log.contacts_created || 0,
      updatedCount: log.contacts_updated || 0,
      errorsCount: (log.errors as any[])?.length || 0,
      errors: ((log.errors as any[]) || []).map((e: any) => 
        typeof e === 'string' ? e : e.message || JSON.stringify(e)
      ).slice(0, 5),
      triggeredBy: log.triggered_by || 'auto',
      durationMs: log.completed_at && log.started_at 
        ? new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()
        : null,
    });
  });

  // Normalize Operations logs
  (operationsLogs.data || []).forEach((log: any) => {
    unified.push({
      id: log.id,
      source: 'operations',
      sourceLabel: 'Operations → Mandatos',
      executedAt: log.executed_at,
      completedAt: log.executed_at,
      status: log.status === 'failed' ? 'failed' :
              log.status === 'partial' ? 'partial' :
              log.status === 'completed' ? 'completed' : 'running',
      createdCount: log.mandatos_created || 0,
      updatedCount: log.mandatos_updated || 0,
      errorsCount: log.errors_count || 0,
      errors: ((log.errors as any[]) || []).map((e: any) => 
        typeof e === 'string' ? e : e.error || JSON.stringify(e)
      ).slice(0, 5),
      triggeredBy: log.triggered_by || 'auto',
      durationMs: log.duration_ms,
    });
  });

  // Normalize Leads logs
  (leadsLogs.data || []).forEach((log: any) => {
    unified.push({
      id: log.id,
      source: 'leads',
      sourceLabel: 'Leads → CRM',
      executedAt: log.started_at,
      completedAt: log.completed_at,
      status: log.status === 'failed' ? 'failed' :
              log.status === 'completed' ? 'completed' : 'running',
      createdCount: log.contactos_created || 0,
      updatedCount: log.empresas_created || 0,
      errorsCount: (log.errors as any[])?.length || 0,
      errors: ((log.errors as any[]) || []).map((e: any) => 
        typeof e === 'string' ? e : e.error || JSON.stringify(e)
      ).slice(0, 5),
      triggeredBy: log.triggered_by || 'auto',
      durationMs: log.completed_at && log.started_at 
        ? new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()
        : null,
    });
  });

  // Sort by execution time
  unified.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());

  return unified.slice(0, limit);
}

export function useSyncCenter() {
  const queryClient = useQueryClient();

  // Fetch integration stats
  const { data: integrations, isLoading: integrationsLoading, refetch: refetchIntegrations } = useQuery({
    queryKey: ['sync-center-integrations'],
    queryFn: fetchIntegrationStats,
    refetchInterval: 30000, // Every 30 seconds
  });

  // Fetch unified logs
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['sync-center-logs'],
    queryFn: () => fetchUnifiedLogs(50),
    refetchInterval: 30000,
  });

  // Sync mutations for each integration
  const syncBrevoContacts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-from-brevo');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sincronización de Brevo completada');
      queryClient.invalidateQueries({ queryKey: ['sync-center'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const syncBrevoDeals = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-deals-from-brevo');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sincronización de Deals completada');
      queryClient.invalidateQueries({ queryKey: ['sync-center'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const syncCapittalContacts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-contacts-from-capittal');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sincronización de Capittal completada');
      queryClient.invalidateQueries({ queryKey: ['sync-center'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const syncValuations = useMutation({
    mutationFn: async (dryRun: boolean) => {
      const { data, error } = await supabase.rpc('sync_valuations_to_crm', {
        p_dry_run: dryRun
      });
      if (error) throw error;
      return { data, dryRun };
    },
    onSuccess: (result) => {
      const resultData = result.data as any;
      if (result.dryRun) {
        toast.info(`Dry Run: ${resultData?.empresas_created || 0} empresas y ${resultData?.contactos_created || 0} contactos serían creados`);
      } else {
        toast.success('Sincronización de valoraciones completada');
      }
      queryClient.invalidateQueries({ queryKey: ['sync-center'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const syncOperations = useMutation({
    mutationFn: async (dryRun: boolean) => {
      const { data, error } = await supabase.functions.invoke('sync-operations-to-crm', {
        body: { dry_run: dryRun, triggered_by: 'manual' }
      });
      if (error) throw error;
      return { ...data, dryRun };
    },
    onSuccess: (result) => {
      const data = result as any;
      if (data?.dryRun) {
        toast.info(`Dry Run: ${data?.result?.mandatosCreated || 0} mandatos serían creados`);
      } else {
        toast.success('Sincronización de operaciones completada');
      }
      queryClient.invalidateQueries({ queryKey: ['sync-center'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const syncLeads = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-leads-to-crm', {
        body: { triggered_by: 'manual' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sincronización de leads completada');
      queryClient.invalidateQueries({ queryKey: ['sync-center'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Helper to get the correct sync function
  const getSyncFunction = (integrationId: string) => {
    switch (integrationId) {
      case 'brevo-contacts':
        return { sync: () => syncBrevoContacts.mutateAsync(), isPending: syncBrevoContacts.isPending };
      case 'brevo-deals':
        return { sync: () => syncBrevoDeals.mutateAsync(), isPending: syncBrevoDeals.isPending };
      case 'capittal-contacts':
        return { sync: () => syncCapittalContacts.mutateAsync(), isPending: syncCapittalContacts.isPending };
      case 'valuations':
        return { 
          sync: () => syncValuations.mutateAsync(false), 
          dryRun: () => syncValuations.mutateAsync(true),
          isPending: syncValuations.isPending 
        };
      case 'operations':
        return { 
          sync: () => syncOperations.mutateAsync(false), 
          dryRun: () => syncOperations.mutateAsync(true),
          isPending: syncOperations.isPending 
        };
      case 'leads':
        return { sync: () => syncLeads.mutateAsync(), isPending: syncLeads.isPending };
      default:
        return null;
    }
  };

  const refetchAll = () => {
    refetchIntegrations();
    refetchLogs();
  };

  return {
    integrations: integrations || [],
    logs: logs || [],
    isLoading: integrationsLoading || logsLoading,
    refetch: refetchAll,
    getSyncFunction,
    isSyncing: syncBrevoContacts.isPending || syncBrevoDeals.isPending || 
               syncCapittalContacts.isPending || syncValuations.isPending || 
               syncOperations.isPending || syncLeads.isPending,
  };
}
