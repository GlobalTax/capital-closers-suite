import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { TimeEntry } from "@/types";

interface TaskTimeWidgetProps {
  entries: TimeEntry[];
}

export function TaskTimeWidget({ entries }: TaskTimeWidgetProps) {
  const taskHours: Record<string, { task: string; fase: string; minutes: number; count: number }> = {};
  
  entries.forEach(entry => {
    const taskId = entry.task?.id || 'unknown';
    if (!taskHours[taskId]) {
      taskHours[taskId] = {
        task: entry.task?.tarea || 'Tarea desconocida',
        fase: entry.task?.fase || 'Sin fase',
        minutes: 0,
        count: 0
      };
    }
    taskHours[taskId].minutes += entry.duration_minutes || 0;
    taskHours[taskId].count += 1;
  });

  const topTasks = Object.values(taskHours)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Top 5 Tareas con Más Tiempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay datos disponibles
            </p>
          ) : (
            topTasks.map((task, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm line-clamp-1">
                    {task.task}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {task.fase}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.count} registro{task.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-primary">
                    {formatHours(task.minutes)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
