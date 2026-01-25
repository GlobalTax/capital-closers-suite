import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarFilters } from "@/components/calendario/CalendarFilters";
import { CalendarMonthView } from "@/components/calendario/CalendarMonthView";
import { CalendarWeekView } from "@/components/calendario/CalendarWeekView";
import { CalendarListView } from "@/components/calendario/CalendarListView";
import { UpcomingEventsWidget } from "@/components/calendario/UpcomingEventsWidget";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { CalendarFilters as CalendarFiltersType, CalendarViewMode, CalendarEventType } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_FILTERS: CalendarFiltersType = {
  tipoMandato: 'all',
  estadoMandato: 'all',
  tipoEvento: [
    'cierre_esperado',
    'inicio_mandato',
    'fin_mandato',
    'tarea_checklist',
    'tarea_critica',
    'tarea_general'
  ] as CalendarEventType[],
  showCompleted: false,
};

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filters, setFilters] = useState<CalendarFiltersType>(DEFAULT_FILTERS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { 
    events, 
    getEventsForDate, 
    upcomingEvents, 
    overdueEvents,
    isLoading 
  } = useCalendarEvents({ currentDate, filters });

  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="Calendario"
        subtitle="Visualiza fechas de cierre, hitos y tareas"
        icon={CalendarIcon}
        showHelp
      />

      {/* Controls - responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrevious} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 px-3">
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-medium ml-2 capitalize">
            {viewMode === 'month' 
              ? format(currentDate, "MMMM yyyy", { locale: es })
              : `Semana del ${format(currentDate, "d 'de' MMMM", { locale: es })}`
            }
          </h2>
        </div>

        <CalendarFilters
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : (
            <>
              {viewMode === 'month' && (
                <CalendarMonthView
                  currentDate={currentDate}
                  events={events}
                  getEventsForDate={getEventsForDate}
                  onDateClick={setSelectedDate}
                  selectedDate={selectedDate}
                />
              )}
              {viewMode === 'week' && (
                <CalendarWeekView
                  currentDate={currentDate}
                  events={events}
                  getEventsForDate={getEventsForDate}
                  onDateClick={setSelectedDate}
                  selectedDate={selectedDate}
                />
              )}
              {viewMode === 'list' && (
                <CalendarListView
                  events={events}
                  currentDate={currentDate}
                />
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <UpcomingEventsWidget
            upcomingEvents={upcomingEvents}
            overdueEvents={overdueEvents}
          />
        </div>
      </div>
    </div>
  );
}
