import { useQuery } from "@tanstack/react-query";
import * as pshService from "@/services/psh.service";

export function usePSHPlantillas() {
  return useQuery({
    queryKey: ["psh-plantillas"],
    queryFn: pshService.getPSHPlantillas,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePSHPlantilla(id: string | undefined) {
  return useQuery({
    queryKey: ["psh-plantilla", id],
    queryFn: () => pshService.getPSHPlantillaById(id!),
    enabled: !!id,
  });
}

export function usePSHPlantillasByTipo(tipo: string | undefined) {
  return useQuery({
    queryKey: ["psh-plantillas", tipo],
    queryFn: () => pshService.getPSHPlantillaByTipo(tipo!),
    enabled: !!tipo,
  });
}
