import { useMemo } from "react";
import { CalendarEvent } from "@/types/calendar";
import { CalendarEventCard, CalendarEventDot } from "./CalendarEventCard";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format 
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar } from "lucide-react";

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  getEventsForDate: (date: Date) => CalendarEvent[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date | null;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function CalendarMonthView({
  currentDate,
  events,
  getEventsForDate,
  onDateClick,
  selectedDate,
}: CalendarMonthViewProps) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // Empty state cuando no hay eventos en el mes
  if (events.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-12">
        <EmptyState
          icon={Calendar}
          titulo="Sin eventos este mes"
          descripcion="No hay eventos programados para este período. Ajusta los filtros o navega a otro mes."
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 md:py-3 text-center text-xs md:text-sm font-medium text-muted-foreground"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="divide-y">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x min-h-[80px] md:min-h-[120px]">
            {week.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dayIsToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onDateClick?.(day)}
                  className={cn(
                    "min-h-[80px] md:min-h-[120px] p-0.5 md:p-1 cursor-pointer transition-colors hover:bg-accent/50",
                    !isCurrentMonth && "bg-muted/30",
                    isSelected && "bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between mb-0.5 md:mb-1 px-0.5 md:px-1">
                    <span
                      className={cn(
                        "text-xs md:text-sm font-medium",
                        !isCurrentMonth && "text-muted-foreground",
                        dayIsToday && "bg-primary text-primary-foreground w-5 h-5 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-sm"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                  
                  {/* Desktop: Event cards */}
                  <div className="hidden md:block space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <CalendarEventCard
                        key={event.id}
                        event={event}
                        variant="compact"
                      />
                    ))}
                  </div>

                  {/* Mobile: Solo dots */}
                  <div className="flex md:hidden gap-0.5 flex-wrap px-0.5">
                    {dayEvents.slice(0, 4).map((event) => (
                      <CalendarEventDot key={event.id} event={event} />
                    ))}
                    {dayEvents.length > 4 && (
                      <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 4}</span>
                    )}
                  </div>

                  {/* Desktop: Event dots for overflow */}
                  {dayEvents.length > 3 && (
                    <div className="hidden md:flex gap-0.5 mt-1 px-1">
                      {dayEvents.slice(3, 8).map((event) => (
                        <CalendarEventDot key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
