import { useState, useMemo } from "react";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, ChevronDown, Timer, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EditableTimeEntryRow } from "./EditableTimeEntryRow";
import { DayInlineAddForm } from "./DayInlineAddForm";
import { ReadOnlyTimeEntryRow } from "./ReadOnlyTimeEntryRow";
import type { TimeEntry } from "@/types";

interface DayGroupedTimeEntriesProps {
  entries: TimeEntry[];
  currentUserId: string;
  isAdmin: boolean;
  onRefresh: () => void;
}

interface DayGroup {
  date: string;
  dateObj: Date;
  entries: TimeEntry[];
  totalMinutes: number;
}

export function DayGroupedTimeEntries({
  entries,
  currentUserId,
  isAdmin,
  onRefresh
}: DayGroupedTimeEntriesProps) {
  const [openedDay, setOpenedDay] = useState<string | null>(null);

  // Group entries by day
  const groupedByDay = useMemo((): DayGroup[] => {
    const groups: Record<string, TimeEntry[]> = {};
    
    entries.forEach(entry => {
      const dateKey = format(new Date(entry.start_time), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });
    
    // Sort days (most recent first) and entries within each day
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayEntries]) => ({
        date,
        dateObj: startOfDay(new Date(date)),
        entries: dayEntries.sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ),
        totalMinutes: dayEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
      }));
  }, [entries]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const toggleDay = (date: string) => {
    setOpenedDay(prev => prev === date ? null : date);
  };

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 animate-in fade-in-50 duration-300">
        <Timer className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-base font-medium text-foreground">Sin registros en este período</p>
        <p className="text-sm text-muted-foreground mt-1">
          Usa el formulario de arriba para registrar tiempo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupedByDay.map(({ date, dateObj, entries: dayEntries, totalMinutes }) => {
        const isOpen = openedDay === date;
        const formattedDate = format(dateObj, "EEEE d 'de' MMMM", { locale: es });
        
        return (
          <div 
            key={date} 
            className={cn(
              "rounded-lg border bg-card overflow-hidden transition-all",
              isOpen && "ring-2 ring-primary/20"
            )}
          >
            {/* Day Header */}
            <button
              onClick={() => toggleDay(date)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                isOpen && "bg-muted/30 border-b"
              )}
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium capitalize">{formattedDate}</span>
                <Badge variant="secondary" className="text-xs">
                  {dayEntries.length} {dayEntries.length === 1 ? 'entrada' : 'entradas'}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium tabular-nums">
                  {formatDuration(totalMinutes)}
                </span>
                <Button
                  variant={isOpen ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDay(date);
                  }}
                >
                  {isOpen ? (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 mr-1" />
                      Cerrar
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3.5 w-3.5 mr-1" />
                      Abrir día
                    </>
                  )}
                </Button>
              </div>
            </button>

            {/* Collapsed Preview - Show mini list when closed */}
            {!isOpen && dayEntries.length > 0 && (
              <div className="px-4 py-2 space-y-1 bg-muted/10">
                {dayEntries.slice(0, 3).map(entry => (
                  <ReadOnlyTimeEntryRow key={entry.id} entry={entry} compact />
                ))}
                {dayEntries.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-2">
                    +{dayEntries.length - 3} más...
                  </p>
                )}
              </div>
            )}

            {/* Expanded View - Editable rows + Add form */}
            {isOpen && (
              <div className="p-4 space-y-3">
                {/* Existing entries - editable */}
                {dayEntries.map(entry => (
                  <EditableTimeEntryRow
                    key={entry.id}
                    entry={entry}
                    onSave={onRefresh}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                  />
                ))}

                {/* Separator */}
                <div className="border-t border-dashed my-4" />

                {/* Add new entry for this day */}
                <DayInlineAddForm
                  date={dateObj}
                  onSuccess={onRefresh}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
