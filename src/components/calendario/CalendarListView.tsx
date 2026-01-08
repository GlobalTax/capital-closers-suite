import { useMemo } from "react";
import { CalendarEvent } from "@/types/calendar";
import { CalendarEventCard } from "./CalendarEventCard";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CalendarListViewProps {
  events: CalendarEvent[];
  currentDate: Date;
}

export function CalendarListView({ events, currentDate }: CalendarListViewProps) {
  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: Date; events: CalendarEvent[] }[] = [];
    
    events.forEach((event) => {
      const existingGroup = groups.find(g => isSameDay(g.date, event.date));
      if (existingGroup) {
        existingGroup.events.push(event);
      } else {
        groups.push({ date: event.date, events: [event] });
      }
    });

    return groups.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No hay eventos para este período</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <ScrollArea className="h-[600px]">
        <div className="divide-y">
          {groupedEvents.map(({ date, events: dayEvents }) => (
            <div key={date.toISOString()} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex flex-col items-center w-14 py-2 px-3 rounded-lg bg-muted">
                  <span className="text-xs text-muted-foreground uppercase">
                    {format(date, "EEE", { locale: es })}
                  </span>
                  <span className="text-xl font-medium">
                    {format(date, "d")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(date, "MMM", { locale: es })}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 ml-[70px]">
                {dayEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    variant="full"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
