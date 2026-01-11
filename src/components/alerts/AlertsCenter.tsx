import { useState } from "react";
import { Bell, AlertTriangle, AlertCircle, Info, X, Check, RefreshCw, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  useActiveAlerts, 
  useAlertStats,
  useGenerateAlerts,
  useMarkAlertAsRead,
  useDismissAlert,
  useMarkAllAlertsAsRead
} from "@/hooks/useAlerts";
import type { ActiveAlert, AlertSeverity } from "@/types/alerts";

const severityConfig: Record<AlertSeverity, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  critical: { icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-500/10" },
  warning: { icon: AlertCircle, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10" },
};

function AlertItem({ 
  alert, 
  onRead, 
  onDismiss 
}: { 
  alert: ActiveAlert; 
  onRead: () => void;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();
  const config = severityConfig[alert.severity] || severityConfig.info;
  const Icon = config.icon;

  const handleClick = () => {
    if (!alert.is_read) {
      onRead();
    }
    navigate(`/mandatos/${alert.mandato_id}`);
  };

  return (
    <div 
      className={cn(
        "p-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer relative group",
        !alert.is_read && "bg-muted/30"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-1.5 rounded-md shrink-0", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={cn("text-sm font-medium truncate", !alert.is_read && "font-medium")}>
              {alert.title}
            </p>
            {!alert.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
          
          {alert.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
              {alert.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {alert.empresa_nombre && (
              <span className="truncate max-w-[120px]">{alert.empresa_nombre}</span>
            )}
            <span>•</span>
            <span>
              {new Date(alert.created_at).toLocaleDateString('es-ES', { 
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function AlertsCenter() {
  const [open, setOpen] = useState(false);
  
  const { data: alerts = [], isLoading: loadingAlerts } = useActiveAlerts();
  const { data: stats } = useAlertStats();
  const generateAlerts = useGenerateAlerts();
  const markAsRead = useMarkAlertAsRead();
  const dismissAlert = useDismissAlert();
  const markAllAsRead = useMarkAllAlertsAsRead();

  const unreadCount = stats?.unread || 0;
  const criticalCount = stats?.critical || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] font-medium",
                criticalCount > 0 && "animate-pulse"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">Alertas</h3>
            {stats && (
              <div className="flex items-center gap-1.5">
                {stats.critical > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5">
                    {stats.critical} críticas
                  </Badge>
                )}
                {stats.warning > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 border-amber-500/30 text-amber-600">
                    {stats.warning}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => generateAlerts.mutate()}
              disabled={generateAlerts.isPending}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", generateAlerts.isPending && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead.mutate()}
              >
                <Check className="h-3 w-3 mr-1" />
                Leer todas
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {loadingAlerts ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No hay alertas activas</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => generateAlerts.mutate()}
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Verificar ahora
              </Button>
            </div>
          ) : (
            alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onRead={() => markAsRead.mutate(alert.id)}
                onDismiss={() => dismissAlert.mutate(alert.id)}
              />
            ))
          )}
        </ScrollArea>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="p-2 border-t border-border bg-muted/30">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs justify-center"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Ver todas en Pipeline
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
