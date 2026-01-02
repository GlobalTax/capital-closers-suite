import { useQuery } from "@tanstack/react-query";
import { fetchMandatoActivity, fetchInactiveMandatos } from "@/services/mandatoActivity.service";

export function useMandatoActivity(mandatoId?: string) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['mandato-activity', mandatoId],
    queryFn: () => fetchMandatoActivity(mandatoId!),
    enabled: !!mandatoId,
    staleTime: 2 * 60 * 1000,
  });

  return { activities: activities || [], isLoading };
}

export function useInactiveMandatos(minDays: number = 14) {
  const { data: inactiveMandatos, isLoading } = useQuery({
    queryKey: ['inactive-mandatos', minDays],
    queryFn: () => fetchInactiveMandatos(minDays),
    staleTime: 5 * 60 * 1000,
  });

  return { 
    inactiveMandatos: inactiveMandatos || [], 
    count: inactiveMandatos?.length || 0,
    isLoading 
  };
}
