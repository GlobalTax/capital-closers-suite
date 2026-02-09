import { useState, useEffect } from "react";
import { addDays, format, subDays, startOfToday, isWeekend, isSaturday, isSunday, nextMonday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2, Palmtree, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDailyPlan } from "@/hooks/useDailyPlan";
import { useAbsences } from "@/hooks/useAbsences";
import { DailyPlanForm } from "@/components/plans/DailyPlanForm";
import { AbsenceMarker } from "@/components/plans/AbsenceMarker";
import { PlanVsRealChart } from "@/components/plans/PlanVsRealChart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Skip weekends when navigating
function skipWeekends(d: Date, direction: 'prev' | 'next'): Date {
  if (direction === 'next') {
    const next = addDays(d, 1);
    if (isSaturday(next)) return addDays(next, 2);
    if (isSunday(next)) return addDays(next, 1);
    return next;
  } else {
    const prev = subDays(d, 1);
    if (isSunday(prev)) return subDays(prev, 2);
    if (isSaturday(prev)) return subDays(prev, 1);
    return prev;
  }
}

function getDefaultDate(): Date {
  const tomorrow = addDays(new Date(), 1);
  if (isWeekend(tomorrow)) return nextMonday(tomorrow);
  return tomorrow;
}

export default function PlanDiario() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getDefaultDate);
  const [actualHours, setActualHours] = useState(0);
  
  const {
    plan,
    loading,
    saving,
    addItem,
    updateItem,
    deleteItem,
    updateNotes,
    submitPlan,
    totalHours,
    canEdit,
    isSubmitted,
    autoCreateTasks,
    setAutoCreateTasks,
  } = useDailyPlan(selectedDate);
  
  // Load absences for calendar display
  const {
    absences,
    absenceDates,
    absenceForSelectedDate,
    addAbsence,
    removeAbsence,
    isAdding: addingAbsence,
    isRemoving: removingAbsence,
  } = useAbsences(selectedDate);
  
  // Load actual hours for the selected date
  useEffect(() => {
    if (!user?.id || !plan) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    supabase
      .from('mandato_time_entries')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .gte('start_time', `${dateStr}T00:00:00`)
      .lt('start_time', `${dateStr}T23:59:59`)
      .eq('is_deleted', false)
      .then(({ data }) => {
        const total = data?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
        setActualHours(total / 60);
      });
  }, [user?.id, selectedDate, plan]);
  
  const handlePrevDay = () => setSelectedDate(skipWeekends(selectedDate, 'prev'));
  const handleNextDay = () => setSelectedDate(skipWeekends(selectedDate, 'next'));
  const handleToday = () => setSelectedDate(getDefaultDate());
  
  const tomorrow = addDays(new Date(), 1);
  const isTomorrow = format(selectedDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
  const isPast = selectedDate < startOfToday();
  const isWeekendDay = isWeekend(selectedDate);
  
  const completedTasks = plan?.items.filter(i => i.completed).length || 0;
  const totalTasks = plan?.items.length || 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plan Diario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isWeekendDay
              ? "Los fines de semana no requieren planificación"
              : isTomorrow 
                ? "Planifica tu trabajo para mañana (requerido para registrar horas)"
                : "Planifica tu trabajo con anticipación"
            }
          </p>
        </div>
        
        {/* Date navigation with DatePicker */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={isTomorrow ? "default" : "outline"} 
                className="min-w-[180px]"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                {format(selectedDate, "EEE d MMM", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && !isWeekend(date) && setSelectedDate(date)}
                disabled={(date) => date < startOfToday() || isWeekend(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={es}
                modifiers={{ absence: absenceDates }}
                modifiersStyles={{
                  absence: { 
                    backgroundColor: 'hsl(var(--warning) / 0.15)', 
                    borderRadius: '50%' 
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Weekend blocker */}
      {isWeekendDay && (
        <div className="bg-muted/50 border rounded-lg p-8 text-center space-y-3">
          <CalendarOff className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">Fin de semana</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No es necesario planificar ni registrar horas en fines de semana.
          </p>
        </div>
      )}
      
      {/* Absence indicator */}
      {!isWeekendDay && absenceForSelectedDate && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palmtree className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">
                {absenceForSelectedDate.absence_type === 'vacation' && '🏖️ Vacaciones'}
                {absenceForSelectedDate.absence_type === 'sick_leave' && '🤒 Baja médica'}
                {absenceForSelectedDate.absence_type === 'personal' && '👤 Asunto personal'}
                {absenceForSelectedDate.absence_type === 'other' && '📅 Ausencia'}
              </p>
              <p className="text-sm text-muted-foreground">
                No se requiere planificación ni registro de horas para este día
              </p>
            </div>
          </div>
          {canEdit && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => removeAbsence(selectedDate)}
              disabled={removingAbsence}
            >
              Cancelar ausencia
            </Button>
          )}
        </div>
      )}
      
      {/* Quick stats */}
      {plan && !absenceForSelectedDate && !isWeekendDay && (
        <div className="flex flex-wrap items-center gap-6 py-3 px-1">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-light tabular-nums">{totalHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">planificadas</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-light tabular-nums">{completedTasks}/{totalTasks}</p>
              <p className="text-xs text-muted-foreground">tareas</p>
            </div>
          </div>
          {isPast && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-light tabular-nums">{actualHours.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">registradas</p>
              </div>
            </>
          )}
        </div>
      )}
      
      {!isWeekendDay && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-4">
            {plan && !absenceForSelectedDate && plan.items.length === 0 && canEdit && (
              <AbsenceMarker
                date={selectedDate}
                canEdit={canEdit}
                onMarkAbsence={addAbsence}
                isLoading={addingAbsence}
              />
            )}
            
            {plan && !absenceForSelectedDate && (
              <DailyPlanForm
                plan={plan}
                targetDate={selectedDate}
                loading={loading}
                saving={saving}
                canEdit={canEdit}
                isBlockingDate={isTomorrow}
                autoCreateTasks={autoCreateTasks}
                onAutoCreateTasksChange={setAutoCreateTasks}
                onAddItem={addItem}
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
                onUpdateNotes={updateNotes}
                onSubmit={submitPlan}
              />
            )}
          </div>
          
          {/* Sidebar with chart */}
          <div className="space-y-4">
            {plan && isPast && !absenceForSelectedDate && (
              <PlanVsRealChart
                plannedHours={totalHours}
                actualHours={actualHours}
                plannedTasks={totalTasks}
                completedTasks={completedTasks}
              />
            )}
            
            {/* Tips card */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm">Consejos</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Planifica tareas realistas para tu jornada</li>
                <li>• Incluye tiempo para imprevistos</li>
                <li>• Prioriza las tareas urgentes</li>
                <li>• Envía tu plan antes de terminar el día</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
