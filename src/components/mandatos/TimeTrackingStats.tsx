import { Clock, TrendingUp, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeStats } from "@/types";

interface TimeTrackingStatsProps {
  stats: TimeStats;
}

export function TimeTrackingStats({ stats }: TimeTrackingStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">
            {stats.total_hours.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.total_entries} registros
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Horas Facturables</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">
            {stats.billable_hours.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">
            {((stats.billable_hours / stats.total_hours) * 100).toFixed(0)}% del total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio por Día</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">
            {(stats.total_hours / 7).toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">
            Últimos 7 días
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">
            {stats.hours_by_user.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Trabajando en este mandato
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
