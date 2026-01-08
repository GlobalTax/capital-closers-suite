import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { ChecklistFaseProgress, ChecklistFaseConfig } from "@/types";
import { cn } from "@/lib/utils";

interface ChecklistPhaseCardProps {
  fase: ChecklistFaseConfig;
  progress: ChecklistFaseProgress;
  isExpanded?: boolean;
  onClick?: () => void;
}

export function ChecklistPhaseCard({ fase, progress, isExpanded, onClick }: ChecklistPhaseCardProps) {
  const { completadas, total, porcentaje, vencidas = 0, tareasCriticas = 0 } = progress;
  
  const getStatusColor = () => {
    if (porcentaje === 100) return "bg-green-500";
    if (vencidas > 0) return "bg-red-500";
    if (porcentaje >= 50) return "bg-blue-500";
    return "bg-muted-foreground";
  };

  const getStatusIcon = () => {
    if (porcentaje === 100) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (vencidas > 0) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div 
      className={cn(
        "p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md",
        isExpanded ? "ring-2 ring-primary" : "hover:border-primary/50",
        vencidas > 0 && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
      )}
      onClick={onClick}
      style={{ borderLeftColor: fase.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-semibold text-sm">{fase.nombre}</h3>
        </div>
        <span className="text-lg font-medium" style={{ color: fase.color }}>
          {porcentaje}%
        </span>
      </div>

      <Progress 
        value={porcentaje} 
        className="h-2 mb-3"
      />

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="text-xs">
          {completadas}/{total} tareas
        </Badge>
        
        {tareasCriticas > 0 && (
          <Badge variant="outline" className="text-xs gap-1">
            <AlertCircle className="w-3 h-3" />
            {tareasCriticas} críticas
          </Badge>
        )}
        
        {vencidas > 0 && (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="w-3 h-3" />
            {vencidas} vencidas
          </Badge>
        )}
      </div>

      {fase.descripcion && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
          {fase.descripcion}
        </p>
      )}
    </div>
  );
}