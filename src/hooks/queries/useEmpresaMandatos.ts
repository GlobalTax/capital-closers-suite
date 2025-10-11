import { useQuery } from "@tanstack/react-query";
import { getEmpresaMandatos, getEmpresaContactos } from "@/services/empresas";

export function useEmpresaMandatos(empresaId: string | undefined) {
  return useQuery({
    queryKey: ['mandatos', 'empresa', empresaId],
    queryFn: () => getEmpresaMandatos(empresaId!),
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmpresaContactos(empresaId: string | undefined) {
  return useQuery({
    queryKey: ['contactos', 'empresa', empresaId],
    queryFn: () => getEmpresaContactos(empresaId!),
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
  });
}
