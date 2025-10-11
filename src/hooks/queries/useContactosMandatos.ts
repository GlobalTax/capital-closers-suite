import { useQuery } from "@tanstack/react-query";
import { getContactoMandatos } from "@/services/contactos";

export function useContactoMandatos(contactoId: string | undefined) {
  return useQuery({
    queryKey: ['mandatos', 'contacto', contactoId],
    queryFn: () => getContactoMandatos(contactoId!),
    enabled: !!contactoId,
    staleTime: 5 * 60 * 1000,
  });
}
