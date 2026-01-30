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
  type TimeEntryValueType,
  type CreateWorkTaskTypeData,
  type UpdateWorkTaskTypeData
} from "@/services/workTaskTypes.service";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";

const PROSPECCION_PROJECT_ID = '00000000-0000-0000-0000-000000000004';

// Internal projects (excluding Prospección which has its own context)
const INTERNAL_PROJECT_IDS = [
  '00000000-0000-0000-0000-000000000001', // Business Development
  '00000000-0000-0000-0000-000000000002', // Reuniones Internas
  '00000000-0000-0000-0000-000000000003', // Administrativo
];

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
 * - For internal projects (BD, Meetings, Admin): returns 'internal' + 'all' context types
 * - For regular mandatos: returns 'mandate' + 'all' context types
 * - No mandato selected: returns only 'all' context types
 */
export function useFilteredWorkTaskTypes(mandatoId: string | null) {
  const { data: workTaskTypes = [], isLoading } = useActiveWorkTaskTypes();
  
  const filteredTypes = useMemo(() => {
    if (!mandatoId) {
      // No mandato selected: show only 'all'
      return workTaskTypes.filter(t => t.context === 'all');
    }
    
    if (mandatoId === PROSPECCION_PROJECT_ID) {
      // Prospección: show 'prospection' + 'all' context types
      return workTaskTypes.filter(t => 
        t.context === 'prospection' || t.context === 'all'
      );
    }
    
    if (INTERNAL_PROJECT_IDS.includes(mandatoId)) {
      // Internal projects: show only 'all' context types (no specific internal types)
      return workTaskTypes.filter(t => t.context === 'all');
    }
    
    // Regular mandatos: show 'mandate' + 'all' context types
    return workTaskTypes.filter(t => 
      t.context === 'mandate' || t.context === 'all'
    );
  }, [workTaskTypes, mandatoId]);
  
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

export type { WorkTaskType, WorkTaskTypeContext, TimeEntryValueType, CreateWorkTaskTypeData, UpdateWorkTaskTypeData };
