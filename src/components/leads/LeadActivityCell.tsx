import { Clock, AlertTriangle, CheckCircle2, Phone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LeadActivityCellProps {
  totalHours?: number;
  lastActivityDate?: string | null;
  lastActivityType?: string | null;
  daysSinceActivity?: number;
}

export function LeadActivityCell({ 
  totalHours = 0, 
  lastActivityDate, 
  lastActivityType,
  daysSinceActivity 
}: LeadActivityCellProps) {
  // Determine status color
  const getStatusColor = () => {
    if (!lastActivityDate || daysSinceActivity === undefined || daysSinceActivity === null) {
      return 'text-muted-foreground';
    }
    if (daysSinceActivity > 14) return 'text-destructive';
    if (daysSinceActivity > 7) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-green-600 dark:text-green-500';
  };

  const getStatusIcon = () => {
    if (!lastActivityDate) {
      return <AlertTriangle className="h-3.5 w-3.5" />;
    }
    if (daysSinceActivity !== undefined && daysSinceActivity > 14) {
      return <AlertTriangle className="h-3.5 w-3.5" />;
    }
    if (totalHours > 0) {
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
    return <Phone className="h-3.5 w-3.5" />;
  };

  const formatHours = (hours: number): string => {
    if (hours === 0) return '-';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  const getActivityLabel = (): string => {
    if (!lastActivityDate) return 'Sin actividad';
    
    try {
      return formatDistanceToNow(new Date(lastActivityDate), { 
        addSuffix: false, 
        locale: es 
      });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {formatHours(totalHours)}
              </span>
            </div>
            {lastActivityDate && (
              <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                {getActivityLabel()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <div className="text-xs space-y-1">
            <p><strong>Horas totales:</strong> {formatHours(totalHours)}</p>
            {lastActivityDate && (
              <p><strong>Última actividad:</strong> {getActivityLabel()}</p>
            )}
            {!lastActivityDate && (
              <p className="text-muted-foreground">Sin actividad registrada</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
