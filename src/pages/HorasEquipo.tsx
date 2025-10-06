import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { TeamTimeStats } from "@/components/mandatos/TeamTimeStats";
import { TimeFilters } from "@/components/mandatos/TimeFilters";
import { TimeEntriesTable } from "@/components/mandatos/TimeEntriesTable";
import { HoursByWeekChart } from "@/components/mandatos/HoursByWeekChart";
import { HoursByTypeChart } from "@/components/mandatos/HoursByTypeChart";
import { HoursTrendChart } from "@/components/mandatos/HoursTrendChart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllTimeEntries, getAllTimeStats } from "@/services/timeTracking";
import { toast } from "sonner";
import type { TimeEntry, TeamStats, TimeFilterState, Mandato } from "@/types";
import { startOfWeek, endOfWeek } from "date-fns";

export default function HorasEquipo() {
  const { user, adminUser } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [mandatos, setMandatos] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState<TimeFilterState>({
    startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
    endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
    userId: 'all',
    mandatoId: 'all',
    status: 'all',
    workType: 'Otro',
    onlyBillable: false
  });

  useEffect(() => {
    if (user && adminUser?.role === 'super_admin') {
      loadAllData();
    }
  }, [user, adminUser, filters]);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load users
      const { data: usersData } = await supabase
        .from('admin_users')
        .select('user_id, full_name')
        .eq('is_active', true);

      if (usersData) {
        setUsers(usersData.map(u => ({
          id: u.user_id,
          name: u.full_name || 'Usuario'
        })));
      }

      // Load mandatos
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

      // Load time entries with filters
      const entries = await fetchAllTimeEntries({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        userId: filters.userId !== 'all' ? filters.userId : undefined,
        mandatoId: filters.mandatoId !== 'all' ? filters.mandatoId : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        workType: (filters.workType !== 'Otro' && filters.workType !== 'all') ? filters.workType : undefined,
        onlyBillable: filters.onlyBillable
      });

      setTimeEntries(entries);

      // Load team stats
      const stats = await getAllTimeStats({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        userId: filters.userId !== 'all' ? filters.userId : undefined,
        mandatoId: filters.mandatoId !== 'all' ? filters.mandatoId : undefined
      });

      setTeamStats(stats);
    } catch (error: any) {
      console.error("Error loading team time data:", error);
      toast.error("Error al cargar datos del equipo");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAllData();
  };

  if (adminUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Acceso Denegado</h2>
          <p className="text-muted-foreground">
            Solo los Super Administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Horas del Equipo"
        description="Panel de control para supervisar el tiempo del equipo"
      />

      <TeamTimeStats stats={teamStats} loading={loading} />

      <TimeFilters
        filters={filters}
        onChange={setFilters}
        users={users}
        mandatos={mandatos}
        showUserFilter={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HoursByWeekChart entries={timeEntries} weeks={4} />
        <HoursByTypeChart entries={timeEntries} />
      </div>

      <HoursTrendChart entries={timeEntries} weeks={8} />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Registros de Tiempo del Equipo</h3>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando registros...
          </div>
        ) : (
          <TimeEntriesTable
            entries={timeEntries}
            currentUserId={user?.id || ''}
            isAdmin={true}
            onRefresh={handleRefresh}
            showMandato={true}
            pageSize={20}
          />
        )}
      </div>
    </div>
  );
}
