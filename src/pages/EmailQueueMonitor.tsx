import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Loader2, LayoutDashboard, List, AlertCircle, BarChart3 } from "lucide-react";
import { useProcessQueue, useBulkRetryFailed, useQueueStats } from "@/hooks/useEmailQueue";
import { QueueStatsCards } from "@/components/emailQueue/QueueStatsCards";
import { ActiveQueueTab } from "@/components/emailQueue/ActiveQueueTab";
import { FailedEmailsTab } from "@/components/emailQueue/FailedEmailsTab";
import { MetricsTab } from "@/components/emailQueue/MetricsTab";
import { OverviewTab } from "@/components/emailQueue/OverviewTab";

export default function EmailQueueMonitor() {
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  
  const { data: stats, isLoading: statsLoading } = useQueueStats();
  const processQueue = useProcessQueue();
  const bulkRetry = useBulkRetryFailed();

  const handleProcessQueue = () => {
    processQueue.mutate({ batchSize: 10, processRetries: true });
  };

  const handleBulkRetry = () => {
    bulkRetry.mutate(undefined);
  };

  const handleStatusCardClick = (status: string) => {
    if (status === "pending" || status === "queued" || status === "sending") {
      setActiveTab("active");
      setStatusFilter(status);
    } else if (status === "failed") {
      setActiveTab("failed");
      setStatusFilter("failed");
    } else if (status === "sent") {
      setActiveTab("active");
      setStatusFilter("sent");
    }
  };

  // Aggregate stats for cards
  const aggregatedStats = stats?.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + s.count;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Control de Envíos"
          description="Monitorización de la cola de emails y métricas de rendimiento"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBulkRetry}
            disabled={bulkRetry.isPending || !aggregatedStats.failed}
          >
            {bulkRetry.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Reintentar fallidos
          </Button>
          <Button
            onClick={handleProcessQueue}
            disabled={processQueue.isPending}
          >
            {processQueue.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Procesar cola
          </Button>
        </div>
      </div>

      <QueueStatsCards
        stats={aggregatedStats}
        loading={statsLoading}
        onStatusClick={handleStatusCardClick}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <List className="h-4 w-4" />
            Cola
            {(aggregatedStats.pending || 0) + (aggregatedStats.queued || 0) + (aggregatedStats.sending || 0) > 0 && (
              <span className="ml-1 rounded-full bg-amber-500/20 text-amber-600 px-2 py-0.5 text-xs">
                {(aggregatedStats.pending || 0) + (aggregatedStats.queued || 0) + (aggregatedStats.sending || 0)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Fallidos
            {(aggregatedStats.failed || 0) > 0 && (
              <span className="ml-1 rounded-full bg-destructive/20 text-destructive px-2 py-0.5 text-xs">
                {aggregatedStats.failed}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab stats={stats || []} />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <ActiveQueueTab initialStatusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="failed" className="mt-6">
          <FailedEmailsTab />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <MetricsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
