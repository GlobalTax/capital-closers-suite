import { useQuery } from "@tanstack/react-query";
import { fetchInteraccionesByContacto, fetchInteraccionesByEmpresa } from "@/services/interacciones";

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
