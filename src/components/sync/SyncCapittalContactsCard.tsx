import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  History
} from 'lucide-react';
import { useSyncContactsFromCapittal, SyncLogEntry } from '@/hooks/useSyncContactsFromCapittal';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function StatusBadge({ status }: { status: SyncLogEntry['status'] }) {
  const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: React.ReactNode }> = {
    completed: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    partial: { variant: 'secondary', icon: <AlertTriangle className="h-3 w-3" /> },
    running: { variant: 'outline', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  };
  
  const { variant, icon } = variants[status] || variants.running;
  
  return (
    <Badge variant={variant} className="gap-1">
      {icon}
      {status}
    </Badge>
  );
}

function SyncHistoryItem({ log }: { log: SyncLogEntry }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        <StatusBadge status={log.status} />
        <div className="text-sm">
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: es })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        {log.contacts_created > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <ArrowUpRight className="h-3 w-3" />
            {log.contacts_created}
          </span>
        )}
        {log.contacts_updated > 0 && (
          <span className="flex items-center gap-1 text-blue-600">
            <ArrowDownRight className="h-3 w-3" />
            {log.contacts_updated}
          </span>
        )}
        {log.errors && log.errors.length > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-3 w-3" />
            {log.errors.length}
          </span>
        )}
      </div>
    </div>
  );
}

export function SyncCapittalContactsCard() {
  const {
    stats,
    history,
    isLoading,
    isSyncing,
    syncNow,
    updateSettings,
    isUpdatingSettings,
  } = useSyncContactsFromCapittal();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sincronización Capittal → GoDeal
            </CardTitle>
            <CardDescription>
              Importación unidireccional de contactos desde Capittal
            </CardDescription>
          </div>
          <Button
            onClick={() => syncNow()}
            disabled={isSyncing}
            size="sm"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar ahora
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats?.totalSynced || 0}</div>
            <div className="text-sm text-muted-foreground">Total sincronizados</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">+{stats?.todayCreated || 0}</div>
            <div className="text-sm text-muted-foreground">Creados hoy</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats?.todayUpdated || 0}</div>
            <div className="text-sm text-muted-foreground">Actualizados hoy</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {stats?.lastSyncAt 
                  ? formatDistanceToNow(new Date(stats.lastSyncAt), { addSuffix: true, locale: es })
                  : 'Nunca'
                }
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Último sync</div>
          </div>
        </div>

        {/* Settings */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync">Sincronización automática</Label>
            <div className="text-sm text-muted-foreground">
              Polling cada {stats?.pollingInterval || 5} minutos
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={String(stats?.pollingInterval || 5)}
              onValueChange={(value) => updateSettings({ polling_interval_minutes: parseInt(value) })}
              disabled={isUpdatingSettings}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 min</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
              </SelectContent>
            </Select>
            <Switch
              id="auto-sync"
              checked={stats?.isEnabled ?? true}
              onCheckedChange={(checked) => updateSettings({ is_enabled: checked })}
              disabled={isUpdatingSettings}
            />
          </div>
        </div>

        {/* History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Historial de sincronizaciones</h4>
          </div>
          <div className="border rounded-lg divide-y">
            {history.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No hay sincronizaciones registradas
              </div>
            ) : (
              history.slice(0, 5).map((log) => (
                <SyncHistoryItem key={log.id} log={log} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
