import { useQuery } from "@tanstack/react-query";
import { getTeamWorkload } from "@/services/workloadService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, ListTodo, Gauge } from "lucide-react";
import { TeamWorkloadTable } from "@/components/team/TeamWorkloadTable";
import { TeamCapacityChart } from "@/components/team/TeamCapacityChart";
import { OverloadAlerts } from "@/components/team/OverloadAlerts";

export default function TeamWorkload() {
  const { data: members = [] } = useQuery({
    queryKey: ['team-workload'],
    queryFn: getTeamWorkload,
    staleTime: 2 * 60 * 1000,
  });

  // KPIs
  const totalHours = members.reduce((acc, m) => acc + m.hours_this_week, 0);
  const totalTasks = members.reduce((acc, m) => acc + m.pending_tasks, 0);
  const avgCapacity = members.length > 0
    ? Math.round(members.reduce((acc, m) => acc + (m.hours_this_week / (m.daily_capacity * 5 || 1)) * 100, 0) / members.length)
    : 0;
  const overloadedCount = members.filter(m => (m.hours_this_week / (m.daily_capacity * 5 || 1)) >= 0.8).length;

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Carga de Trabajo del Equipo</h1>
        <p className="text-muted-foreground">Visión general de capacidad y distribución de tareas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Miembros</span>
            </div>
            <p className="text-2xl font-bold">{members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Horas Semana</span>
            </div>
            <p className="text-2xl font-bold">{totalHours.toFixed(0)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ListTodo className="h-4 w-4" />
              <span className="text-xs">Tareas Pendientes</span>
            </div>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="h-4 w-4" />
              <span className="text-xs">Capacidad Media</span>
            </div>
            <p className="text-2xl font-bold">{avgCapacity}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Miembros del Equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamWorkloadTable />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <OverloadAlerts />
          <TeamCapacityChart />
        </div>
      </div>
    </div>
  );
}
