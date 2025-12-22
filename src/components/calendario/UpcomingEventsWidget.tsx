import { CalendarEvent, getEventIcon } from "@/types/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Calendar, AlertTriangle, Clock } from "lucide-react";

interface UpcomingEventsWidgetProps {
  upcomingEvents: CalendarEvent[];
  overdueEvents: CalendarEvent[];
}

export function UpcomingEventsWidget({ 
  upcomingEvents, 
  overdueEvents 
}: UpcomingEventsWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Overdue Events */}
      {overdueEvents.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Vencidos ({overdueEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {overdueEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => event.mandatoId && navigate(`/mandatos/${event.mandatoId}`)}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors"
                  >
                    <span>{getEventIcon(event.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Venció {formatDistanceToNow(event.date, { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Próximos 7 días
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay eventos próximos
            </p>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => event.mandatoId && navigate(`/mandatos/${event.mandatoId}`)}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    )}
                  >
                    <span>{getEventIcon(event.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      {event.mandatoNombre && (
                        <p className="text-xs text-muted-foreground truncate">
                          {event.mandatoNombre}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(event.date, "EEE d MMM", { locale: es })}
                        </span>
                        {event.mandatoTipo && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {event.mandatoTipo === 'compra' ? 'Compra' : 'Venta'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Leyenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span>🔴</span>
              <span>Cierre esperado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🟢</span>
              <span>Inicio mandato</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🟣</span>
              <span>Cierre real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🔵</span>
              <span>Tarea checklist</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🟠</span>
              <span>Tarea crítica</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>📋</span>
              <span>Tarea general</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
