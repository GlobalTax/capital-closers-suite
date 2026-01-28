import { useState, useEffect } from "react";
import { addDays, format, subDays, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDailyPlan } from "@/hooks/useDailyPlan";
import { DailyPlanForm } from "@/components/plans/DailyPlanForm";
import { PlanVsRealChart } from "@/components/plans/PlanVsRealChart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function PlanDiario() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1)); // Default: tomorrow
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
  
  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(addDays(new Date(), 1));
  
  const tomorrow = addDays(new Date(), 1);
  const isTomorrow = format(selectedDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd');
  const isPast = selectedDate < startOfToday();
  
  const completedTasks = plan?.items.filter(i => i.completed).length || 0;
  const totalTasks = plan?.items.length || 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plan Diario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTomorrow 
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
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < startOfToday()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={es}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Quick stats */}
      {plan && (
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2">
          {plan && (
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
          {plan && isPast && (
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
    </div>
  );
}
