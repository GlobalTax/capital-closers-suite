import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchContactos, fetchContactosPaginated, searchContactosPaginated, getContactoById, createContacto, updateContacto, deleteContacto } from "@/services/contactos";
import type { Contacto } from "@/types";
import { handleError } from "@/lib/error-handler";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_PAGE_SIZE } from "@/types/pagination";

export function useContactos() {
  return useQuery({
    queryKey: ['contactos'],
    queryFn: fetchContactos,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener contactos con paginación server-side
 */
export function useContactosPaginated(page: number = 1, pageSize: number = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['contactos', 'paginated', page, pageSize],
    queryFn: () => fetchContactosPaginated(page, pageSize),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook para búsqueda paginada server-side de contactos
 */
export function useContactosSearchPaginated(query: string, page: number = 1, pageSize: number = DEFAULT_PAGE_SIZE) {
  return useQuery({
    queryKey: ['contactos', 'search', query, page, pageSize],
    queryFn: () => searchContactosPaginated(query, page, pageSize),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useContacto(id: string | undefined) {
  return useQuery({
    queryKey: ['contactos', id],
    queryFn: () => getContactoById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateContacto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Contacto>) => createContacto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      toast({
        title: "Éxito",
        description: "Contacto creado correctamente",
      });
    },
    onError: (error) => handleError(error, 'Creación de contacto'),
  });
}

export function useUpdateContacto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contacto> }) =>
      updateContacto(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['contactos', id] });
      const previous = queryClient.getQueryData(['contactos', id]);
      
      queryClient.setQueryData(['contactos', id], (old: any) =>
        old ? { ...old, ...data } : old
      );
      
      return { previous };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contactos', id] });
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      toast({
        title: "Éxito",
        description: "Contacto actualizado correctamente",
      });
    },
    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['contactos', id], context.previous);
      }
      handleError(error, 'Actualización de contacto');
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contactos', id] });
    },
  });
}

export function useDeleteContacto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteContacto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactos'] });
      toast({
        title: "Éxito",
        description: "Contacto eliminado correctamente",
      });
    },
    onError: (error) => handleError(error, 'Eliminación de contacto'),
  });
}
