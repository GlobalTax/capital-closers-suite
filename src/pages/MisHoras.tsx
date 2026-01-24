import { useEffect, useState } from "react";
import { CompactTimeEntriesTable } from "@/components/mandatos/CompactTimeEntriesTable";
import { ActiveTimerWidget } from "@/components/mandatos/ActiveTimerWidget";
import { TimeFilterBar } from "@/components/mandatos/TimeFilterBar";
import { TimeEntryInlineForm } from "@/components/mandatos/TimeEntryInlineForm";
import { TimeEntryEditDialog } from "@/components/mandatos/TimeEntryEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyTimeEntries, getMyActiveTimer, stopTimer } from "@/services/timeTracking";
import { toast } from "sonner";
import type { TimeEntry, MandatoChecklistTask, TimeFilterState } from "@/types";
import { startOfMonth, endOfDay, isToday, isThisWeek } from "date-fns";
import { Filter } from "lucide-react";

export default function MisHoras() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableTasks, setAvailableTasks] = useState<MandatoChecklistTask[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mandatos, setMandatos] = useState<{ id: string; name: string }[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [filters, setFilters] = useState<TimeFilterState>({
    startDate: startOfMonth(new Date()),
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

  // Check if filters are active (beyond defaults)
  const hasActiveFilters = filters.mandatoId !== 'all' || 
                            filters.status !== 'all' || 
                            filters.valueType !== 'all';

  // Filtered total hours
  const filteredTotalHours = timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - responsive */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Mis Horas</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Tu inversión de tiempo</p>
      </div>

      {activeTimer && <ActiveTimerWidget activeTimer={activeTimer} onStop={handleStopTimer} />}

      {/* Compact KPIs - Responsive */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6 py-3 md:py-4 px-1">
        <div>
          <p className="text-2xl md:text-3xl font-light tabular-nums tracking-tight">{todayHours.toFixed(1)}h</p>
          <p className="text-[10px] md:text-xs text-muted-foreground">hoy</p>
        </div>
        <div className="h-6 md:h-8 w-px bg-border" />
        <div>
          <p className="text-2xl md:text-3xl font-light tabular-nums tracking-tight">{thisWeekHours.toFixed(1)}h</p>
          <p className="text-[10px] md:text-xs text-muted-foreground">semana</p>
        </div>
        <div className="h-6 md:h-8 w-px bg-border" />
        <div>
          <p className="text-2xl md:text-3xl font-light tabular-nums tracking-tight">{thisMonthHours.toFixed(1)}h</p>
          <p className="text-[10px] md:text-xs text-muted-foreground">mes</p>
        </div>
      </div>

      {/* Filtered indicator - only show when filters are active */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
          <Filter className="h-4 w-4" />
          <span>
            Filtrado: <span className="font-medium text-foreground">{filteredTotalHours.toFixed(1)}h</span>
            {' '}({timeEntries.length} {timeEntries.length === 1 ? 'entrada' : 'entradas'})
          </span>
        </div>
      )}

      {/* Inline Time Entry Form */}
      <TimeEntryInlineForm onSuccess={loadMyTimeData} />

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
            onEditEntry={(entry) => setEditingEntry(entry)}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <TimeEntryEditDialog
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        onSuccess={() => {
          setEditingEntry(null);
          loadMyTimeData();
        }}
      />
    </div>
  );
}
