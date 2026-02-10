import { supabase } from "@/integrations/supabase/client";
import { DatabaseError } from "@/lib/error-handler";

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  changed_fields: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditFilters {
  table_name?: string;
  action?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AuditStats {
  totalOperations: number;
  byTable: Record<string, number>;
  byAction: Record<string, number>;
  byDay: Record<string, number>;
}

export async function fetchAuditLogs(
  filters: AuditFilters = {},
  page: number = 1,
  limit: number = 50
) {
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.table_name) {
    query = query.eq('table_name', filters.table_name);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters.search) {
    query = query.or(`user_email.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%`);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new DatabaseError('Error al obtener audit logs', { supabaseError: error, table: 'audit_logs' });

  return {
    logs: data as AuditLog[],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

export async function getAuditStats(): Promise<AuditStats> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('table_name, action, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(5000);

  if (error) throw new DatabaseError('Error al obtener estadísticas de audit', { supabaseError: error, table: 'audit_logs' });

  const stats: AuditStats = {
    totalOperations: data.length,
    byTable: {},
    byAction: {},
    byDay: {}
  };

  data.forEach(log => {
    stats.byTable[log.table_name] = (stats.byTable[log.table_name] || 0) + 1;
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    
    const day = log.created_at.split('T')[0];
    stats.byDay[day] = (stats.byDay[day] || 0) + 1;
  });

  return stats;
}

export async function getRecordHistory(tableName: string, recordId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new DatabaseError('Error al obtener historial', { supabaseError: error, table: 'audit_logs' });
  return data as AuditLog[];
}
