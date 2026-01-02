import { useMemo } from "react";
import { useActiveAlerts } from "./useAlerts";
import type { ActiveAlert } from "@/types/alerts";

export interface AgingAlert extends ActiveAlert {
  daysValue: number;
}

export interface AgingAlertsSummary {
  stuckDeals: AgingAlert[];
  inactiveDeals: AgingAlert[];
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  top5: AgingAlert[];
}

export function useAgingAlerts() {
  const { data: allAlerts, isLoading, error } = useActiveAlerts();

  const summary = useMemo<AgingAlertsSummary>(() => {
    if (!allAlerts) {
      return {
        stuckDeals: [],
        inactiveDeals: [],
        totalCount: 0,
        criticalCount: 0,
        warningCount: 0,
        top5: [],
      };
    }

    const stuckDeals = allAlerts
      .filter(a => a.alert_type === 'stuck_deal')
      .map(a => ({
        ...a,
        daysValue: a.metadata?.days_in_stage || 0,
      }))
      .sort((a, b) => b.daysValue - a.daysValue);

    const inactiveDeals = allAlerts
      .filter(a => a.alert_type === 'inactive_mandate')
      .map(a => ({
        ...a,
        daysValue: a.metadata?.days_inactive || 0,
      }))
      .sort((a, b) => b.daysValue - a.daysValue);

    const combined = [...stuckDeals, ...inactiveDeals];
    const criticalCount = combined.filter(a => a.severity === 'critical').length;
    const warningCount = combined.filter(a => a.severity === 'warning').length;

    const top5 = combined
      .sort((a, b) => b.daysValue - a.daysValue)
      .slice(0, 5);

    return {
      stuckDeals,
      inactiveDeals,
      totalCount: combined.length,
      criticalCount,
      warningCount,
      top5,
    };
  }, [allAlerts]);

  return {
    ...summary,
    isLoading,
    error,
    hasAlerts: summary.totalCount > 0,
  };
}
