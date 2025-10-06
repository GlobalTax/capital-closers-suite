import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import type { TimeEntry } from "@/types";

interface HoursTrendChartProps {
  entries: TimeEntry[];
  weeks?: number;
}

export function HoursTrendChart({ entries, weeks = 8 }: HoursTrendChartProps) {
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
      facturables: +(billableMinutes / 60).toFixed(1),
      noFacturables: +((totalMinutes - billableMinutes) / 60).toFixed(1)
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendencia de Horas (Últimas {weeks} semanas)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
            <Line 
              type="monotone" 
              dataKey="facturables" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Facturables"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="noFacturables" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              name="No Facturables"
              dot={{ fill: 'hsl(var(--muted-foreground))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
