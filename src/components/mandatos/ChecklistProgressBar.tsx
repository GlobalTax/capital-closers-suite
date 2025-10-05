import { Progress } from "@/components/ui/progress";
import { ChecklistFaseProgress } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChecklistProgressBarProps {
  progress: ChecklistFaseProgress;
}

export function ChecklistProgressBar({ progress }: ChecklistProgressBarProps) {
  const getProgressColor = () => {
    if (progress.porcentaje === 100) return "bg-green-500";
    if (progress.porcentaje >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{progress.fase}</span>
              <span className="text-muted-foreground">{progress.porcentaje}%</span>
            </div>
            <Progress 
              value={progress.porcentaje} 
              className="h-2"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p>Total: {progress.total} tareas</p>
            <p className="text-green-400">✅ Completadas: {progress.completadas}</p>
            <p className="text-yellow-400">🔄 En curso: {progress.enCurso}</p>
            <p className="text-gray-400">⏳ Pendientes: {progress.pendientes}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
