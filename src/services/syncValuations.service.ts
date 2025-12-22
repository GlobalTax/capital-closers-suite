import { supabase } from "@/integrations/supabase/client";

export interface SyncStats {
  total_valuations: number;
  valuations_with_empresa: number;
  valuations_without_empresa: number;
  total_empresas: number;
  total_contactos: number;
  contactos_with_valuation: number;
  potential_cif_matches: number;
  last_sync: string | null;
  sectors_distribution: Array<{ sector: string; count: number }> | null;
}

export interface SyncResult {
  dry_run: boolean;
  total_valuations: number;
  empresas_created: number;
  empresas_linked: number;
  contactos_created: number;
  contactos_linked: number;
  errors_count: number;
  errors: Array<{
    valuation_id: string;
    company_name: string;
    error: string;
  }>;
  duration_ms: number;
}

export interface SyncHistoryItem {
  id: string;
  executed_at: string;
  total_valuations: number;
  empresas_created: number;
  empresas_linked: number;
  contactos_created: number;
  contactos_linked: number;
  errors_count: number;
  duration_ms: number;
  status: string;
}

export async function getSyncStats(): Promise<SyncStats> {
  const { data, error } = await supabase.rpc('get_valuation_sync_stats');
  
  if (error) {
    console.error('Error fetching sync stats:', error);
    throw error;
  }
  
  return data as unknown as SyncStats;
}

export async function runSync(dryRun: boolean = false): Promise<SyncResult> {
  const { data, error } = await supabase.rpc('sync_valuations_to_crm', {
    p_dry_run: dryRun
  });
  
  if (error) {
    console.error('Error running sync:', error);
    throw error;
  }
  
  return data as unknown as SyncResult;
}

export async function getSyncHistory(): Promise<SyncHistoryItem[]> {
  const { data, error } = await supabase.rpc('get_sync_history');
  
  if (error) {
    console.error('Error fetching sync history:', error);
    throw error;
  }
  
  return (data || []) as SyncHistoryItem[];
}
