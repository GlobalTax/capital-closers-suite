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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="divide-y">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x min-h-[120px]">
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
                    "min-h-[120px] p-1 cursor-pointer transition-colors hover:bg-accent/50",
                    !isCurrentMonth && "bg-muted/30",
                    isSelected && "bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        !isCurrentMonth && "text-muted-foreground",
                        dayIsToday && "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <CalendarEventCard
                        key={event.id}
                        event={event}
                        variant="compact"
                      />
                    ))}
                  </div>

                  {/* Event dots for overflow */}
                  {dayEvents.length > 3 && (
                    <div className="flex gap-0.5 mt-1 px-1">
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
