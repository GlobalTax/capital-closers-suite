import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMandatos, fetchServicios, getMandatoById, createMandato, updateMandato, deleteMandato } from "@/services/mandatos";
import type { Mandato } from "@/types";
import { handleError } from "@/lib/error-handler";
import { toast } from "@/hooks/use-toast";

export function useMandatos() {
  return useQuery({
    queryKey: ['mandatos'],
    queryFn: fetchMandatos,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useServicios() {
  return useQuery({
    queryKey: ['servicios'],
    queryFn: fetchServicios,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useMandato(id: string | undefined) {
  return useQuery({
    queryKey: ['mandatos', id],
    queryFn: () => getMandatoById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMandato() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Mandato>) => createMandato(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandatos'] });
      toast({
        title: "Éxito",
        description: "Mandato creado correctamente",
      });
    },
    onError: (error) => handleError(error, 'Creación de mandato'),
  });
}

export function useUpdateMandato() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Mandato> }) =>
      updateMandato(id, data),
    onMutate: async ({ id, data }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['mandatos', id] });
      
      // Guardar valor anterior para rollback
      const previous = queryClient.getQueryData(['mandatos', id]);
      
      // Optimistic update
      queryClient.setQueryData(['mandatos', id], (old: any) => ({
        ...old,
        ...data,
      }));
      
      return { previous };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['mandatos', id] });
      queryClient.invalidateQueries({ queryKey: ['mandatos'] });
      toast({
        title: "Éxito",
        description: "Mandato actualizado correctamente",
      });
    },
    onError: (error, { id }, context) => {
      // Rollback en caso de error
      if (context?.previous) {
        queryClient.setQueryData(['mandatos', id], context.previous);
      }
      handleError(error, 'Actualización de mandato');
    },
    onSettled: () => {
      // invalidation already handled in onSuccess/onError
    },
  });
}

export function useDeleteMandato() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteMandato(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandatos'] });
      toast({
        title: "Éxito",
        description: "Mandato eliminado correctamente",
      });
    },
    onError: (error) => handleError(error, 'Eliminación de mandato'),
  });
}
