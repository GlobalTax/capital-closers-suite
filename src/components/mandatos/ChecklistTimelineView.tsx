import { useMemo } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { MandatoChecklistTask, ChecklistFaseConfig } from "@/types";
import { cn } from "@/lib/utils";

interface ChecklistTimelineViewProps {
  tasks: MandatoChecklistTask[];
  fases: ChecklistFaseConfig[];
}

export function ChecklistTimelineView({ tasks, fases }: ChecklistTimelineViewProps) {
  const timelineData = useMemo(() => {
    const today = new Date();
    const tasksWithDates = tasks.filter(t => t.fecha_limite || t.fecha_inicio);
    
    if (tasksWithDates.length === 0) {
      return { weeks: [], minDate: today, maxDate: addDays(today, 84) };
    }

    const allDates = tasksWithDates.flatMap(t => [
      t.fecha_inicio ? new Date(t.fecha_inicio) : null,
      t.fecha_limite ? new Date(t.fecha_limite) : null,
    ]).filter(Boolean) as Date[];

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    const totalDays = differenceInDays(maxDate, minDate) + 14;
    const weeks = Math.ceil(totalDays / 7);

    return { 
      weeks: Array.from({ length: weeks }, (_, i) => addDays(minDate, i * 7)),
      minDate,
      maxDate,
    };
  }, [tasks]);

  const getTaskPosition = (task: MandatoChecklistTask) => {
    if (!task.fecha_limite && !task.fecha_inicio) return null;
    
    const startDate = task.fecha_inicio ? new Date(task.fecha_inicio) : new Date(task.fecha_limite!);
    const endDate = task.fecha_limite ? new Date(task.fecha_limite) : startDate;
    
    const totalDays = differenceInDays(timelineData.maxDate, timelineData.minDate) + 14;
    const startOffset = differenceInDays(startDate, timelineData.minDate);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${Math.max((duration / totalDays) * 100, 2)}%`,
    };
  };

  const getTaskColor = (task: MandatoChecklistTask, faseConfig?: ChecklistFaseConfig) => {
    if (task.estado === "✅ Completa") return "bg-green-500";
    if (task.fecha_limite && new Date(task.fecha_limite) < new Date()) {
      return "bg-red-500";
    }
    if (task.estado === "🔄 En curso") return "bg-blue-500";
    return faseConfig?.color ? `bg-[${faseConfig.color}]` : "bg-muted-foreground";
  };

  const getStatusIcon = (task: MandatoChecklistTask) => {
    if (task.estado === "✅ Completa") return <CheckCircle2 className="w-3 h-3" />;
    if (task.fecha_limite && new Date(task.fecha_limite) < new Date()) {
      return <AlertTriangle className="w-3 h-3" />;
    }
    return <Clock className="w-3 h-3" />;
  };

  const tasksByFase = useMemo(() => {
    const grouped: Record<string, MandatoChecklistTask[]> = {};
    fases.forEach(f => {
      grouped[f.nombre] = tasks.filter(t => t.fase === f.nombre);
    });
    return grouped;
  }, [tasks, fases]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay tareas con fechas asignadas para mostrar en el timeline
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Week headers */}
        <div className="flex border-b pb-2">
          <div className="w-48 shrink-0 font-medium text-sm">Fase / Tarea</div>
          <div className="flex-1 flex">
            {timelineData.weeks.map((week, i) => (
              <div key={i} className="flex-1 text-xs text-center text-muted-foreground">
                {format(week, "d MMM", { locale: es })}
              </div>
            ))}
          </div>
        </div>

        {/* Fases with tasks */}
        {fases.map(fase => {
          const faseTasks = tasksByFase[fase.nombre] || [];
          if (faseTasks.length === 0) return null;

          return (
            <div key={fase.id} className="space-y-1">
              <div className="flex items-center gap-2 py-1">
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: fase.color }}
                />
                <span className="font-medium text-sm">{fase.nombre}</span>
                <Badge variant="secondary" className="text-xs">
                  {faseTasks.filter(t => t.estado === "✅ Completa").length}/{faseTasks.length}
                </Badge>
              </div>

              {faseTasks.slice(0, 5).map(task => {
                const position = getTaskPosition(task);
                const isOverdue = task.fecha_limite && 
                  new Date(task.fecha_limite) < new Date() && 
                  task.estado !== "✅ Completa";

                return (
                  <div key={task.id} className="flex items-center">
                    <div className="w-48 shrink-0 pr-2">
                      <div className="flex items-center gap-1.5 text-xs truncate">
                        {getStatusIcon(task)}
                        <span className={cn(
                          "truncate",
                          task.estado === "✅ Completa" && "line-through text-muted-foreground",
                          isOverdue && "text-red-600"
                        )}>
                          {task.tarea}
                        </span>
                        {task.es_critica && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            !
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 h-6 relative bg-muted/30 rounded">
                      {position && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-1 h-4 rounded cursor-pointer transition-opacity hover:opacity-80",
                                task.estado === "✅ Completa" ? "bg-green-500" : 
                                isOverdue ? "bg-red-500" : 
                                task.estado === "🔄 En curso" ? "bg-blue-500" : "bg-primary/60"
                              )}
                              style={position}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">{task.tarea}</p>
                              {task.fecha_limite && (
                                <p className="text-xs">
                                  Fecha límite: {format(new Date(task.fecha_limite), "d MMM yyyy", { locale: es })}
                                </p>
                              )}
                              <p className="text-xs">Estado: {task.estado}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}

              {faseTasks.length > 5 && (
                <p className="text-xs text-muted-foreground pl-48">
                  + {faseTasks.length - 5} tareas más
                </p>
              )}
            </div>
          );
        })}

        {/* Today marker */}
        <div className="flex items-center text-xs text-primary mt-4">
          <div className="w-48 shrink-0">Hoy</div>
          <div className="flex-1 relative h-4">
            <div 
              className="absolute top-0 w-0.5 h-full bg-primary"
              style={{
                left: `${(differenceInDays(new Date(), timelineData.minDate) / 
                  (differenceInDays(timelineData.maxDate, timelineData.minDate) + 14)) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}