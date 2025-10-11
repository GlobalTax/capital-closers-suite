import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchEmpresas, 
  getEmpresaById, 
  createEmpresa, 
  updateEmpresa, 
  deleteEmpresa 
} from "@/services/empresas";
import type { Empresa } from "@/types";
import { handleError } from "@/lib/error-handler";
import { toast } from "@/hooks/use-toast";

/**
 * Hook para obtener todas las empresas
 */
export function useEmpresas(esTarget?: boolean) {
  return useQuery({
    queryKey: ['empresas', { esTarget }],
    queryFn: () => fetchEmpresas(esTarget),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener una empresa específica
 */
export function useEmpresa(id: string | undefined) {
  return useQuery({
    queryKey: ['empresas', id],
    queryFn: () => getEmpresaById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear empresa
 */
export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Empresa>) => createEmpresa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast({
        title: "Éxito",
        description: "Empresa creada correctamente",
      });
    },
    onError: (error) => handleError(error, 'Creación de empresa'),
  });
}

/**
 * Hook para actualizar empresa con optimistic updates
 */
export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Empresa> }) =>
      updateEmpresa(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['empresas', id] });
      const previous = queryClient.getQueryData(['empresas', id]);

      queryClient.setQueryData(['empresas', id], (old: any) => ({
        ...old,
        ...data,
      }));

      return { previous };
    },
    
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['empresas', id] });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast({
        title: "Éxito",
        description: "Empresa actualizada correctamente",
      });
    },
    
    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['empresas', id], context.previous);
      }
      handleError(error, 'Actualización de empresa');
    },
    
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['empresas', id] });
    },
  });
}

/**
 * Hook para eliminar empresa
 */
export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEmpresa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast({
        title: "Éxito",
        description: "Empresa eliminada correctamente",
      });
    },
    onError: (error) => handleError(error, 'Eliminación de empresa'),
  });
}
