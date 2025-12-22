import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Clock,
  TrendingDown,
  Calendar,
  Pause
} from "lucide-react";
import { useActiveAlerts, useAlertStats } from "@/hooks/useAlerts";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { AlertType } from "@/types/alerts";

const alertTypeConfig: Record<AlertType, { icon: React.ElementType; label: string }> = {
  inactive_mandate: { icon: Pause, label: "Inactivo" },
  overdue_task: { icon: Clock, label: "Tarea vencida" },
  stuck_deal: { icon: TrendingDown, label: "Estancado" },
  upcoming_deadline: { icon: Calendar, label: "Cierre próximo" },
  missing_document: { icon: AlertCircle, label: "Doc. faltante" },
  low_probability: { icon: TrendingDown, label: "Prob. baja" },
  critical_task_overdue: { icon: AlertTriangle, label: "Crítico" },
};

const severityStyles = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  warning: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

export function AlertsSummaryWidget() {
  const navigate = useNavigate();
  const { data: alerts, isLoading: loadingAlerts } = useActiveAlerts();
  const { data: stats, isLoading: loadingStats } = useAlertStats();

  const topAlerts = alerts?.slice(0, 4) || [];

  if (loadingAlerts || loadingStats) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Alertas M&A
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = stats && stats.total > 0;

  return (
    <Card className={hasAlerts && stats.critical > 0 ? "border-destructive/50" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Alertas M&A
            {stats && stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread} nuevas
              </Badge>
            )}
          </CardTitle>
          {hasAlerts && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/alertas")}>
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Stats badges */}
        {hasAlerts && (
          <div className="flex gap-2 mt-2">
            {stats.critical > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {stats.critical} críticas
              </Badge>
            )}
            {stats.warning > 0 && (
              <Badge className="gap-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30">
                <AlertCircle className="h-3 w-3" />
                {stats.warning} advertencias
              </Badge>
            )}
            {stats.info > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Info className="h-3 w-3" />
                {stats.info} info
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {!hasAlerts ? (
          <div className="text-center py-6">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hay alertas activas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Todos los mandatos están al día
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {topAlerts.map((alert) => {
              const config = alertTypeConfig[alert.alert_type as AlertType] || { 
                icon: AlertCircle, 
                label: alert.alert_type 
              };
              const Icon = config.icon;
              
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                    severityStyles[alert.severity as keyof typeof severityStyles] || severityStyles.info
                  }`}
                  onClick={() => navigate(`/mandatos/${alert.mandato_id}`)}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {alert.title}
                      </p>
                      {alert.empresa_nombre && (
                        <p className="text-xs opacity-80 mt-0.5">
                          {alert.empresa_nombre}
                        </p>
                      )}
                      <p className="text-xs opacity-60 mt-1">
                        {formatDistanceToNow(new Date(alert.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {config.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
            
            {alerts && alerts.length > 4 && (
              <Button 
                variant="ghost" 
                className="w-full mt-2 text-muted-foreground"
                onClick={() => navigate("/alertas")}
              >
                +{alerts.length - 4} alertas más
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
