import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ChevronRight, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { TaskAIEventWithTasks } from "@/services/taskAIFeedback.service";

interface TaskAIEventRowProps {
  event: TaskAIEventWithTasks;
  onViewDetails: (event: TaskAIEventWithTasks) => void;
}

export function TaskAIEventRow({ event, onViewDetails }: TaskAIEventRowProps) {
  const originalInput = event.payload?.original_input || 'Sin texto original';
  const truncatedInput = originalInput.length > 60 
    ? originalInput.substring(0, 60) + '...' 
    : originalInput;
  
  const confidence = event.payload?.confidence || 0;
  const taskTitle = event.tarea?.titulo || event.payload?.parsed_task?.title || 'Tarea eliminada';
  const taskStatus = event.tarea?.estado || 'desconocido';

  const statusColors: Record<string, string> = {
    pendiente: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    en_progreso: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    completada: 'bg-green-500/10 text-green-600 border-green-500/20',
    desconocido: 'bg-muted text-muted-foreground',
  };

  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    completada: 'Completada',
    desconocido: 'Desconocido',
  };

  const renderFeedbackBadge = () => {
    if (!event.feedback) {
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Sin evaluar
        </Badge>
      );
    }
    if (event.feedback.is_useful) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
          <ThumbsUp className="h-3 w-3 mr-1" />
          Útil
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
        <ThumbsDown className="h-3 w-3 mr-1" />
        No útil
      </Badge>
    );
  };

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDetails(event)}>
      <TableCell className="max-w-[300px]">
        <div className="space-y-1">
          <p className="font-medium text-sm truncate" title={originalInput}>
            {truncatedInput}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(event.created_at), "d MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <ConfidenceBadge confidence={confidence} size="sm" />
      </TableCell>
      <TableCell className="max-w-[200px]">
        <div className="space-y-1">
          <p className="text-sm truncate" title={taskTitle}>{taskTitle}</p>
          <Badge variant="outline" className={statusColors[taskStatus]}>
            {statusLabels[taskStatus]}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        {renderFeedbackBadge()}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
