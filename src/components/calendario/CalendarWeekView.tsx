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

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="grid grid-cols-7 divide-x">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDate(day);
          const dayIsToday = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div key={day.toISOString()} className="min-h-[400px]">
              {/* Day Header */}
              <div
                onClick={() => onDateClick?.(day)}
                className={cn(
                  "sticky top-0 p-3 border-b bg-background cursor-pointer hover:bg-accent/50",
                  isSelected && "bg-accent"
                )}
              >
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: es })}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-medium mt-1",
                      dayIsToday && "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                    )}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              </div>

              {/* Events */}
              <ScrollArea className="h-[350px]">
                <div className="p-2 space-y-2">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
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
  );
}
