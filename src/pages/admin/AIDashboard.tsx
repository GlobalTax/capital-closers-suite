import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useAIDashboard, type DateRange } from "@/hooks/queries/useAIDashboard";
import { AIKPICards } from "@/components/ai-dashboard/AIKPICards";
import { AIUsageChart } from "@/components/ai-dashboard/AIUsageChart";
import { AIModuleBreakdown } from "@/components/ai-dashboard/AIModuleBreakdown";
import { AIActivityTimeline } from "@/components/ai-dashboard/AIActivityTimeline";

const ranges: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "all", label: "Todo" },
];

export default function AIDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const { kpis, isLoadingKPIs, modules, isLoadingModules, models, isLoadingModels, timeSeries, isLoadingTimeSeries, recent, isLoadingRecent } = useAIDashboard(dateRange);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Dashboard de IA
          </h1>
          <p className="text-muted-foreground">Métricas de uso, tokens, costos y actividad</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {ranges.map(r => (
            <Button
              key={r.value}
              variant={dateRange === r.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      <AIKPICards kpis={kpis} isLoading={isLoadingKPIs} />
      <AIUsageChart data={timeSeries} isLoading={isLoadingTimeSeries} />
      <AIModuleBreakdown modules={modules} models={models} isLoading={isLoadingModules || isLoadingModels} />
      <AIActivityTimeline data={recent} isLoading={isLoadingRecent} />
    </div>
  );
}
