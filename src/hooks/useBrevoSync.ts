import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SyncStatus {
  contactos: { total: number; synced: number; pending: number };
  empresas: { total: number; synced: number; pending: number };
  mandatos: { total: number; synced: number; pending: number };
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface SyncLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  sync_type: string;
  sync_status: string;
  sync_error: string | null;
  brevo_id: string | null;
  created_at: string;
  last_sync_at: string | null;
}

interface BulkSyncResult {
  contactos: { total: number; synced: number; errors: number };
  empresas: { total: number; synced: number; errors: number };
  mandatos: { total: number; synced: number; errors: number };
  errors: string[];
}

export function useBrevoSyncStatus() {
  return useQuery({
    queryKey: ["brevo-sync-status"],
    queryFn: async (): Promise<SyncStatus> => {
      // Get contactos stats
      const { count: totalContactos } = await supabase
        .from("contactos")
        .select("*", { count: "exact", head: true });
      
      const { count: syncedContactos } = await supabase
        .from("contactos")
        .select("*", { count: "exact", head: true })
        .not("brevo_id", "is", null);

      // Get empresas stats
      const { count: totalEmpresas } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true });
      
      const { count: syncedEmpresas } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .not("brevo_id", "is", null);

      // Get mandatos stats
      const { count: totalMandatos } = await supabase
        .from("mandatos")
        .select("*", { count: "exact", head: true });
      
      const { count: syncedMandatos } = await supabase
        .from("mandatos")
        .select("*", { count: "exact", head: true })
        .not("brevo_deal_id", "is", null);

      return {
        contactos: {
          total: totalContactos || 0,
          synced: syncedContactos || 0,
          pending: (totalContactos || 0) - (syncedContactos || 0),
        },
        empresas: {
          total: totalEmpresas || 0,
          synced: syncedEmpresas || 0,
          pending: (totalEmpresas || 0) - (syncedEmpresas || 0),
        },
        mandatos: {
          total: totalMandatos || 0,
          synced: syncedMandatos || 0,
          pending: (totalMandatos || 0) - (syncedMandatos || 0),
        },
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useBrevoQueueStats() {
  return useQuery({
    queryKey: ["brevo-queue-stats"],
    queryFn: async (): Promise<QueueStats> => {
      const { data, error } = await supabase
        .from("brevo_sync_queue")
        .select("status");

      if (error) throw error;

      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };

      data?.forEach((item) => {
        if (item.status in stats) {
          stats[item.status as keyof QueueStats]++;
        }
      });

      return stats;
    },
    refetchInterval: 10000,
  });
}

export function useBrevoSyncLogs(limit = 50) {
  return useQuery({
    queryKey: ["brevo-sync-logs", limit],
    queryFn: async (): Promise<SyncLogEntry[]> => {
      const { data, error } = await supabase
        .from("brevo_sync_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });
}

export function useBulkSyncToBrevo() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<{
    running: boolean;
    current: number;
    total: number;
    phase: string;
  }>({
    running: false,
    current: 0,
    total: 0,
    phase: "",
  });

  const mutation = useMutation({
    mutationFn: async (entityType: "all" | "contacts" | "companies" | "deals" = "all") => {
      setProgress({ running: true, current: 0, total: 100, phase: "Iniciando..." });

      const { data, error } = await supabase.functions.invoke("sync-bulk-to-brevo", {
        body: { entityType, batchSize: 50 },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      return data.result as BulkSyncResult;
    },
    onSuccess: (result) => {
      setProgress({ running: false, current: 0, total: 0, phase: "" });
      queryClient.invalidateQueries({ queryKey: ["brevo-sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["brevo-sync-logs"] });

      const totalSynced = result.contactos.synced + result.empresas.synced + result.mandatos.synced;
      const totalErrors = result.contactos.errors + result.empresas.errors + result.mandatos.errors;

      toast({
        title: "Sincronización completada",
        description: `${totalSynced} elementos sincronizados${totalErrors > 0 ? `, ${totalErrors} errores` : ""}`,
      });
    },
    onError: (error) => {
      setProgress({ running: false, current: 0, total: 0, phase: "" });
      toast({
        title: "Error en sincronización",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    syncToBrevo: mutation.mutate,
    isLoading: mutation.isPending,
    progress,
    result: mutation.data,
    error: mutation.error,
  };
}

export function useSyncFromBrevo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-from-brevo", {
        body: {},
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);

      return data.result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["brevo-sync-status"] });
      queryClient.invalidateQueries({ queryKey: ["brevo-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["contactos"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });

      toast({
        title: "Importación completada",
        description: `${result.contactos_created} contactos creados, ${result.contactos_updated} actualizados`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error en importación",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useProcessBrevoQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("process-brevo-queue", {
        body: {},
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["brevo-queue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["brevo-sync-status"] });

      if (result.succeeded > 0 || result.failed > 0) {
        toast({
          title: "Cola procesada",
          description: `${result.succeeded} exitosos, ${result.failed} errores`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error procesando cola",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRetryFailedSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entityType?: string) => {
      const { data, error } = await supabase.rpc("retry_failed_brevo_sync", {
        p_entity_type: entityType || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["brevo-queue-stats"] });
      toast({
        title: "Reintentos programados",
        description: `${count} elementos marcados para reintento`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
