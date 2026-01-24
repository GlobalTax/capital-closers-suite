import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  RefreshCw, 
  Play, 
  ExternalLink, 
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Database,
  Users,
  Building2,
  Loader2,
  Beaker
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { SyncIntegration } from "@/hooks/useSyncCenter";

interface IntegrationCardProps {
  integration: SyncIntegration;
  onSync: () => void;
  onDryRun?: () => void;
  isSyncing: boolean;
  historyUrl?: string;
}

const iconMap = {
  brevo: Mail,
  capittal: Building2,
  database: Database,
  users: Users,
  operations: RefreshCw,
};

const statusConfig = {
  active: {
    label: 'Activo',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  disabled: {
    label: 'Deshabilitado',
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground border-muted',
  },
  never: {
    label: 'Nunca ejecutado',
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-muted',
  },
};

export function IntegrationCard({ 
  integration, 
  onSync, 
  onDryRun,
  isSyncing,
  historyUrl 
}: IntegrationCardProps) {
  const Icon = iconMap[integration.icon] || Database;
  const statusInfo = statusConfig[integration.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      integration.status === 'disabled' && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              integration.status === 'error' 
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {integration.description}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-xs shrink-0", statusInfo.className)}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-foreground">
              {integration.pendingCount}
            </p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-foreground">
              {integration.syncedToday}
            </p>
            <p className="text-xs text-muted-foreground">Hoy</p>
          </div>
          <div className="space-y-1">
            <p className={cn(
              "text-2xl font-semibold",
              integration.errorsLastRun > 0 ? "text-destructive" : "text-foreground"
            )}>
              {integration.errorsLastRun}
            </p>
            <p className="text-xs text-muted-foreground">Errores</p>
          </div>
        </div>

        {/* Last sync time */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-muted-foreground">Última sincronización:</span>
          <span className="font-medium">
            {integration.lastSyncAt 
              ? formatDistanceToNow(new Date(integration.lastSyncAt), { 
                  addSuffix: true, 
                  locale: es 
                })
              : 'Nunca'
            }
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {integration.supportsDryRun && onDryRun && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onDryRun}
                  disabled={isSyncing || !integration.isEnabled}
                  className="flex-1"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Beaker className="h-4 w-4 mr-2" />
                  )}
                  Dry Run
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Simular sin modificar datos</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <Button 
            size="sm"
            onClick={onSync}
            disabled={isSyncing || !integration.isEnabled}
            className="flex-1"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Sincronizar
          </Button>

          {historyUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  asChild
                >
                  <a href={historyUrl}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver historial completo</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
