import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, LayoutGrid, History, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSyncCenter } from "@/hooks/useSyncCenter";
import { IntegrationCard } from "@/components/sync-center/IntegrationCard";
import { UnifiedLogsTable } from "@/components/sync-center/UnifiedLogsTable";

export default function SyncCenter() {
  const { 
    integrations, 
    logs, 
    isLoading, 
    refetch, 
    getSyncFunction,
    isSyncing 
  } = useSyncCenter();

  // Calculate summary stats
  const totalPending = integrations.reduce((sum, i) => sum + i.pendingCount, 0);
  const totalErrors = integrations.reduce((sum, i) => sum + i.errorsLastRun, 0);
  const activeIntegrations = integrations.filter(i => i.status === 'active').length;

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sync Center</h1>
            <p className="text-muted-foreground">
              Hub central de sincronizaciones con sistemas externos
            </p>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integraciones Activas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {activeIntegrations} / {integrations.length}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes de Sincronizar</CardTitle>
              <RefreshCw className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-amber-600">
                  {totalPending}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errores Última Ejecución</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-2xl font-bold ${totalErrors > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {totalErrors}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="integrations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="integrations" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Integraciones
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-4 w-32 mt-2" />
                      <Skeleton className="h-3 w-48 mt-1" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                        <Skeleton className="h-12" />
                      </div>
                      <Skeleton className="h-8 w-full mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {integrations.map((integration) => {
                  const syncFns = getSyncFunction(integration.id);
                  return (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onSync={() => syncFns?.sync()}
                      onDryRun={syncFns?.dryRun}
                      isSyncing={syncFns?.isPending || false}
                      historyUrl={integration.historyUrl}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Sincronizaciones</CardTitle>
                <CardDescription>
                  Últimas 50 sincronizaciones de todas las fuentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UnifiedLogsTable logs={logs} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
