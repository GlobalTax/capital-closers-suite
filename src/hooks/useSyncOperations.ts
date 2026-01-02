import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  triggerOperationsSync, 
  getSyncStats, 
  getSyncHistory,
  SyncResponse,
  SyncStats,
  SyncLogEntry
} from "@/services/syncOperations.service";
import { toast } from "@/hooks/use-toast";

export function useSyncStats() {
  return useQuery<SyncStats>({
    queryKey: ['sync-operations', 'stats'],
    queryFn: getSyncStats,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSyncHistory(limit = 20) {
  return useQuery<SyncLogEntry[]>({
    queryKey: ['sync-operations', 'history', limit],
    queryFn: () => getSyncHistory(limit),
    staleTime: 30 * 1000,
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  
  return useMutation<SyncResponse, Error, boolean>({
    mutationFn: (dryRun: boolean) => triggerOperationsSync(dryRun),
    onSuccess: (data, dryRun) => {
      queryClient.invalidateQueries({ queryKey: ['sync-operations'] });
      queryClient.invalidateQueries({ queryKey: ['mandatos'] });
      
      if (dryRun) {
        toast({
          title: "Simulación completada",
          description: `Se procesarían ${data.result.operationsProcessed} operaciones: ${data.result.mandatosCreated} a crear, ${data.result.mandatosUpdated} a actualizar.`,
        });
      } else {
        toast({
          title: "Sincronización completada",
          description: `${data.result.mandatosCreated} mandatos creados, ${data.result.mandatosUpdated} actualizados.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error en sincronización",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
