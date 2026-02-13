import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EnrichmentStats {
  total: number;
  enriched: number;
  pendingQueue: number;
  processingQueue: number;
  failedQueue: number;
  withSector: number;
  withDescripcion: number;
  withEmpleados: number;
  withWeb: number;
}

export function useEnrichmentDashboard() {
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["enrichment-stats"],
    queryFn: async (): Promise<EnrichmentStats> => {
      // Get empresa counts
      const { count: total } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true });

      const { count: enriched } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .not("fecha_enriquecimiento", "is", null);

      const { count: withSector } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .not("sector", "is", null);

      const { count: withDescripcion } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .not("descripcion", "is", null);

      const { count: withEmpleados } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .not("empleados", "is", null);

      const { count: withWeb } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .not("sitio_web", "is", null);

      // Queue counts
      const { count: pendingQueue } = await supabase
        .from("enrichment_queue")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", "empresa")
        .eq("status", "pending");

      const { count: processingQueue } = await supabase
        .from("enrichment_queue")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", "empresa")
        .eq("status", "processing");

      const { count: failedQueue } = await supabase
        .from("enrichment_queue")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", "empresa")
        .eq("status", "failed");

      return {
        total: total || 0,
        enriched: enriched || 0,
        pendingQueue: pendingQueue || 0,
        processingQueue: processingQueue || 0,
        failedQueue: failedQueue || 0,
        withSector: withSector || 0,
        withDescripcion: withDescripcion || 0,
        withEmpleados: withEmpleados || 0,
        withWeb: withWeb || 0,
      };
    },
    refetchInterval: 30000,
  });

  const recentQueueQuery = useQuery({
    queryKey: ["enrichment-queue-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrichment_queue")
        .select("id, entity_id, status, error_message, attempts, created_at, started_at, completed_at, result_data")
        .eq("entity_type", "empresa")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch empresa names for the queue items
      const entityIds = (data || []).map(d => d.entity_id);
      if (entityIds.length === 0) return [];

      const { data: empresas } = await supabase
        .from("empresas")
        .select("id, nombre, sitio_web, sector")
        .in("id", entityIds);

      const empresaMap = new Map((empresas || []).map(e => [e.id, e]));

      return (data || []).map(item => ({
        ...item,
        empresa: empresaMap.get(item.entity_id) || null,
      }));
    },
    refetchInterval: 30000,
  });

  const unenrichedQuery = useQuery({
    queryKey: ["empresas-unenriched"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nombre, sitio_web, sector, descripcion, empleados, fecha_enriquecimiento")
        .is("fecha_enriquecimiento", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  const launchBatchMutation = useMutation({
    mutationFn: async (params: { empresaIds?: string[]; batchSize?: number }) => {
      const { data, error } = await supabase.functions.invoke("batch-enrich-companies", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Batch completado: ${data.completed} enriquecidas, ${data.failed} fallidas, ${data.skipped} omitidas`);
      queryClient.invalidateQueries({ queryKey: ["enrichment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["enrichment-queue-recent"] });
      queryClient.invalidateQueries({ queryKey: ["empresas-unenriched"] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const queueAllMutation = useMutation({
    mutationFn: async () => {
      // Get all unenriched empresa IDs
      const { data, error } = await supabase
        .from("empresas")
        .select("id")
        .is("fecha_enriquecimiento", null)
        .limit(500);

      if (error) throw error;
      if (!data?.length) throw new Error("No hay empresas pendientes");

      // Queue them all
      const items = data.map(e => ({
        entity_type: "empresa" as const,
        entity_id: e.id,
        priority: 5,
        status: "pending" as const,
      }));

      // Insert in batches of 50
      for (let i = 0; i < items.length; i += 50) {
        const batch = items.slice(i, i + 50);
        const { error: insertError } = await supabase
          .from("enrichment_queue")
          .upsert(batch as any, { onConflict: "entity_id", ignoreDuplicates: true });
        if (insertError) console.error("Queue insert error:", insertError);
      }

      return { queued: data.length };
    },
    onSuccess: (data) => {
      toast.success(`${data.queued} empresas añadidas a la cola`);
      queryClient.invalidateQueries({ queryKey: ["enrichment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["enrichment-queue-recent"] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const retryFailedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrichment_queue")
        .update({ status: "pending", error_message: null, attempts: 0 })
        .eq("entity_type", "empresa")
        .eq("status", "failed");

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Items fallidos re-encolados");
      queryClient.invalidateQueries({ queryKey: ["enrichment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["enrichment-queue-recent"] });
    },
  });

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    recentQueue: recentQueueQuery.data || [],
    isLoadingQueue: recentQueueQuery.isLoading,
    unenriched: unenrichedQuery.data || [],
    isLoadingUnenriched: unenrichedQuery.isLoading,
    launchBatch: launchBatchMutation.mutate,
    isLaunchingBatch: launchBatchMutation.isPending,
    queueAll: queueAllMutation.mutate,
    isQueueingAll: queueAllMutation.isPending,
    retryFailed: retryFailedMutation.mutate,
    isRetrying: retryFailedMutation.isPending,
  };
}
