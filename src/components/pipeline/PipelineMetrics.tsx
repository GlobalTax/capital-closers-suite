import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Clock, 
  AlertTriangle,
  Calendar,
  Percent
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PipelineMetrics as PipelineMetricsType } from "@/types/pipeline";

interface PipelineMetricsProps {
  metrics: PipelineMetricsType | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toFixed(0)}`;
};

export function PipelineMetrics({ metrics, isLoading }: PipelineMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const kpis = [
    {
      label: "Total Deals",
      value: metrics.totalDeals.toString(),
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Valor Total",
      value: formatCurrency(metrics.totalValue),
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Valor Ponderado",
      value: formatCurrency(metrics.weightedValue),
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      subtitle: "Valor × Probabilidad",
    },
    {
      label: "Conversión",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Cierre Este Mes",
      value: metrics.closingThisMonth.toString(),
      icon: Calendar,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: "Cierre Este Q",
      value: metrics.closingThisQuarter.toString(),
      icon: Calendar,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      label: "Estancados",
      value: metrics.stuckDeals.toString(),
      icon: AlertTriangle,
      color: metrics.stuckDeals > 0 ? "text-red-500" : "text-muted-foreground",
      bgColor: metrics.stuckDeals > 0 ? "bg-red-500/10" : "bg-muted",
      subtitle: "> 30 días sin actividad",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {kpis.map((kpi) => (
        <Card 
          key={kpi.label} 
          className="border-border/50 hover:shadow-md transition-shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${kpi.bgColor}`}>
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {kpi.label}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
            {kpi.subtitle && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {kpi.subtitle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
