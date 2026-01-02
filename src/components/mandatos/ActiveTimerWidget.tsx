import { useState, useEffect } from "react";
import { Play, Square, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TimeEntry } from "@/types";

interface ActiveTimerWidgetProps {
  activeTimer: TimeEntry;
  onStop: () => void;
}

export function ActiveTimerWidget({ activeTimer, onStop }: ActiveTimerWidgetProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeTimer) return;
    
    const updateElapsed = () => {
      const start = new Date(activeTimer.start_time);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatElapsed = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-primary/20 rounded-full" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="h-6 w-6 fill-current" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Timer Activo</h3>
                <Badge variant="outline" className="bg-background">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatElapsed(elapsed)}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Tarea:</span>
                  <span>{activeTimer.task?.tarea || 'Sin tarea'}</span>
                </div>
                {activeTimer.mandato && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Mandato:</span>
                    <span>{activeTimer.mandato.descripcion}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Tipo:</span>
                  <Badge variant="secondary" className="text-xs">
                    {activeTimer.work_task_type?.name || activeTimer.work_type || 'Sin tipo'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onStop}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Detener Timer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
