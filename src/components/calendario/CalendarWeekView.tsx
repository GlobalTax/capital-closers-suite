import { useMemo } from "react";
import { CalendarEvent } from "@/types/calendar";
import { CalendarEventCard } from "./CalendarEventCard";
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isToday,
  format,
  isSameDay
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  getEventsForDate: (date: Date) => CalendarEvent[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
}

export function CalendarWeekView({
  currentDate,
  events,
  getEventsForDate,
  onDateClick,
  selectedDate,
}: CalendarWeekViewProps) {
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Empty state cuando no hay eventos en la semana
  if (events.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-12">
        <EmptyState
          icon={Calendar}
          titulo="Sin eventos esta semana"
          descripcion="No hay eventos programados para esta semana. Ajusta los filtros o navega a otra semana."
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Indicador de scroll en móvil */}
      <div className="md:hidden px-3 py-2 bg-muted/50 border-b text-xs text-muted-foreground flex items-center justify-center gap-2">
        <ChevronLeft className="h-3 w-3" />
        <span>Desliza para ver todos los días</span>
        <ChevronRight className="h-3 w-3" />
      </div>

      {/* Contenedor con scroll horizontal en móvil */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 divide-x min-w-[700px]">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const dayIsToday = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div key={day.toISOString()} className="min-h-[350px] md:min-h-[400px]">
                {/* Day Header */}
                <div
                  onClick={() => onDateClick?.(day)}
                  className={cn(
                    "sticky top-0 p-2 md:p-3 border-b bg-background cursor-pointer hover:bg-accent/50",
                    isSelected && "bg-accent"
                  )}
                >
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase">
                      {format(day, "EEE", { locale: es })}
                    </p>
                    <p
                      className={cn(
                        "text-base md:text-lg font-medium mt-0.5 md:mt-1",
                        dayIsToday && "bg-primary text-primary-foreground w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center mx-auto text-sm md:text-base"
                      )}
                    >
                      {format(day, "d")}
                    </p>
                  </div>
                </div>

                {/* Events */}
                <ScrollArea className="h-[280px] md:h-[350px]">
                  <div className="p-1.5 md:p-2 space-y-1.5 md:space-y-2">
                    {dayEvents.length === 0 ? (
                      <p className="text-[10px] md:text-xs text-muted-foreground text-center py-3 md:py-4">
                        Sin eventos
                      </p>
                    ) : (
                      dayEvents.map((event) => (
                        <CalendarEventCard
                          key={event.id}
                          event={event}
                          variant="compact"
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
