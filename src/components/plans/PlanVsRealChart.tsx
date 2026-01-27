import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanVsRealChartProps {
  plannedHours: number;
  actualHours: number;
  plannedTasks: number;
  completedTasks: number;
  className?: string;
}

export function PlanVsRealChart({
  plannedHours,
  actualHours,
  plannedTasks,
  completedTasks,
  className,
}: PlanVsRealChartProps) {
  const data = useMemo(() => [
    {
      name: 'Horas',
      Planificado: plannedHours,
      Real: actualHours,
    },
  ], [plannedHours, actualHours]);
  
  const deviation = plannedHours > 0 
    ? ((actualHours - plannedHours) / plannedHours) * 100 
    : 0;
  
  const taskCompletion = plannedTasks > 0 
    ? (completedTasks / plannedTasks) * 100 
    : 0;
  
  const DeviationIcon = deviation > 5 ? TrendingUp : deviation < -5 ? TrendingDown : Minus;
  const deviationColor = Math.abs(deviation) <= 10 ? 'text-green-600' : 'text-amber-600';
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Plan vs Real</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis type="category" dataKey="name" className="text-xs" width={50} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="Planificado" fill="hsl(var(--primary))" opacity={0.6} />
              <Bar dataKey="Real" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className={cn("flex items-center justify-center gap-1", deviationColor)}>
              <DeviationIcon className="h-4 w-4" />
              <span className="text-lg font-semibold">
                {deviation > 0 ? '+' : ''}{deviation.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Desviación horas</p>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">
              {taskCompletion.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tareas completadas ({completedTasks}/{plannedTasks})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
