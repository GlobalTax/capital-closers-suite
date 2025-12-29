import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, Users, Building2, Clock, CheckCircle2, 
  AlertCircle, ArrowRightLeft, Calendar
} from "lucide-react";
import { useSyncLeads } from "@/hooks/useSyncLeads";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function SyncLeadsCard() {
  const { stats, statsLoading, history, historyLoading, isSyncing, syncNow } = useSyncLeads();

  if (statsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          Sincronización de Leads
        </CardTitle>
        <CardDescription>
          Sincroniza automáticamente leads de capittal.es al CRM cada hora
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              Pendientes
            </div>
            <div className="text-2xl font-bold">{stats?.totalPending || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats?.pendingValuations || 0} valoraciones, {stats?.pendingContactLeads || 0} contactos, {stats?.pendingGeneralLeads || 0} generales
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Sincronizados hoy
            </div>
            <div className="text-2xl font-bold text-green-600">{stats?.syncedToday || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Última sync: {stats?.lastSync 
                ? formatDistanceToNow(new Date(stats.lastSync), { addSuffix: true, locale: es })
                : 'Nunca'}
            </div>
          </div>
        </div>

        {/* Sync Button */}
        <Button 
          onClick={() => syncNow()} 
          disabled={isSyncing || (stats?.totalPending || 0) === 0}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </Button>

        {/* Recent History */}
        {!historyLoading && history && history.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Historial reciente</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.slice(0, 5).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(log.started_at).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="w-3 h-3" />
                      {log.contactos_created}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Building2 className="w-3 h-3" />
                      {log.empresas_created}
                    </div>
                    <Badge 
                      variant={log.status === 'completed' ? 'default' : log.status === 'running' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {log.status === 'completed' ? 'OK' : 
                       log.status === 'running' ? 'En curso' : 
                       log.status === 'completed_with_errors' ? 'Con errores' : 'Error'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info about automatic sync */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-blue-800 dark:text-blue-200">
            La sincronización automática se ejecuta cada hora. Los leads se vinculan a contactos y empresas existentes o se crean nuevos registros.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
