import { useState } from "react";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  Send, 
  TrendingUp,
  CalendarDays,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlanCompliance } from "@/hooks/usePlanCompliance";
import { WeeklyComplianceGrid } from "./WeeklyComplianceGrid";
import { toast } from "sonner";
import type { DailyPlanStatus } from "@/types/dailyPlans";

export function ComplianceDashboard() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
  const { compliance, stats, loading, refresh, weekDays } = usePlanCompliance(weekStart);

  const handlePrevWeek = () => setWeekStart(subWeeks(weekStart, 1));
  const handleNextWeek = () => setWeekStart(addWeeks(weekStart, 1));
  const handleCurrentWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const isCurrentWeek = format(weekStart, 'yyyy-MM-dd') === 
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const handleCellClick = (
    userId: string, 
    date: string, 
    planId?: string, 
    status?: DailyPlanStatus | 'none'
  ) => {
    // Navigate to admin plans page with the selected date
    navigate(`/admin/planes-diarios?date=${date}&user=${userId}`);
  };

  const handleViewPending = () => {
    navigate('/admin/planes-diarios');
  };

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Dashboard de Cumplimiento</h2>
          <p className="text-sm text-muted-foreground">
            Vista semanal del estado de planificación del equipo
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant={isCurrentWeek ? "default" : "outline"}
            onClick={handleCurrentWeek}
            className="min-w-[180px]"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            {format(weekStart, "d MMM", { locale: es })} - {format(addWeeks(weekStart, 1), "d MMM", { locale: es })}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              refresh();
              toast.success('Datos actualizados');
            }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">
                  {stats?.usersWithPlans || 0}/{stats?.totalUsers || 0}
                </p>
                <p className="text-xs text-muted-foreground">usuarios con planes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleViewPending}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-semibold text-blue-600">
                  {stats?.plansPendingReview || 0}
                </p>
                <p className="text-xs text-muted-foreground">pendientes de revisar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-semibold text-green-600">
                  {stats?.plansApproved || 0}
                </p>
                <p className="text-xs text-muted-foreground">aprobados esta semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-semibold">
                  {stats?.averageComplianceRate || 0}%
                </p>
                <p className="text-xs text-muted-foreground">cumplimiento promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Matriz de Cumplimiento Semanal</span>
            <div className="flex items-center gap-4 text-xs font-normal">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500/30" />
                <span>Aprobado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500/30" />
                <span>Enviado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500/30" />
                <span>Borrador</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted" />
                <span>Sin plan</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyComplianceGrid
            compliance={compliance}
            weekDays={weekDays}
            onCellClick={handleCellClick}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
