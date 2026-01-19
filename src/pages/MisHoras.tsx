import { useEffect, useState, useMemo } from "react";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactTimeEntriesTable } from "@/components/mandatos/CompactTimeEntriesTable";
import { TimeTrackingDialog } from "@/components/mandatos/TimeTrackingDialog";
import { ActiveTimerWidget } from "@/components/mandatos/ActiveTimerWidget";
import { TimeFilterBar } from "@/components/mandatos/TimeFilterBar";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyTimeEntries, getMyActiveTimer, stopTimer } from "@/services/timeTracking";
import { toast } from "sonner";
import type { TimeEntry, MandatoChecklistTask, TimeFilterState, TimeEntryValueType } from "@/types";
import { startOfWeek, startOfMonth, endOfDay, isToday, isThisWeek } from "date-fns";
import { VALUE_TYPE_CONFIG } from "@/types";

export default function MisHoras() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<MandatoChecklistTask[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mandatos, setMandatos] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<TimeFilterState>({
    startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
    endDate: endOfDay(new Date()),
    userId: 'all',
    mandatoId: 'all',
    status: 'all',
    workType: 'Otro',
    valueType: 'all',
    onlyBillable: false
  });

  useEffect(() => {
    loadMyTimeData();
  }, [filters]);

  const loadMyTimeData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(adminUser?.role === 'admin' || adminUser?.role === 'super_admin');

      const sanitizedMandatoId = filters.mandatoId && 
                                  filters.mandatoId !== 'all' && 
                                  filters.mandatoId !== 'undefined'
        ? filters.mandatoId 
        : undefined;

      const entries = await fetchMyTimeEntries(user.id, {
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        mandatoId: sanitizedMandatoId,
        status: filters.status !== 'all' ? filters.status : undefined
      });
      
      // Client-side filter for value type
      const filteredEntries = filters.valueType !== 'all' 
        ? entries.filter(e => e.value_type === filters.valueType)
        : entries;
      
      setTimeEntries(filteredEntries);

      const allUserEntries = await fetchMyTimeEntries(user.id, { status: 'approved' });
      setAllEntries(allUserEntries);

      const timer = await getMyActiveTimer();
      setActiveTimer(timer);

      const { data: mandatosData } = await supabase
        .from('mandatos')
        .select('id, descripcion, tipo')
        .order('created_at', { ascending: false });
      
      if (mandatosData) {
        setMandatos(mandatosData.map((m) => ({
          id: m.id,
          name: m.descripcion || `Mandato ${m.tipo}`
        })));
      }

      const { data: tasks } = await supabase
        .from('mandato_checklist_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      setAvailableTasks((tasks || []) as MandatoChecklistTask[]);
    } catch (error: any) {
      console.error("Error loading my time data:", error);
      toast.error("Error al cargar tus horas");
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    try {
      await stopTimer(activeTimer.id);
      toast.success("Timer detenido");
      await loadMyTimeData();
    } catch (error) {
      toast.error("Error al detener timer");
    }
  };

  // Calculate metrics
  const todayHours = allEntries.filter(e => isToday(new Date(e.start_time))).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
  const thisWeekHours = allEntries.filter(e => isThisWeek(new Date(e.start_time), { weekStartsOn: 1 })).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthHours = allEntries.filter(e => new Date(e.start_time) >= thisMonthStart).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;

  // Value distribution for personal view
  const valueDistribution = useMemo(() => {
    const dist = { core_ma: 0, soporte: 0, bajo_valor: 0, total: 0 };
    allEntries.forEach(entry => {
      const hours = (entry.duration_minutes || 0) / 60;
      dist.total += hours;
      if (entry.value_type && entry.value_type in dist) {
        dist[entry.value_type] += hours;
      }
    });
    return dist;
  }, [allEntries]);

  const corePercentage = valueDistribution.total > 0 
    ? (valueDistribution.core_ma / valueDistribution.total) * 100 
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with prominent action */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis Horas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tu inversión de tiempo</p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)}
          className="px-5"
        >
          <Timer className="mr-2 h-4 w-4" />
          Registrar Tiempo
        </Button>
      </div>

      {activeTimer && <ActiveTimerWidget activeTimer={activeTimer} onStop={handleStopTimer} />}

      {/* Compact KPIs - Horizontal inline */}
      <div className="flex flex-wrap items-center gap-6 py-4 px-1">
        <div>
          <p className="text-3xl font-light tabular-nums tracking-tight">{todayHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">hoy</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-3xl font-light tabular-nums tracking-tight">{thisWeekHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">esta semana</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-3xl font-light tabular-nums tracking-tight">{thisMonthHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">este mes</p>
        </div>
        <div className="h-8 w-px bg-border hidden sm:block" />
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <p 
              className="text-3xl font-light tabular-nums tracking-tight"
              style={{ color: VALUE_TYPE_CONFIG.core_ma.color }}
            >
              {corePercentage.toFixed(0)}%
            </p>
            {/* Mini stacked bar */}
            <div className="h-6 w-24 rounded-full overflow-hidden flex bg-muted/30">
              {(['core_ma', 'soporte', 'bajo_valor'] as TimeEntryValueType[]).map(type => {
                const pct = valueDistribution.total > 0 
                  ? (valueDistribution[type] / valueDistribution.total) * 100 
                  : 0;
                return (
                  <div 
                    key={type}
                    className="h-full"
                    style={{ 
                      width: `${pct}%`,
                      backgroundColor: VALUE_TYPE_CONFIG[type].color 
                    }}
                  />
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Core M&A</p>
        </div>
      </div>

      {/* Filter Bar - Horizontal chips */}
      <TimeFilterBar 
        filters={filters} 
        onChange={setFilters} 
        mandatos={mandatos} 
        showUserFilter={false} 
      />

      {/* Time Entries - Compact grouped */}
      <div className="pt-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/30 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <CompactTimeEntriesTable 
            entries={timeEntries} 
            currentUserId={currentUserId} 
            isAdmin={isAdmin} 
            onRefresh={loadMyTimeData}
            onOpenDialog={() => setDialogOpen(true)}
          />
        )}
      </div>

      <TimeTrackingDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={() => { 
          setDialogOpen(false); 
          loadMyTimeData(); 
        }} 
      />
    </div>
  );
}
