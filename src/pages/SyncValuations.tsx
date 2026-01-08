import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  RefreshCw, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Users, 
  FileText,
  Clock,
  Link2,
  Unlink2
} from "lucide-react";
import { useSyncStats, useSyncHistory, useRunSync } from "@/hooks/useSyncValuations";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SyncValuations() {
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useSyncStats();
  const { data: history, isLoading: loadingHistory } = useSyncHistory();
  const runSyncMutation = useRunSync();
  const [lastResult, setLastResult] = useState<{
    empresas_created: number;
    contactos_created: number;
    errors_count: number;
    duration_ms: number;
  } | null>(null);

  const handleDryRun = async () => {
    const result = await runSyncMutation.mutateAsync(true);
    setLastResult(result);
  };

  const handleSync = async () => {
    const result = await runSyncMutation.mutateAsync(false);
    setLastResult(result);
    refetchStats();
  };

  const syncProgress = stats 
    ? Math.round((stats.valuations_with_empresa / stats.total_valuations) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sincronizar Valoraciones"
        description="Importa empresas y contactos desde las valoraciones al CRM"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Valoraciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-medium">{stats?.total_valuations || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Leads de valoración activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas CRM</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-medium">{stats?.total_empresas || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Empresas en el CRM actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactos CRM</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-medium">{stats?.total_contactos || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats?.contactos_with_valuation || 0} vinculados a valoraciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Unlink2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-medium text-orange-500">
                {stats?.valuations_without_empresa || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Valoraciones sin empresa vinculada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Estado de Sincronización
          </CardTitle>
          <CardDescription>
            Progreso de vinculación entre valoraciones y el CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Valoraciones vinculadas</span>
            <span className="font-medium">{syncProgress}%</span>
          </div>
          <Progress value={syncProgress} className="h-3" />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>{stats?.valuations_with_empresa || 0} vinculadas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>{stats?.valuations_without_empresa || 0} pendientes</span>
            </div>
            {stats?.potential_cif_matches ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>{stats.potential_cif_matches} matches por CIF</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Sectors Distribution */}
      {stats?.sectors_distribution && stats.sectors_distribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Sector</CardTitle>
            <CardDescription>Sectores de las valoraciones a sincronizar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.sectors_distribution.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  {item.sector || 'Sin sector'}: {item.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ejecutar Sincronización</CardTitle>
          <CardDescription>
            Crea empresas y contactos en el CRM a partir de las valoraciones pendientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats?.last_sync && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Última sincronización</AlertTitle>
              <AlertDescription>
                {formatDistanceToNow(new Date(stats.last_sync), { locale: es, addSuffix: true })}
              </AlertDescription>
            </Alert>
          )}

          {lastResult && (
            <Alert variant={lastResult.errors_count > 0 ? "destructive" : "default"}>
              {lastResult.errors_count > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertTitle>
                {runSyncMutation.variables === true ? "Resultado de simulación" : "Sincronización completada"}
              </AlertTitle>
              <AlertDescription className="space-y-1">
                <p>Empresas creadas: <strong>{lastResult.empresas_created}</strong></p>
                <p>Contactos creados: <strong>{lastResult.contactos_created}</strong></p>
                <p>Duración: {(lastResult.duration_ms / 1000).toFixed(2)}s</p>
                {lastResult.errors_count > 0 && (
                  <p className="text-destructive">Errores: {lastResult.errors_count}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDryRun}
              disabled={runSyncMutation.isPending}
            >
              {runSyncMutation.isPending && runSyncMutation.variables === true ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Simular (Dry Run)
            </Button>
            <Button
              onClick={handleSync}
              disabled={runSyncMutation.isPending || (stats?.valuations_without_empresa === 0)}
            >
              {runSyncMutation.isPending && runSyncMutation.variables === false ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Ejecutar Sincronización
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Sincronizaciones</CardTitle>
          <CardDescription>Últimas ejecuciones de sincronización</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : history && history.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Valoraciones</TableHead>
                    <TableHead>Empresas</TableHead>
                    <TableHead>Contactos</TableHead>
                    <TableHead>Errores</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {format(new Date(item.executed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>{item.total_valuations}</TableCell>
                      <TableCell>
                        <span className="text-green-600">+{item.empresas_created}</span>
                        {item.empresas_linked > 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({item.empresas_linked} vinc.)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600">+{item.contactos_created}</span>
                        {item.contactos_linked > 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({item.contactos_linked} vinc.)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.errors_count > 0 ? (
                          <Badge variant="destructive">{item.errors_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>{(item.duration_ms / 1000).toFixed(1)}s</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                          {item.status === 'completed' ? 'OK' : item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay sincronizaciones anteriores
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
