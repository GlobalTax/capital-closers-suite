import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, Target } from "lucide-react";
import { TimeEntry, VALUE_TYPE_CONFIG, TimeEntryValueType } from "@/types";
import { cn } from "@/lib/utils";

interface ExecutiveTimeKPIsProps {
  entries: TimeEntry[];
  loading?: boolean;
}

interface ValueDistribution {
  core_ma: number;
  soporte: number;
  bajo_valor: number;
  total: number;
}

interface RiskMetrics {
  hoursAtRisk: number;
  mandatosAtRisk: number;
  percentageOfTotal: number;
}

interface EfficiencyMetrics {
  pipelineValue: number;
  totalHours: number;
  valuePerHour: number;
}

function calculateValueDistribution(entries: TimeEntry[]): ValueDistribution {
  const distribution = { core_ma: 0, soporte: 0, bajo_valor: 0, total: 0 };
  
  entries.forEach(entry => {
    const hours = (entry.duration_minutes || 0) / 60;
    distribution.total += hours;
    
    if (entry.value_type && entry.value_type in distribution) {
      distribution[entry.value_type] += hours;
    }
  });
  
  return distribution;
}

function calculateRiskMetrics(entries: TimeEntry[], maxProbability: number = 40): RiskMetrics {
  const mandatoRisk = new Map<string, number>();
  let totalHours = 0;
  
  entries.forEach(entry => {
    const hours = (entry.duration_minutes || 0) / 60;
    totalHours += hours;
    
    if (entry.mandato_id && entry.mandato) {
      const probability = entry.mandato.probability || 0;
      if (probability < maxProbability && entry.mandato.estado !== 'cerrado') {
        const current = mandatoRisk.get(entry.mandato_id) || 0;
        mandatoRisk.set(entry.mandato_id, current + hours);
      }
    }
  });
  
  const hoursAtRisk = Array.from(mandatoRisk.values()).reduce((sum, h) => sum + h, 0);
  
  return {
    hoursAtRisk,
    mandatosAtRisk: mandatoRisk.size,
    percentageOfTotal: totalHours > 0 ? (hoursAtRisk / totalHours) * 100 : 0
  };
}

function calculateEfficiencyMetrics(entries: TimeEntry[]): EfficiencyMetrics {
  const mandatoValues = new Map<string, number>();
  let totalHours = 0;
  
  entries.forEach(entry => {
    const hours = (entry.duration_minutes || 0) / 60;
    totalHours += hours;
    
    if (entry.mandato_id && entry.mandato?.valor) {
      mandatoValues.set(entry.mandato_id, entry.mandato.valor);
    }
  });
  
  const pipelineValue = Array.from(mandatoValues.values()).reduce((sum, v) => sum + v, 0);
  
  return {
    pipelineValue,
    totalHours,
    valuePerHour: totalHours > 0 ? pipelineValue / totalHours : 0
  };
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K€`;
  }
  return `${value.toFixed(0)}€`;
}

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map(i => (
      <Card key={i} className="border-0 shadow-sm bg-card/50">
        <CardContent className="pt-6 pb-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-10 w-32 mb-4" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export function ExecutiveTimeKPIs({ entries, loading = false }: ExecutiveTimeKPIsProps) {
  const valueDistribution = useMemo(() => calculateValueDistribution(entries), [entries]);
  const riskMetrics = useMemo(() => calculateRiskMetrics(entries), [entries]);
  const efficiencyMetrics = useMemo(() => calculateEfficiencyMetrics(entries), [entries]);
  
  const corePercentage = valueDistribution.total > 0 
    ? (valueDistribution.core_ma / valueDistribution.total) * 100 
    : 0;
  const soportePercentage = valueDistribution.total > 0 
    ? (valueDistribution.soporte / valueDistribution.total) * 100 
    : 0;
  const bajoValorPercentage = valueDistribution.total > 0 
    ? (valueDistribution.bajo_valor / valueDistribution.total) * 100 
    : 0;
  
  const isRiskHigh = riskMetrics.percentageOfTotal > 30;
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* KPI 1: Ratio de Valor */}
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Ratio de Valor</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-4xl tracking-tight tabular-nums" style={{ color: VALUE_TYPE_CONFIG.core_ma.color }}>
              {corePercentage.toFixed(0)}%
            </span>
            <span className="text-sm text-muted-foreground">Core M&A</span>
          </div>
          
          {/* Stacked Progress Bar */}
          <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/30 mb-4">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${corePercentage}%`,
                backgroundColor: VALUE_TYPE_CONFIG.core_ma.color 
              }}
            />
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${soportePercentage}%`,
                backgroundColor: VALUE_TYPE_CONFIG.soporte.color 
              }}
            />
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${bajoValorPercentage}%`,
                backgroundColor: VALUE_TYPE_CONFIG.bajo_valor.color 
              }}
            />
          </div>
          
          {/* Legend */}
          <div className="space-y-1.5">
            {(['core_ma', 'soporte', 'bajo_valor'] as TimeEntryValueType[]).map(type => {
              const config = VALUE_TYPE_CONFIG[type];
              const hours = valueDistribution[type];
              const pct = valueDistribution.total > 0 ? (hours / valueDistribution.total) * 100 : 0;
              
              return (
                <div key={type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-muted-foreground">{config.label}</span>
                  </div>
                  <span className="tabular-nums">{pct.toFixed(0)}% · {hours.toFixed(1)}h</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* KPI 2: Horas en Riesgo */}
      <Card className={cn(
        "border-0 shadow-sm backdrop-blur-sm transition-colors",
        isRiskHigh ? "bg-red-50/50 dark:bg-red-950/20" : "bg-card/50"
      )}>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className={cn(
              "h-4 w-4",
              isRiskHigh ? "text-red-500" : "text-muted-foreground"
            )} />
            <span className="text-sm text-muted-foreground">Horas en Riesgo</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-5">
            <span className={cn(
              "text-4xl tracking-tight tabular-nums",
              isRiskHigh ? "text-red-500" : ""
            )}>
              {riskMetrics.hoursAtRisk.toFixed(1)}h
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              En <span className="text-foreground">{riskMetrics.mandatosAtRisk}</span> mandatos 
              con &lt;40% probabilidad
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isRiskHigh ? "bg-red-500" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min(riskMetrics.percentageOfTotal, 100)}%` }}
                />
              </div>
              <span className="text-xs tabular-nums">
                {riskMetrics.percentageOfTotal.toFixed(0)}% del total
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPI 3: Eficiencia de Inversión */}
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Valor Pipeline / Hora</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-4xl tracking-tight tabular-nums">
              {formatCurrency(efficiencyMetrics.valuePerHour)}
            </span>
            <span className="text-sm text-muted-foreground">/hora</span>
          </div>
          
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Pipeline total</span>
              <span className="text-foreground tabular-nums">
                {formatCurrency(efficiencyMetrics.pipelineValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Horas invertidas</span>
              <span className="text-foreground tabular-nums">
                {efficiencyMetrics.totalHours.toFixed(1)}h
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
