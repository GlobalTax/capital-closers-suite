import { useQuery } from "@tanstack/react-query";
import { getTeamWorkload } from "@/services/workloadService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

export function TeamCapacityChart() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-workload'],
    queryFn: getTeamWorkload,
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;
  if (!members.length) return null;

  const chartData = members.map((m) => {
    const weeklyCapacity = m.daily_capacity * 5;
    const percentage = weeklyCapacity > 0 ? Math.min(100, Math.round((m.hours_this_week / weeklyCapacity) * 100)) : 0;
    return { name: m.name.split(' ')[0], fullName: m.name, capacity: percentage, pendingTasks: m.pending_tasks };
  });

  const getBarColor = (capacity: number) => {
    if (capacity >= 90) return 'hsl(var(--destructive))';
    if (capacity >= 70) return 'hsl(25, 95%, 53%)';
    return 'hsl(142, 76%, 36%)';
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Capacidad del Equipo</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={{ capacity: { label: "Capacidad", color: "hsl(var(--primary))" }}} className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={70} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="bg-background border rounded-lg shadow-lg p-2 text-xs">
                  <p className="font-medium">{payload[0].payload.fullName}</p>
                  <p>Capacidad: {payload[0].payload.capacity}%</p>
                </div>
              ) : null} />
              <ReferenceLine x={80} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              <Bar dataKey="capacity" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={getBarColor(entry.capacity)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
