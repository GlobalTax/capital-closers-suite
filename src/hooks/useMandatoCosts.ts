import { useQuery } from "@tanstack/react-query";
import { 
  fetchMandatoCosts, 
  fetchTopMandatosByCost, 
  fetchBillingRates,
  fetchTotalCostMetrics 
} from "@/services/mandatoCosts.service";

export function useMandatoCosts(mandatoId?: string) {
  return useQuery({
    queryKey: ['mandato-costs', mandatoId],
    queryFn: () => fetchMandatoCosts(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTopMandatosByCost(limit = 10) {
  return useQuery({
    queryKey: ['top-mandatos-cost', limit],
    queryFn: () => fetchTopMandatosByCost(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBillingRates() {
  return useQuery({
    queryKey: ['billing-rates'],
    queryFn: fetchBillingRates,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useTotalCostMetrics() {
  return useQuery({
    queryKey: ['total-cost-metrics'],
    queryFn: fetchTotalCostMetrics,
    staleTime: 1000 * 60 * 5,
  });
}
