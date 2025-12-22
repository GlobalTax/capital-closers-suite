import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSyncStats, runSync, getSyncHistory } from "@/services/syncValuations.service";
import { toast } from "sonner";

export function useSyncStats() {
  return useQuery({
    queryKey: ["sync-stats"],
    queryFn: getSyncStats,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useSyncHistory() {
  return useQuery({
    queryKey: ["sync-history"],
    queryFn: getSyncHistory,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useRunSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dryRun: boolean = false) => runSync(dryRun),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sync-stats"] });
      queryClient.invalidateQueries({ queryKey: ["sync-history"] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      queryClient.invalidateQueries({ queryKey: ["contactos"] });
      
      if (data.dry_run) {
        toast.info("Simulación completada", {
          description: `Se crearían ${data.empresas_created} empresas y ${data.contactos_created} contactos`,
        });
      } else {
        toast.success("Sincronización completada", {
          description: `Creados: ${data.empresas_created} empresas, ${data.contactos_created} contactos`,
        });
      }
    },
    onError: (error) => {
      toast.error("Error en la sincronización", {
        description: error instanceof Error ? error.message : "Error desconocido",
      });
    },
  });
}
