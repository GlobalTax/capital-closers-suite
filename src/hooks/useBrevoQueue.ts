import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QueueFilters {
  entityType: 'all' | 'contact' | 'company' | 'deal';
  status: 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  errorSearch: string;
}

export interface QueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  payload: unknown;
  status: string;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  next_retry_at: string | null;
  priority: number;
}

export interface QueueItemWithEntity extends QueueItem {
  entityName?: string;
}

export function useBrevoQueue(filters: QueueFilters, page: number, pageSize = 50) {
  return useQuery({
    queryKey: ['brevo-queue', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('brevo_sync_queue')
        .select('*', { count: 'exact' });

      if (filters.entityType !== 'all') {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.errorSearch.trim()) {
        query = query.ilike('error_message', `%${filters.errorSearch}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      // Enrich with entity names
      const enrichedItems = await enrichQueueItems(data || []);

      return {
        items: enrichedItems,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    refetchInterval: 15000,
  });
}

async function enrichQueueItems(items: QueueItem[]): Promise<QueueItemWithEntity[]> {
  if (items.length === 0) return [];

  const contactIds = items.filter(i => i.entity_type === 'contact').map(i => i.entity_id);
  const companyIds = items.filter(i => i.entity_type === 'company').map(i => i.entity_id);
  const dealIds = items.filter(i => i.entity_type === 'deal').map(i => i.entity_id);

  const [contactsRes, companiesRes, dealsRes] = await Promise.all([
    contactIds.length > 0
      ? supabase.from('contactos').select('id, nombre').in('id', contactIds)
      : Promise.resolve({ data: [] }),
    companyIds.length > 0
      ? supabase.from('empresas').select('id, nombre').in('id', companyIds)
      : Promise.resolve({ data: [] }),
    dealIds.length > 0
      ? supabase.from('mandatos').select('id, codigo').in('id', dealIds)
      : Promise.resolve({ data: [] }),
  ]);

  const contactMap = new Map((contactsRes.data || []).map(c => [c.id, c.nombre]));
  const companyMap = new Map((companiesRes.data || []).map(c => [c.id, c.nombre]));
  const dealMap = new Map((dealsRes.data || []).map(d => [d.id, d.codigo]));

  return items.map(item => ({
    ...item,
    entityName: 
      item.entity_type === 'contact' ? contactMap.get(item.entity_id) :
      item.entity_type === 'company' ? companyMap.get(item.entity_id) :
      item.entity_type === 'deal' ? dealMap.get(item.entity_id) :
      undefined,
  }));
}

export function useQueueItem(itemId: string | null) {
  return useQuery({
    queryKey: ['brevo-queue-item', itemId],
    queryFn: async () => {
      if (!itemId) return null;
      
      const { data, error } = await supabase
        .from('brevo_sync_queue')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      
      const enriched = await enrichQueueItems([data]);
      return enriched[0];
    },
    enabled: !!itemId,
  });
}

export function useRetryQueueItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('brevo_sync_queue')
        .update({
          status: 'pending',
          attempts: 0,
          error_message: null,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brevo-queue'] });
      queryClient.invalidateQueries({ queryKey: ['brevo-queue-stats'] });
      toast.success('Item marcado para reintento');
    },
    onError: (error) => {
      toast.error('Error al reintentar: ' + error.message);
    },
  });
}

export function useIgnoreQueueItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('brevo_sync_queue')
        .update({
          status: 'skipped',
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brevo-queue'] });
      queryClient.invalidateQueries({ queryKey: ['brevo-queue-stats'] });
      toast.success('Item ignorado');
    },
    onError: (error) => {
      toast.error('Error al ignorar: ' + error.message);
    },
  });
}

export function useBulkIgnoreByError() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (errorPattern: string) => {
      const { data, error } = await supabase
        .from('brevo_sync_queue')
        .update({ status: 'skipped' })
        .eq('status', 'failed')
        .ilike('error_message', `%${errorPattern}%`)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['brevo-queue'] });
      queryClient.invalidateQueries({ queryKey: ['brevo-queue-stats'] });
      toast.success(`${count} items ignorados`);
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useBulkRetryByType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entityType: 'contact' | 'company' | 'deal') => {
      const { data, error } = await supabase
        .from('brevo_sync_queue')
        .update({
          status: 'pending',
          attempts: 0,
          error_message: null,
        })
        .eq('status', 'failed')
        .eq('entity_type', entityType)
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['brevo-queue'] });
      queryClient.invalidateQueries({ queryKey: ['brevo-queue-stats'] });
      toast.success(`${count} items marcados para reintento`);
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useCleanOldCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (daysOld: number = 7) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('brevo_sync_queue')
        .delete()
        .eq('status', 'completed')
        .lt('processed_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['brevo-queue'] });
      queryClient.invalidateQueries({ queryKey: ['brevo-queue-stats'] });
      toast.success(`${count} items antiguos eliminados`);
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useErrorStats() {
  return useQuery({
    queryKey: ['brevo-error-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brevo_sync_queue')
        .select('error_message, entity_type')
        .eq('status', 'failed')
        .not('error_message', 'is', null);

      if (error) throw error;

      // Group by error message
      const errorGroups: Record<string, { count: number; entityTypes: Set<string> }> = {};
      
      data?.forEach(item => {
        const key = item.error_message || 'Unknown';
        if (!errorGroups[key]) {
          errorGroups[key] = { count: 0, entityTypes: new Set() };
        }
        errorGroups[key].count++;
        errorGroups[key].entityTypes.add(item.entity_type);
      });

      return Object.entries(errorGroups)
        .map(([message, stats]) => ({
          message,
          count: stats.count,
          entityTypes: Array.from(stats.entityTypes),
        }))
        .sort((a, b) => b.count - a.count);
    },
    refetchInterval: 30000,
  });
}
