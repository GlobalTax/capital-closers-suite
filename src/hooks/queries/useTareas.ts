import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTareas, getTareaById, createTarea, updateTarea, deleteTarea } from "@/services/tareas";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import type { Tarea } from "@/types";

export function useTareas() {
  return useQuery({
    queryKey: ['tareas'],
    queryFn: fetchTareas,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTarea(id: string | undefined) {
  return useQuery({
    queryKey: ['tareas', id],
    queryFn: () => getTareaById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTarea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTarea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success("Tarea creada exitosamente");
    },
    onError: (error) => {
      handleError(error, "Error al crear tarea");
    },
  });
}

export function useUpdateTarea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tarea> }) => 
      updateTarea(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tareas', id] });
      const previousData = queryClient.getQueryData(['tareas', id]);
      
      queryClient.setQueryData(['tareas', id], (old: Tarea | undefined) => 
        old ? { ...old, ...data } : old
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['tareas', _variables.id], context.previousData);
      }
      handleError(error, "Error al actualizar tarea");
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      queryClient.invalidateQueries({ queryKey: ['tareas', variables.id] });
      toast.success("Tarea actualizada exitosamente");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tareas', variables.id] });
    },
  });
}

export function useDeleteTarea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTarea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas'] });
      toast.success("Tarea eliminada exitosamente");
    },
    onError: (error) => {
      handleError(error, "Error al eliminar tarea");
    },
  });
}
