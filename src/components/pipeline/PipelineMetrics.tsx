import { 
  Target, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Calendar,
  Percent,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  // Primary KPIs - larger cards
  const primaryKpis = [
    {
      label: "Total Deals",
      value: metrics.totalDeals.toString(),
      icon: Target,
      gradient: "from-blue-500/20 to-blue-600/5",
      iconBg: "bg-blue-500",
      trend: metrics.closingThisMonth > 0 ? `${metrics.closingThisMonth} este mes` : undefined,
    },
    {
      label: "Valor Total Pipeline",
      value: formatCurrency(metrics.totalValue),
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      iconBg: "bg-emerald-500",
      trend: undefined,
    },
    {
      label: "Valor Ponderado",
      value: formatCurrency(metrics.weightedValue),
      subtitle: "Probabilidad × Valor",
      icon: TrendingUp,
      gradient: "from-purple-500/20 to-purple-600/5",
      iconBg: "bg-purple-500",
      trend: metrics.weightedValue > 0 
        ? `${((metrics.weightedValue / Math.max(metrics.totalValue, 1)) * 100).toFixed(0)}% del total`
        : undefined,
    },
  ];

  // Secondary KPIs - smaller cards
  const secondaryKpis = [
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
      label: "Este Trimestre",
      value: metrics.closingThisQuarter.toString(),
      icon: Clock,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      label: "Estancados",
      value: metrics.stuckDeals.toString(),
      icon: AlertTriangle,
      color: metrics.stuckDeals > 0 ? "text-destructive" : "text-muted-foreground",
      bgColor: metrics.stuckDeals > 0 ? "bg-destructive/10" : "bg-muted",
      alert: metrics.stuckDeals > 0,
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {primaryKpis.map((kpi, index) => (
          <Card 
            key={kpi.label} 
            className={cn(
              "relative overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300",
              "bg-gradient-to-br",
              kpi.gradient
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {kpi.value}
                  </p>
                  {kpi.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {kpi.subtitle}
                    </p>
                  )}
                  {kpi.trend && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3" />
                      {kpi.trend}
                    </div>
                  )}
                </div>
                <div className={cn(
                  "p-3 rounded-xl shadow-lg",
                  kpi.iconBg
                )}>
                  <kpi.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {secondaryKpis.map((kpi, index) => (
          <Card 
            key={kpi.label} 
            className={cn(
              "border-border/50 hover:shadow-md transition-all duration-200",
              kpi.alert && "border-destructive/30"
            )}
            style={{ animationDelay: `${(index + 3) * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1.5 rounded-lg", kpi.bgColor)}>
                  <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {kpi.label}
                </span>
              </div>
              <p className={cn(
                "text-xl font-bold tracking-tight",
                kpi.alert && "text-destructive"
              )}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
