import { useEffect, useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TimeEntriesTable } from "@/components/mandatos/TimeEntriesTable";
import { TimeTrackingDialog } from "@/components/mandatos/TimeTrackingDialog";
import { ActiveTimerWidget } from "@/components/mandatos/ActiveTimerWidget";
import { TimeFilters } from "@/components/mandatos/TimeFilters";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyTimeEntries, getMyActiveTimer, stopTimer } from "@/services/timeTracking";
import { toast } from "sonner";
import type { TimeEntry, MandatoChecklistTask, TimeFilterState, TimeEntryValueType } from "@/types";
import { startOfWeek, startOfMonth, endOfDay, differenceInDays, isToday, isThisWeek } from "date-fns";
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
      setTimeEntries(entries);

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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader title="Mis Horas" description="Tu inversión de tiempo en mandatos" />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Tiempo
        </Button>
      </div>

      {activeTimer && <ActiveTimerWidget activeTimer={activeTimer} onStop={handleStopTimer} />}

      {/* Compact Personal KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-sm bg-card/50">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground mb-1">Hoy</p>
            <p className="text-3xl tabular-nums tracking-tight">{todayHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card/50">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground mb-1">Esta Semana</p>
            <p className="text-3xl tabular-nums tracking-tight">{thisWeekHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card/50">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground mb-1">Este Mes</p>
            <p className="text-3xl tabular-nums tracking-tight">{thisMonthHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-card/50">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground mb-1">Ratio Core M&A</p>
            <p className="text-3xl tabular-nums tracking-tight" style={{ color: VALUE_TYPE_CONFIG.core_ma.color }}>
              {corePercentage.toFixed(0)}%
            </p>
            {/* Mini stacked bar */}
            <div className="h-1.5 rounded-full overflow-hidden flex bg-muted/30 mt-3">
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
          </CardContent>
        </Card>
      </div>

      <TimeFilters filters={filters} onChange={setFilters} mandatos={mandatos} showUserFilter={false} />

      {/* Time Entries Table */}
      <div className="space-y-4">
        <h3 className="text-lg">Mis Registros</h3>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando registros...</div>
        ) : (
          <TimeEntriesTable 
            entries={timeEntries} 
            currentUserId={currentUserId} 
            isAdmin={isAdmin} 
            onRefresh={loadMyTimeData}
            showMandato={true}
            pageSize={20}
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
