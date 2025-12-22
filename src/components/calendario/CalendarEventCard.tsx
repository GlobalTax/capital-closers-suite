import { CalendarEvent, getEventIcon } from "@/types/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CalendarEventCardProps {
  event: CalendarEvent;
  variant?: 'compact' | 'full';
  onClick?: () => void;
}

export function CalendarEventCard({ event, variant = 'full', onClick }: CalendarEventCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (event.mandatoId) {
      navigate(`/mandatos/${event.mandatoId}`);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full text-left px-2 py-1 rounded text-xs truncate transition-colors",
          "hover:opacity-80 cursor-pointer"
        )}
        style={{ 
          backgroundColor: event.bgColor,
          color: event.color,
          borderLeft: `3px solid ${event.color}`
        }}
      >
        <span className="mr-1">{getEventIcon(event.type)}</span>
        <span className="truncate">{event.title}</span>
      </button>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        "hover:shadow-md hover:scale-[1.01]",
        event.isOverdue && "border-destructive/50"
      )}
      style={{ 
        backgroundColor: event.bgColor,
        borderColor: event.color + '40'
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{getEventIcon(event.type)}</span>
            <span 
              className="text-sm font-medium truncate"
              style={{ color: event.color }}
            >
              {event.title}
            </span>
          </div>
          
          {event.mandatoNombre && (
            <p className="text-xs text-muted-foreground truncate">
              {event.mandatoNombre}
              {event.mandatoTipo && (
                <Badge 
                  variant="outline" 
                  className="ml-2 text-[10px] px-1 py-0"
                >
                  {event.mandatoTipo === 'compra' ? 'C' : 'V'}
                </Badge>
              )}
            </p>
          )}

          {event.fase && (
            <p className="text-xs text-muted-foreground mt-1">
              Fase: {event.fase}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {event.isCompleted && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {event.isOverdue && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <span className="text-[10px] text-muted-foreground">
            {format(event.date, "HH:mm", { locale: es })}
          </span>
        </div>
      </div>

      {event.isOverdue && (
        <div className="mt-2 pt-2 border-t border-destructive/20">
          <span className="text-xs text-destructive font-medium">
            ⚠️ Vencido
          </span>
        </div>
      )}
    </div>
  );
}

// Mini version for calendar cells
export function CalendarEventDot({ event }: { event: CalendarEvent }) {
  return (
    <div
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: event.color }}
      title={event.title}
    />
  );
}
