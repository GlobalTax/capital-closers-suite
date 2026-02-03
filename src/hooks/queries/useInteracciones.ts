import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchInteraccionesByContacto, 
  fetchInteraccionesByEmpresa,
  fetchInteraccionesByMandatoTarget,
  updateInteraccion,
  deleteInteraccion,
  type Interaccion
} from "@/services/interacciones";

export function useContactoInteracciones(contactoId: string | undefined) {
  return useQuery({
    queryKey: ['interacciones', 'contacto', contactoId],
    queryFn: () => fetchInteraccionesByContacto(contactoId!),
    enabled: !!contactoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmpresaInteracciones(empresaId: string | undefined) {
  return useQuery({
    queryKey: ['interacciones', 'empresa', empresaId],
    queryFn: () => fetchInteraccionesByEmpresa(empresaId!),
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
  });
}

// NUEVO: Hook para interacciones aisladas por mandato + empresa
export function useMandatoTargetInteracciones(mandatoId: string | undefined, empresaId: string | undefined) {
  return useQuery({
    queryKey: ['interacciones', 'mandato-target', mandatoId, empresaId],
    queryFn: () => fetchInteraccionesByMandatoTarget(mandatoId!, empresaId!),
    enabled: !!mandatoId && !!empresaId,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations para CRUD
export function useUpdateInteraccion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Interaccion> }) => 
      updateInteraccion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interacciones'] });
    },
  });
}

export function useDeleteInteraccion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteInteraccion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interacciones'] });
    },
  });
}
