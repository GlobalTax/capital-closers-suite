import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import type { TimeEntry } from "@/types";

interface HoursByWeekChartProps {
  entries: TimeEntry[];
  weeks?: number;
}

export function HoursByWeekChart({ entries, weeks = 4 }: HoursByWeekChartProps) {
  const chartData = Array.from({ length: weeks }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), weeks - 1 - i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

    const weekEntries = entries.filter(e => {
      const entryDate = new Date(e.start_time);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    const totalMinutes = weekEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const billableMinutes = weekEntries.filter(e => e.is_billable)
      .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    return {
      week: format(weekStart, 'dd MMM', { locale: es }),
      total: +(totalMinutes / 60).toFixed(1),
      facturables: +(billableMinutes / 60).toFixed(1),
      noFacturables: +((totalMinutes - billableMinutes) / 60).toFixed(1)
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas por Semana (Últimas {weeks})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="week" 
              className="text-sm"
            />
            <YAxis 
              label={{ value: 'Horas', angle: -90, position: 'insideLeft' }}
              className="text-sm"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="facturables" fill="hsl(var(--primary))" name="Facturables" />
            <Bar dataKey="noFacturables" fill="hsl(var(--muted))" name="No Facturables" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
