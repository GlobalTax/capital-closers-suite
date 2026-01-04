import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Building2, 
  FileText,
  AlertTriangle,
  Loader2,
  Play,
  RotateCcw
} from "lucide-react";
import {
  useBrevoSyncStatus,
  useBrevoQueueStats,
  useBrevoSyncLogs,
  useBulkSyncToBrevo,
  useSyncFromBrevo,
  useProcessBrevoQueue,
  useRetryFailedSync,
} from "@/hooks/useBrevoSync";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

function SyncStatusCard({ 
  title, 
  icon: Icon, 
  total, 
  synced, 
  pending,
  color 
}: { 
  title: string; 
  icon: React.ElementType; 
  total: number; 
  synced: number; 
  pending: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((synced / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{synced}/{total}</div>
        <Progress value={percentage} className="mt-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{percentage}% sincronizado</span>
          {pending > 0 && (
            <span className="text-amber-500">{pending} pendientes</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QueueStatsCard({ stats }: { stats: { pending: number; processing: number; completed: number; failed: number } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Cola de Sincronización</CardTitle>
        <CardDescription>Estado de la cola CRM → Brevo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <div className="text-xl font-bold">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pendientes</div>
          </div>
          <div className="text-center">
            <Loader2 className="h-5 w-5 mx-auto mb-1 text-blue-500 animate-spin" />
            <div className="text-xl font-bold">{stats.processing}</div>
            <div className="text-xs text-muted-foreground">Procesando</div>
          </div>
          <div className="text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-xl font-bold">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completados</div>
          </div>
          <div className="text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <div className="text-xl font-bold">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Fallidos</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BrevoIntegration() {
  const { data: syncStatus, isLoading: statusLoading } = useBrevoSyncStatus();
  const { data: queueStats, isLoading: queueLoading } = useBrevoQueueStats();
  const { data: syncLogs, isLoading: logsLoading } = useBrevoSyncLogs(100);

  const { syncToBrevo, isLoading: bulkSyncLoading, progress } = useBulkSyncToBrevo();
  const syncFromBrevo = useSyncFromBrevo();
  const processQueue = useProcessBrevoQueue();
  const retryFailed = useRetryFailedSync();

  const [activeTab, setActiveTab] = useState("overview");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500">Exitoso</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500">Fallido</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "contact":
        return <Users className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      case "deal":
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Integración Brevo"
          description="Gestiona la sincronización bidireccional con Brevo CRM"
        />

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => syncToBrevo("all")}
            disabled={bulkSyncLoading}
            className="gap-2"
          >
            {bulkSyncLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Exportar todo a Brevo
          </Button>

          <Button
            variant="outline"
            onClick={() => syncFromBrevo.mutate()}
            disabled={syncFromBrevo.isPending}
            className="gap-2"
          >
            {syncFromBrevo.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Importar desde Brevo
          </Button>

          <Button
            variant="outline"
            onClick={() => processQueue.mutate()}
            disabled={processQueue.isPending}
            className="gap-2"
          >
            {processQueue.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Procesar cola
          </Button>

          {queueStats && queueStats.failed > 0 && (
            <Button
              variant="outline"
              onClick={() => retryFailed.mutate(undefined)}
              disabled={retryFailed.isPending}
              className="gap-2 text-amber-600 border-amber-300"
            >
              {retryFailed.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Reintentar fallidos ({queueStats.failed})
            </Button>
          )}
        </div>

        {/* Progress bar for bulk sync */}
        {progress.running && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{progress.phase}</div>
                  <Progress value={(progress.current / progress.total) * 100} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="logs">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Sync Status Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {syncStatus && (
                <>
                  <SyncStatusCard
                    title="Contactos"
                    icon={Users}
                    total={syncStatus.contactos.total}
                    synced={syncStatus.contactos.synced}
                    pending={syncStatus.contactos.pending}
                    color="text-blue-500"
                  />
                  <SyncStatusCard
                    title="Empresas"
                    icon={Building2}
                    total={syncStatus.empresas.total}
                    synced={syncStatus.empresas.synced}
                    pending={syncStatus.empresas.pending}
                    color="text-green-500"
                  />
                  <SyncStatusCard
                    title="Mandatos/Deals"
                    icon={FileText}
                    total={syncStatus.mandatos.total}
                    synced={syncStatus.mandatos.synced}
                    pending={syncStatus.mandatos.pending}
                    color="text-purple-500"
                  />
                </>
              )}
            </div>

            {/* Queue Stats */}
            {queueStats && <QueueStatsCard stats={queueStats} />}

            {/* Sync Direction Explanation */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    CRM → Brevo
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Los cambios en CRM se añaden automáticamente a la cola</li>
                    <li>• La cola se procesa cada 5 minutos (o manualmente)</li>
                    <li>• Los contactos, empresas y mandatos se sincronizan</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Brevo → CRM
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Importación programada cada hora</li>
                    <li>• También se puede ejecutar manualmente</li>
                    <li>• Contactos y deals se importan al CRM</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Sincronización</CardTitle>
                <CardDescription>Últimas 100 sincronizaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {logsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : syncLogs && syncLogs.length > 0 ? (
                      syncLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getEntityIcon(log.entity_type)}
                            <div>
                              <div className="text-sm font-medium">
                                {log.entity_type === "contact" && "Contacto"}
                                {log.entity_type === "company" && "Empresa"}
                                {log.entity_type === "deal" && "Deal"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {log.sync_type === "bulk_export" && "Exportación masiva"}
                                {log.sync_type === "outbound" && "Sync automático"}
                                {log.sync_type === "inbound" && "Importación"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(log.sync_status)}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_at), { 
                                addSuffix: true,
                                locale: es 
                              })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay registros de sincronización
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
