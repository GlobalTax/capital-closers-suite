import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Receipt, TrendingUp, Users } from "lucide-react";
import type { TimeEntry } from "@/types";

interface OperationalTimeKPIsProps {
  entries: TimeEntry[];
  loading?: boolean;
}

interface OperationalMetrics {
  totalHours: number;
  billablePercentage: number;
  avgHoursPerUser: number;
  activeUsers: number;
}

function calculateOperationalMetrics(entries: TimeEntry[]): OperationalMetrics {
  if (entries.length === 0) {
    return {
      totalHours: 0,
      billablePercentage: 0,
      avgHoursPerUser: 0,
      activeUsers: 0
    };
  }

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalHours = totalMinutes / 60;
  
  const billableMinutes = entries
    .filter(e => e.is_billable)
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const billableHours = billableMinutes / 60;
  
  const uniqueUsers = new Set(entries.map(e => e.user_id).filter(Boolean));
  const activeUsers = uniqueUsers.size;
  
  return {
    totalHours,
    billablePercentage: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
    avgHoursPerUser: activeUsers > 0 ? totalHours / activeUsers : 0,
    activeUsers
  };
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-card/50">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function OperationalTimeKPIs({ entries, loading }: OperationalTimeKPIsProps) {
  const metrics = useMemo(() => calculateOperationalMetrics(entries), [entries]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const kpis = [
    {
      label: "Total Horas",
      value: metrics.totalHours.toFixed(1),
      suffix: "h",
      icon: Clock,
      color: "text-blue-500"
    },
    {
      label: "% Facturable",
      value: metrics.billablePercentage.toFixed(0),
      suffix: "%",
      icon: Receipt,
      color: "text-emerald-500"
    },
    {
      label: "Promedio/Usuario",
      value: metrics.avgHoursPerUser.toFixed(1),
      suffix: "h",
      icon: TrendingUp,
      color: "text-amber-500"
    },
    {
      label: "Usuarios Activos",
      value: metrics.activeUsers.toString(),
      suffix: "",
      icon: Users,
      color: "text-violet-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span>{kpi.label}</span>
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {kpi.value}
              <span className="text-base font-normal text-muted-foreground ml-0.5">
                {kpi.suffix}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
