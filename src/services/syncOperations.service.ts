import { supabase } from "@/integrations/supabase/client";

export interface SyncResult {
  operationsProcessed: number;
  mandatosCreated: number;
  mandatosUpdated: number;
  empresasCreated: number;
  errors: Array<{ operationId: string; error: string }>;
}

export interface SyncResponse {
  success: boolean;
  dryRun: boolean;
  result: SyncResult;
  durationMs?: number;
  error?: string;
}

export interface SyncLogEntry {
  id: string;
  executed_at: string;
  triggered_by: string;
  operations_processed: number;
  mandatos_created: number;
  mandatos_updated: number;
  empresas_created: number;
  errors_count: number;
  errors: Array<{ operationId: string; error: string }>;
  status: string;
  duration_ms: number | null;
}

export interface SyncStats {
  totalOperations: number;
  syncedMandatos: number;
  pendingSync: number;
  lastSync: SyncLogEntry | null;
}

/**
 * Trigger sync from Capittal operations to GoDeal mandatos
 */
export async function triggerOperationsSync(dryRun = false): Promise<SyncResponse> {
  const { data, error } = await supabase.functions.invoke('sync-operations-to-crm', {
    body: { 
      dry_run: dryRun,
      triggered_by: 'manual'
    }
  });

  if (error) {
    throw new Error(`Sync failed: ${error.message}`);
  }

  return data as SyncResponse;
}

/**
 * Get sync statistics
 */
export async function getSyncStats(): Promise<SyncStats> {
  // Count active operations in company_operations
  const { count: totalOperations, error: opsError } = await supabase
    .from('company_operations')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('is_deleted', false);

  if (opsError) {
    console.error('Error fetching operations count:', opsError);
  }

  // Count mandatos with external_operation_id (already synced)
  const { count: syncedMandatos, error: mandatosError } = await supabase
    .from('mandatos')
    .select('*', { count: 'exact', head: true })
    .not('external_operation_id', 'is', null);

  if (mandatosError) {
    console.error('Error fetching synced mandatos count:', mandatosError);
  }

  // Get last sync log
  const { data: lastSyncData, error: logError } = await supabase
    .from('operation_sync_log')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (logError) {
    console.error('Error fetching last sync log:', logError);
  }

  return {
    totalOperations: totalOperations || 0,
    syncedMandatos: syncedMandatos || 0,
    pendingSync: Math.max(0, (totalOperations || 0) - (syncedMandatos || 0)),
    lastSync: lastSyncData as SyncLogEntry | null
  };
}

/**
 * Get sync history
 */
export async function getSyncHistory(limit = 20): Promise<SyncLogEntry[]> {
  const { data, error } = await supabase
    .from('operation_sync_log')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error fetching sync history: ${error.message}`);
  }

  return (data || []) as SyncLogEntry[];
}
