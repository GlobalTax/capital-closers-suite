import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExecutiveTimeKPIs } from "@/components/mandatos/ExecutiveTimeKPIs";
import { OperationalTimeKPIs } from "@/components/mandatos/OperationalTimeKPIs";
import { TimeFilterBar } from "@/components/mandatos/TimeFilterBar";
import { TimeEntriesTable } from "@/components/mandatos/TimeEntriesTable";
import { ValueVsInvestmentChart } from "@/components/mandatos/ValueVsInvestmentChart";
import { InvestmentByMandatoChart } from "@/components/mandatos/InvestmentByMandatoChart";
import { AtRiskMandatosPanel } from "@/components/mandatos/AtRiskMandatosPanel";
import { HoursByWeekChart } from "@/components/mandatos/HoursByWeekChart";
import { HoursTrendChart } from "@/components/mandatos/HoursTrendChart";
import { ResponsablePanel } from "@/components/mandatos/ResponsablePanel";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllTimeEntries } from "@/services/timeTracking";
import { toast } from "sonner";
import type { TimeEntry, TimeFilterState } from "@/types";
import { startOfWeek, endOfWeek } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronDown, BarChart3, UserCheck, ClipboardList } from "lucide-react";
import { ComplianceDashboard } from "@/components/plans/ComplianceDashboard";

export default function HorasEquipo() {
  const { user, adminUser } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [mandatos, setMandatos] = useState<{ id: string; name: string }[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState<TimeFilterState>({
    startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
    endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
    userId: 'all',
    mandatoId: 'all',
    status: 'all',
    workType: 'Otro',
    valueType: 'all',
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
          <h2 className="text-2xl">Acceso Denegado</h2>
          <p className="text-muted-foreground">
            Solo los Super Administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Inversión del Equipo"
        description="¿Estamos invirtiendo bien el tiempo?"
      />

      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="resumen" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="responsable" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Panel Responsable
          </TabsTrigger>
          <TabsTrigger value="control-planes" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Control Planes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen (existing content) */}
        <TabsContent value="resumen" className="space-y-8">
          {/* Executive KPIs - Strategic metrics */}
          <ExecutiveTimeKPIs entries={timeEntries} loading={loading} />

          {/* Operational KPIs - Quick numbers */}
          <OperationalTimeKPIs entries={timeEntries} loading={loading} />

          {/* Compact Filter Bar */}
          <TimeFilterBar
            filters={filters}
            onChange={setFilters}
            users={users}
            mandatos={mandatos}
            showUserFilter={true}
          />

          {/* Main Chart - Strategic Matrix (LARGE) */}
          <ValueVsInvestmentChart
            entries={timeEntries}
            hoursThreshold={40}
            probabilityThreshold={50}
            loading={loading}
          />

          {/* Risk Alerts */}
          <AtRiskMandatosPanel
            entries={timeEntries}
            minHoursThreshold={30}
            maxProbability={40}
            loading={loading}
          />

          {/* Investment by Mandato */}
          <InvestmentByMandatoChart 
            entries={timeEntries} 
            limit={10}
            loading={loading}
          />

          {/* Collapsible Detailed Analysis */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between text-muted-foreground hover:text-foreground h-12"
              >
                <span>Análisis detallado</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HoursByWeekChart entries={timeEntries} weeks={4} />
                <HoursTrendChart entries={timeEntries} weeks={8} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Time Entries Table */}
          <div className="space-y-4">
            <h3 className="text-lg">Registros de Tiempo</h3>
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
        </TabsContent>

        {/* Tab: Panel Responsable */}
        <TabsContent value="responsable">
          <ResponsablePanel
            entries={timeEntries}
            users={users}
            mandatos={mandatos}
            loading={loading}
          />
        </TabsContent>

        {/* Tab: Control Planes */}
        <TabsContent value="control-planes">
          <ComplianceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
