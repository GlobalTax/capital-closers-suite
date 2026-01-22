import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { 
  fetchActiveWorkTaskTypes, 
  fetchAllWorkTaskTypes, 
  createWorkTaskType, 
  updateWorkTaskType, 
  toggleWorkTaskTypeActive,
  reorderWorkTaskTypes,
  type WorkTaskType,
  type WorkTaskTypeContext,
  type CreateWorkTaskTypeData,
  type UpdateWorkTaskTypeData
} from "@/services/workTaskTypes.service";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";

const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

export function useActiveWorkTaskTypes() {
  return useQuery({
    queryKey: ['workTaskTypes', 'active'],
    queryFn: fetchActiveWorkTaskTypes,
    staleTime: 10 * 60 * 1000, // Cache 10 minutos
  });
}

export function useAllWorkTaskTypes() {
  return useQuery({
    queryKey: ['workTaskTypes', 'all'],
    queryFn: fetchAllWorkTaskTypes,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook that returns work task types filtered by context based on the selected mandato.
 * - For Prospección project: returns 'prospection' + 'all' context types
 * - For regular mandatos: returns 'mandate' + 'all' context types
 */
export function useFilteredWorkTaskTypes(mandatoId: string | null) {
  const { data: workTaskTypes = [], isLoading } = useActiveWorkTaskTypes();
  
  const isProspeccionProject = mandatoId === PROSPECCION_PROJECT_ID;
  
  const filteredTypes = useMemo(() => {
    if (isProspeccionProject) {
      // For Prospección: show 'prospection' and 'all' context types
      return workTaskTypes.filter(t => 
        t.context === 'prospection' || t.context === 'all'
      );
    }
    // For regular mandatos: show 'mandate' and 'all' context types
    return workTaskTypes.filter(t => 
      t.context === 'mandate' || t.context === 'all'
    );
  }, [workTaskTypes, isProspeccionProject]);
  
  return { data: filteredTypes, isLoading };
}

export function useCreateWorkTaskType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkTaskType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workTaskTypes'] });
      toast.success("Tipo de tarea creado exitosamente");
    },
    onError: (error) => {
      handleError(error, "Error al crear tipo de tarea");
    },
  });
}

export function useUpdateWorkTaskType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkTaskTypeData }) => 
      updateWorkTaskType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workTaskTypes'] });
      toast.success("Tipo de tarea actualizado");
    },
    onError: (error) => {
      handleError(error, "Error al actualizar tipo de tarea");
    },
  });
}

export function useToggleWorkTaskTypeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      toggleWorkTaskTypeActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workTaskTypes'] });
      toast.success(variables.isActive ? "Tipo de tarea activado" : "Tipo de tarea desactivado");
    },
    onError: (error) => {
      handleError(error, "Error al cambiar estado del tipo de tarea");
    },
  });
}

export function useReorderWorkTaskTypes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderWorkTaskTypes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workTaskTypes'] });
      toast.success("Orden actualizado");
    },
    onError: (error) => {
      handleError(error, "Error al reordenar tipos de tarea");
    },
  });
}

export type { WorkTaskType, WorkTaskTypeContext, CreateWorkTaskTypeData, UpdateWorkTaskTypeData };
