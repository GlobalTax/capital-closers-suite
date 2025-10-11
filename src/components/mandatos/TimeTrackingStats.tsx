import { ColorfulFinancialKPI } from "@/components/empresas/ColorfulFinancialKPI";
import { Clock, DollarSign, TrendingUp, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { TimeStats } from "@/types";

interface TimeTrackingStatsProps {
  stats: TimeStats;
}

export function TimeTrackingStats({ stats }: TimeTrackingStatsProps) {
  const billablePercentage = stats.total_hours > 0 
    ? (stats.billable_hours / stats.total_hours) * 100 
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ColorfulFinancialKPI
          label="Total Horas"
          value={`${stats.total_hours.toFixed(1)}h`}
          subtitle={`${stats.total_entries} registros`}
          icon={Clock}
          colorScheme="blue"
        />

        <ColorfulFinancialKPI
          label="Horas Facturables"
          value={`${stats.billable_hours.toFixed(1)}h`}
          subtitle={`${billablePercentage.toFixed(0)}% del total`}
          icon={DollarSign}
          colorScheme="green"
        />

        <ColorfulFinancialKPI
          label="Promedio por Día"
          value={`${(stats.total_hours / 7).toFixed(1)}h`}
          subtitle="Últimos 7 días"
          icon={TrendingUp}
          colorScheme="purple"
        />

        <ColorfulFinancialKPI
          label="Colaboradores"
          value={stats.hours_by_user.length.toString()}
          subtitle="Trabajando en este mandato"
          icon={Users}
          colorScheme="orange"
        />
      </div>

      {/* Progress bar para porcentaje facturable */}
      {stats.total_hours > 0 && (
        <div className="bg-card rounded-lg border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Porcentaje Facturable</span>
            <span className="text-sm font-bold text-green-600">
              {billablePercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={billablePercentage} className="h-2" />
        </div>
      )}
    </div>
  );
}
