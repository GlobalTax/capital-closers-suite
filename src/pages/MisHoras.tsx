import { useState, useEffect } from "react";
import { Clock, Play, Square, TrendingUp, Calendar, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TimeEntriesTable } from "@/components/mandatos/TimeEntriesTable";
import { TimeTrackingDialog } from "@/components/mandatos/TimeTrackingDialog";
import { 
  fetchTimeEntries, 
  getTimeStats, 
  getMyActiveTimer,
  startTimer,
  stopTimer 
} from "@/services/timeTracking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { TimeEntry, TimeStats } from "@/types";

export default function MisHoras() {
  const { toast } = useToast();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  const loadMyTimeData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      setCurrentUserId(user.id);

      // Check if admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(adminUser?.role === 'admin' || adminUser?.role === 'super_admin');

      // Load all my time entries (no mandato filter)
      const entries = await fetchTimeEntries(undefined as any, { userId: user.id });
      setTimeEntries(entries);

      // Load my stats
      const stats = await getTimeStats(undefined as any);
      setTimeStats(stats);

      // Check for active timer
      const timer = await getMyActiveTimer();
      setActiveTimer(timer);

      // Load available tasks from all my mandatos
      const { data: tasks } = await supabase
        .from('mandato_checklist_tasks')
        .select('*, mandatos(descripcion)')
        .order('created_at', { ascending: false });
      
      setAvailableTasks(tasks || []);
    } catch (error) {
      console.error('Error loading time data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de tiempo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      await stopTimer(activeTimer.id);
      toast({
        title: "Timer detenido",
        description: "El tiempo ha sido registrado",
      });
      loadMyTimeData();
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Error",
        description: "No se pudo detener el timer",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadMyTimeData();
  }, []);

  const todayHours = timeStats?.total_hours || 0;
  const thisWeekHours = timeStats?.total_hours || 0;
  const billablePercentage = timeStats?.total_hours 
    ? ((timeStats.billable_hours / timeStats.total_hours) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Mis Horas</h1>
          <p className="text-muted-foreground mt-1">Gestiona y visualiza tu tiempo de trabajo</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Clock className="mr-2 h-4 w-4" />
          Registrar Tiempo
        </Button>
      </div>

      {/* Active Timer Widget */}
      {activeTimer && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                Timer Activo
              </div>
              <Button onClick={handleStopTimer} variant="destructive" size="sm">
                <Square className="mr-2 h-4 w-4" />
                Detener
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{activeTimer.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{activeTimer.work_type}</Badge>
                <span className="text-xs text-muted-foreground">
                  Iniciado: {new Date(activeTimer.start_time).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayHours.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekHours.toFixed(1)}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Facturables</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(timeStats?.billable_hours || 0).toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              {billablePercentage}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Diario</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((timeStats?.total_hours || 0) / 30).toFixed(1)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Registros de Tiempo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <TimeEntriesTable 
              entries={timeEntries} 
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onRefresh={loadMyTimeData}
            />
          )}
        </CardContent>
      </Card>

      <TimeTrackingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mandatoId="" 
        tasks={availableTasks}
        onSuccess={loadMyTimeData}
      />
    </div>
  );
}
