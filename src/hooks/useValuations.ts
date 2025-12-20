import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEmpresaValuations,
  fetchSectorMultiples,
  getSectorMultiple,
  linkValuationToEmpresa,
  unlinkValuationFromEmpresa,
  searchValuations,
  type CompanyValuation,
  type SectorMultiple,
} from "@/services/valuations.service";
import { toast } from "sonner";

export function useEmpresaValuations(empresaId?: string, cif?: string, nombre?: string) {
  return useQuery({
    queryKey: ["empresa-valuations", empresaId, cif, nombre],
    queryFn: () => fetchEmpresaValuations(empresaId!, cif, nombre),
    enabled: !!empresaId,
  });
}

export function useSectorMultiples() {
  return useQuery({
    queryKey: ["sector-multiples"],
    queryFn: fetchSectorMultiples,
    staleTime: 1000 * 60 * 30, // 30 minutes - this data rarely changes
  });
}

export function useSectorMultiple(sectorName?: string) {
  return useQuery({
    queryKey: ["sector-multiple", sectorName],
    queryFn: () => getSectorMultiple(sectorName!),
    enabled: !!sectorName,
    staleTime: 1000 * 60 * 30,
  });
}

export function useSearchValuations(query: string) {
  return useQuery({
    queryKey: ["search-valuations", query],
    queryFn: () => searchValuations(query),
    enabled: query.length >= 2,
  });
}

export function useLinkValuation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ valuationId, empresaId }: { valuationId: string; empresaId: string }) =>
      linkValuationToEmpresa(valuationId, empresaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-valuations"] });
      toast.success("Valoración vinculada correctamente");
    },
    onError: () => {
      toast.error("Error al vincular la valoración");
    },
  });
}

export function useUnlinkValuation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (valuationId: string) => unlinkValuationFromEmpresa(valuationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa-valuations"] });
      toast.success("Valoración desvinculada");
    },
    onError: () => {
      toast.error("Error al desvincular la valoración");
    },
  });
}
