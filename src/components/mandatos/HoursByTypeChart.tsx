import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { TimeEntry } from "@/types";

interface HoursByTypeChartProps {
  entries: TimeEntry[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042'
];

export function HoursByTypeChart({ entries }: HoursByTypeChartProps) {
  const typeHours: Record<string, number> = {};
  
  entries.forEach(entry => {
    const type = entry.work_type || 'Otro';
    typeHours[type] = (typeHours[type] || 0) + (entry.duration_minutes || 0);
  });

  const chartData = Object.entries(typeHours)
    .map(([type, minutes]) => ({
      name: type,
      value: +(minutes / 60).toFixed(1),
      percentage: 0
    }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach(item => {
    item.percentage = total > 0 ? +((item.value / total) * 100).toFixed(1) : 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por Tipo de Trabajo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value}h`, 'Horas']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
