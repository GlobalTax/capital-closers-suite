import { useQuery } from "@tanstack/react-query";
import { fetchWinLossMetrics, type WinLossMetrics } from "@/services/winLossAnalytics.service";

export function useWinLossMetrics() {
  return useQuery<WinLossMetrics>({
    queryKey: ["winloss-metrics"],
    queryFn: fetchWinLossMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
