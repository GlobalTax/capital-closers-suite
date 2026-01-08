import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  RefreshCw, 
  Play, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Building2,
  FileText,
  ArrowRight
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useSyncStats, useSyncHistory, useTriggerSync } from "@/hooks/useSyncOperations";
import type { SyncLogEntry } from "@/services/syncOperations.service";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  loading 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType; 
  description?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-medium">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
    completed: { variant: "default", icon: CheckCircle2 },
    completed_with_errors: { variant: "secondary", icon: AlertCircle },
    running: { variant: "outline", icon: RefreshCw },
    pending: { variant: "outline", icon: Clock },
    failed: { variant: "destructive", icon: XCircle },
  };

  const { variant, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

function SyncHistoryTable({ data, loading }: { data: SyncLogEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay historial de sincronización
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Origen</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Procesados</TableHead>
          <TableHead className="text-right">Creados</TableHead>
          <TableHead className="text-right">Actualizados</TableHead>
          <TableHead className="text-right">Errores</TableHead>
          <TableHead className="text-right">Duración</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-medium">
              {format(new Date(log.executed_at), "dd MMM yyyy HH:mm", { locale: es })}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{log.triggered_by}</Badge>
            </TableCell>
            <TableCell>
              <StatusBadge status={log.status} />
            </TableCell>
            <TableCell className="text-right">{log.operations_processed}</TableCell>
            <TableCell className="text-right text-green-600 font-medium">
              +{log.mandatos_created}
            </TableCell>
            <TableCell className="text-right text-blue-600 font-medium">
              {log.mandatos_updated}
            </TableCell>
            <TableCell className="text-right">
              {log.errors_count > 0 ? (
                <span className="text-destructive font-medium">{log.errors_count}</span>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function SyncOperations() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useSyncStats();
  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useSyncHistory();
  const triggerSync = useTriggerSync();

  const handleSync = (dryRun: boolean) => {
    triggerSync.mutate(dryRun, {
      onSuccess: () => {
        refetchStats();
        refetchHistory();
      }
    });
  };

  const lastSyncDate = stats?.lastSync 
    ? format(new Date(stats.lastSync.executed_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })
    : "Nunca";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">Sincronizar Operaciones</h1>
            <p className="text-muted-foreground">
              Importar operaciones del marketplace Capittal a mandatos de GoDeal
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSync(true)}
              disabled={triggerSync.isPending}
            >
              <Eye className="h-4 w-4 mr-2" />
              Simular
            </Button>
            <Button
              onClick={() => handleSync(false)}
              disabled={triggerSync.isPending}
            >
              {triggerSync.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Sincronizar ahora
            </Button>
          </div>
        </div>

        {/* Flow Diagram */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <span>capittal.es/admin/operations</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4 text-primary" />
                <span>company_operations</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 font-medium">
                <Building2 className="h-4 w-4 text-primary" />
                <span>mandatos + empresas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Operaciones en Capittal"
            value={stats?.totalOperations || 0}
            icon={ExternalLink}
            description="Activas en el marketplace"
            loading={statsLoading}
          />
          <StatCard
            title="Mandatos Sincronizados"
            value={stats?.syncedMandatos || 0}
            icon={CheckCircle2}
            description="Con external_operation_id"
            loading={statsLoading}
          />
          <StatCard
            title="Pendientes de Sync"
            value={stats?.pendingSync || 0}
            icon={Clock}
            description="Nuevas operaciones"
            loading={statsLoading}
          />
          <StatCard
            title="Última Sincronización"
            value={lastSyncDate}
            icon={RefreshCw}
            description={stats?.lastSync?.status || ""}
            loading={statsLoading}
          />
        </div>

        {/* Sync History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historial de Sincronización</CardTitle>
              <CardDescription>
                Últimas ejecuciones del proceso de sincronización
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                refetchStats();
                refetchHistory();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <SyncHistoryTable data={history} loading={historyLoading} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
