import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntriesTable } from "@/components/mandatos/TimeEntriesTable";
import { TimeTrackingDialog } from "@/components/mandatos/TimeTrackingDialog";
import { ActiveTimerWidget } from "@/components/mandatos/ActiveTimerWidget";
import { TimeFilters } from "@/components/mandatos/TimeFilters";
import { HoursByWeekChart } from "@/components/mandatos/HoursByWeekChart";
import { HoursByTypeChart } from "@/components/mandatos/HoursByTypeChart";
import { HoursTrendChart } from "@/components/mandatos/HoursTrendChart";
import { TaskTimeWidget } from "@/components/mandatos/TaskTimeWidget";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyTimeEntries, getMyTimeStats, getMyActiveTimer, stopTimer } from "@/services/timeTracking";
import { toast } from "sonner";
import type { TimeEntry, TimeStats, MandatoChecklistTask, TimeFilterState } from "@/types";
import { startOfWeek, startOfMonth, endOfDay, differenceInDays, isToday, isThisWeek } from "date-fns";

export default function MisHoras() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<TimeStats | null>(null);
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

      const entries = await fetchMyTimeEntries(user.id, {
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        mandatoId: filters.mandatoId !== 'all' ? filters.mandatoId : undefined,
        status: filters.status !== 'all' ? filters.status : undefined
      });
      setTimeEntries(entries);

      const allUserEntries = await fetchMyTimeEntries(user.id, { status: 'approved' });
      setAllEntries(allUserEntries);

      const userStats = await getMyTimeStats(user.id);
      setStats(userStats);

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

  const todayHours = allEntries.filter(e => isToday(new Date(e.start_time))).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
  const thisWeekHours = allEntries.filter(e => isThisWeek(new Date(e.start_time), { weekStartsOn: 1 })).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthHours = allEntries.filter(e => new Date(e.start_time) >= thisMonthStart).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
  const billableHours = allEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
  const workingDays = Math.max(differenceInDays(new Date(), thisMonthStart) + 1, 1);
  const averageDailyHours = thisMonthHours / workingDays;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Mis Horas" description="Gestiona tu tiempo dedicado a mandatos" />
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Registrar Tiempo</Button>
      </div>

      {activeTimer && <ActiveTimerWidget activeTimer={activeTimer} onStop={handleStopTimer} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Horas Hoy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{todayHours.toFixed(1)}h</div><p className="text-xs text-muted-foreground mt-1">Aprobadas hoy</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Esta Semana</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{thisWeekHours.toFixed(1)}h</div><p className="text-xs text-muted-foreground mt-1">Últimos 7 días</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Horas Facturables</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{billableHours.toFixed(1)}h</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Promedio Diario</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{averageDailyHours.toFixed(1)}h</div><p className="text-xs text-muted-foreground mt-1">Este mes</p></CardContent></Card>
      </div>

      <TimeFilters filters={filters} onChange={setFilters} mandatos={mandatos} showUserFilter={false} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HoursByWeekChart entries={allEntries} weeks={4} />
        <HoursByTypeChart entries={allEntries} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HoursTrendChart entries={allEntries} weeks={8} />
        </div>
        <TaskTimeWidget entries={allEntries} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mis Registros de Tiempo</h3>
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
