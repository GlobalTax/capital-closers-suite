import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, X, Briefcase, Building2, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ParsedTask } from "@/types/taskAI";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskPreviewCardProps {
  task: ParsedTask;
  index: number;
  onRemove?: () => void;
  onEdit?: () => void;
  assignmentConfidence?: number;
  assignmentReason?: string;
}

export function TaskPreviewCard({ task, index, onRemove, assignmentConfidence, assignmentReason }: TaskPreviewCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'destructive';
      case 'alta': return 'default';
      case 'media': return 'secondary';
      case 'baja': return 'outline';
      default: return 'secondary';
    }
  };

  const getContextIcon = (contextType: string) => {
    switch (contextType) {
      case 'mandato': return <Briefcase className="h-3 w-3" />;
      case 'cliente': return <Building2 className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className={cn(
      "p-4 bg-card border rounded-lg transition-all hover:shadow-md",
      "animate-in fade-in-50 slide-in-from-bottom-2 duration-300",
    )} style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{task.title}</h4>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
              IA
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
              {task.priority}
            </Badge>

            {task.due_date && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(parseISO(task.due_date), "dd MMM", { locale: es })}</span>
              </div>
            )}

            {task.estimated_minutes > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{task.estimated_minutes} min</span>
              </div>
            )}

            {task.assigned_to_name && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-1",
                      assignmentConfidence && assignmentConfidence > 0.7 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-muted-foreground"
                    )}>
                      <User className="h-3 w-3" />
                      <span>{task.assigned_to_name}</span>
                      {assignmentConfidence && (
                        <Sparkles className="h-2.5 w-2.5 text-primary" />
                      )}
                    </div>
                  </TooltipTrigger>
                  {assignmentReason && (
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{assignmentReason}</p>
                      {assignmentConfidence && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Confianza: {Math.round(assignmentConfidence * 100)}%
                        </p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

            {task.context_type !== 'general' && (
              <div className="flex items-center gap-1 text-muted-foreground">
                {getContextIcon(task.context_type)}
                <span className="capitalize">{task.context_hint || task.context_type}</span>
              </div>
            )}

            {task.suggested_fase && (
              <Badge variant="outline" className="text-[10px]">
                {task.suggested_fase}
              </Badge>
            )}
          </div>
        </div>

        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
