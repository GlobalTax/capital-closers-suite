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
  Loader2,
  Play,
  RotateCcw,
  Settings,
  List,
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
import { useBrevoQueue, useRetryQueueItem, useIgnoreQueueItem, type QueueFilters, type QueueItemWithEntity } from "@/hooks/useBrevoQueue";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrevoQueueFilters } from "@/components/brevo/BrevoQueueFilters";
import { BrevoQueueTable } from "@/components/brevo/BrevoQueueTable";
import { QueueItemDetailDrawer } from "@/components/brevo/QueueItemDetailDrawer";
import { BrevoSettingsTab } from "@/components/brevo/BrevoSettingsTab";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

function SyncStatusCard({ title, icon: Icon, total, synced, pending, color }: { title: string; icon: React.ElementType; total: number; synced: number; pending: number; color: string; }) {
  const percentage = total > 0 ? Math.round((synced / total) * 100) : 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-medium">{synced}/{total}</div>
        <Progress value={percentage} className="mt-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{percentage}% sincronizado</span>
          {pending > 0 && <span className="text-amber-500">{pending} pendientes</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function QueueStatsCard({ stats, onFilterClick }: { stats: { pending: number; processing: number; completed: number; failed: number }; onFilterClick: (status: QueueFilters['status']) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Cola de Sincronización</CardTitle>
        <CardDescription>Click en un estado para filtrar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors" onClick={() => onFilterClick('pending')}>
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <div className="text-xl font-medium">{stats.pending.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Pendientes</div>
          </div>
          <div className="text-center cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors" onClick={() => onFilterClick('processing')}>
            <Loader2 className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <div className="text-xl font-medium">{stats.processing.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Procesando</div>
          </div>
          <div className="text-center cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors" onClick={() => onFilterClick('completed')}>
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-xl font-medium">{stats.completed.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Completados</div>
          </div>
          <div className="text-center cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors" onClick={() => onFilterClick('failed')}>
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <div className="text-xl font-medium">{stats.failed.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Fallidos</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BrevoIntegration() {
  const { data: syncStatus } = useBrevoSyncStatus();
  const { data: queueStats } = useBrevoQueueStats();
  const { data: syncLogs, isLoading: logsLoading } = useBrevoSyncLogs(100);
  const { syncToBrevo, isLoading: bulkSyncLoading, progress } = useBulkSyncToBrevo();
  const syncFromBrevo = useSyncFromBrevo();
  const processQueue = useProcessBrevoQueue();
  const retryFailed = useRetryFailedSync();

  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<QueueFilters>({ entityType: 'all', status: 'all', errorSearch: '' });
  const [page, setPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<QueueItemWithEntity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [ignoringIds, setIgnoringIds] = useState<Set<string>>(new Set());

  const { data: queueData, isLoading: queueLoading } = useBrevoQueue(filters, page, 50);
  const retryItem = useRetryQueueItem();
  const ignoreItem = useIgnoreQueueItem();

  const handleFilterClick = (status: QueueFilters['status']) => {
    setFilters(f => ({ ...f, status }));
    setPage(0);
    setActiveTab('queue');
  };

  const handleViewItem = (item: QueueItemWithEntity) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleRetryItem = async (itemId: string) => {
    setRetryingIds(prev => new Set(prev).add(itemId));
    try { await retryItem.mutateAsync(itemId); } finally { setRetryingIds(prev => { const n = new Set(prev); n.delete(itemId); return n; }); }
  };

  const handleIgnoreItem = async (itemId: string) => {
    setIgnoringIds(prev => new Set(prev).add(itemId));
    try { await ignoreItem.mutateAsync(itemId); } finally { setIgnoringIds(prev => { const n = new Set(prev); n.delete(itemId); return n; }); }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) { case "contact": return <Users className="h-4 w-4" />; case "company": return <Building2 className="h-4 w-4" />; case "deal": return <FileText className="h-4 w-4" />; default: return null; }
  };

  const getStatusBadge = (status: string) => {
    switch (status) { case "success": return <Badge variant="outline" className="bg-green-500/10 text-green-500">Exitoso</Badge>; case "failed": return <Badge variant="outline" className="bg-red-500/10 text-red-500">Fallido</Badge>; case "pending": return <Badge variant="outline" className="bg-amber-500/10 text-amber-500">Pendiente</Badge>; default: return <Badge variant="outline">{status}</Badge>; }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader title="Integración Brevo" description="Gestiona la sincronización bidireccional con Brevo CRM" />

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => syncToBrevo("all")} disabled={bulkSyncLoading} className="gap-2">
            {bulkSyncLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Exportar todo a Brevo
          </Button>
          <Button variant="outline" onClick={() => syncFromBrevo.mutate()} disabled={syncFromBrevo.isPending} className="gap-2">
            {syncFromBrevo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Importar desde Brevo
          </Button>
          <Button variant="outline" onClick={() => processQueue.mutate()} disabled={processQueue.isPending} className="gap-2">
            {processQueue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Procesar cola
          </Button>
          {queueStats && queueStats.failed > 0 && (
            <Button variant="outline" onClick={() => retryFailed.mutate(undefined)} disabled={retryFailed.isPending} className="gap-2 text-amber-600 border-amber-300">
              {retryFailed.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Reintentar fallidos ({queueStats.failed.toLocaleString()})
            </Button>
          )}
        </div>

        {progress.running && (
          <Card><CardContent className="py-4"><div className="flex items-center gap-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /><div className="flex-1"><div className="text-sm font-medium">{progress.phase}</div><Progress value={(progress.current / progress.total) * 100} className="mt-2" /></div></div></CardContent></Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="queue" className="gap-2"><List className="h-4 w-4" />Cola</TabsTrigger>
            <TabsTrigger value="logs">Historial</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" />Ajustes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {syncStatus && (<><SyncStatusCard title="Contactos" icon={Users} total={syncStatus.contactos.total} synced={syncStatus.contactos.synced} pending={syncStatus.contactos.pending} color="text-blue-500" /><SyncStatusCard title="Empresas" icon={Building2} total={syncStatus.empresas.total} synced={syncStatus.empresas.synced} pending={syncStatus.empresas.pending} color="text-green-500" /><SyncStatusCard title="Mandatos/Deals" icon={FileText} total={syncStatus.mandatos.total} synced={syncStatus.mandatos.synced} pending={syncStatus.mandatos.pending} color="text-purple-500" /></>)}
            </div>
            {queueStats && <QueueStatsCard stats={queueStats} onFilterClick={handleFilterClick} />}
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Upload className="h-4 w-4" />CRM → Brevo</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground"><ul className="space-y-1"><li>• Los cambios en CRM se añaden automáticamente a la cola</li><li>• La cola se procesa cada 5 minutos (o manualmente)</li><li>• Los contactos, empresas y mandatos se sincronizan</li></ul></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Download className="h-4 w-4" />Brevo → CRM</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground"><ul className="space-y-1"><li>• Importación programada cada hora</li><li>• También se puede ejecutar manualmente</li><li>• Contactos y deals se importan al CRM</li></ul></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <BrevoQueueFilters filters={filters} onFiltersChange={(f) => { setFilters(f); setPage(0); }} />
            <Card>
              <CardContent className="p-0">
                <BrevoQueueTable items={queueData?.items || []} isLoading={queueLoading} onViewItem={handleViewItem} onRetryItem={handleRetryItem} onIgnoreItem={handleIgnoreItem} retryingIds={retryingIds} ignoringIds={ignoringIds} />
              </CardContent>
            </Card>
            {queueData && queueData.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => setPage(p => Math.max(0, p - 1))} className={page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                  <PaginationItem><span className="px-4 text-sm">Página {page + 1} de {queueData.totalPages}</span></PaginationItem>
                  <PaginationItem><PaginationNext onClick={() => setPage(p => Math.min(queueData.totalPages - 1, p + 1))} className={page >= queueData.totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>

          <TabsContent value="logs">
            <Card><CardHeader><CardTitle>Historial de Sincronización</CardTitle><CardDescription>Últimas 100 sincronizaciones</CardDescription></CardHeader><CardContent><ScrollArea className="h-[500px]"><div className="space-y-2">{logsLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : syncLogs && syncLogs.length > 0 ? syncLogs.map((log) => (<div key={log.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"><div className="flex items-center gap-3">{getEntityIcon(log.entity_type)}<div><div className="text-sm font-medium">{log.entity_type === "contact" && "Contacto"}{log.entity_type === "company" && "Empresa"}{log.entity_type === "deal" && "Deal"}</div><div className="text-xs text-muted-foreground">{log.sync_type === "bulk_export" && "Exportación masiva"}{log.sync_type === "outbound" && "Sync automático"}{log.sync_type === "inbound" && "Importación"}</div></div></div><div className="flex items-center gap-3">{getStatusBadge(log.sync_status)}<span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}</span></div></div>)) : <div className="text-center py-8 text-muted-foreground">No hay registros de sincronización</div>}</div></ScrollArea></CardContent></Card>
          </TabsContent>

          <TabsContent value="settings"><BrevoSettingsTab /></TabsContent>
        </Tabs>
      </div>

      <QueueItemDetailDrawer item={selectedItem} open={drawerOpen} onOpenChange={setDrawerOpen} onRetry={handleRetryItem} onIgnore={handleIgnoreItem} isRetrying={selectedItem ? retryingIds.has(selectedItem.id) : false} isIgnoring={selectedItem ? ignoringIds.has(selectedItem.id) : false} />
    </AppLayout>
  );
}
