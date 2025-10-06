import { useState } from "react";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaskTimeWidgetProps {
  taskId: string;
  totalHours: number;
  entryCount: number;
  onAddTime: () => void;
}

export function TaskTimeWidget({
  taskId,
  totalHours,
  entryCount,
  onAddTime
}: TaskTimeWidgetProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {totalHours.toFixed(1)}h
              {entryCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({entryCount})
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{entryCount} registro{entryCount !== 1 ? 's' : ''} de tiempo</p>
            <p className="text-xs text-muted-foreground">
              Total: {totalHours.toFixed(2)} horas
            </p>
          </TooltipContent>
        </Tooltip>

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onAddTime}
          title="Registrar tiempo"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </TooltipProvider>
  );
}
