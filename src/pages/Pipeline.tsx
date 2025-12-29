import { useState } from "react";
import { 
  ShoppingCart, 
  TrendingUp, 
  LayoutGrid, 
  BarChart3,
  RefreshCw,
  Filter
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PipelineMetrics } from "@/components/pipeline/PipelineMetrics";
import { PipelineKanban } from "@/components/pipeline/PipelineKanban";
import { PipelineChart } from "@/components/pipeline/PipelineChart";
import { PipelineFunnel } from "@/components/pipeline/PipelineFunnel";
import { 
  usePipelineMandatos, 
  usePipelineSummary, 
  usePipelineMetrics 
} from "@/hooks/usePipeline";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type ViewMode = 'kanban' | 'analytics';
type TipoFilter = 'todos' | 'compra' | 'venta';

export default function Pipeline() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const queryClient = useQueryClient();

  const tipo = tipoFilter === 'todos' ? undefined : tipoFilter;
  
  const { data: mandatos = [], isLoading: loadingMandatos } = usePipelineMandatos(tipo);
  const { data: summary = [], isLoading: loadingSummary } = usePipelineSummary();
  const { data: metrics, isLoading: loadingMetrics } = usePipelineMetrics(tipo);

  const filteredMandatos = tipoFilter === 'todos' 
    ? mandatos 
    : mandatos.filter(m => m.tipo === tipoFilter);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pipeline-mandatos'] }),
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['pipeline-metrics'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Count by type
  const compraCount = mandatos.filter(m => m.tipo === 'compra').length;
  const ventaCount = mandatos.filter(m => m.tipo === 'venta').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline M&A"
        subtitle="Gestiona el ciclo de vida de tus operaciones de M&A"
      />

      {/* Quick summary */}
      <div className="flex items-center gap-3 text-sm">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
          <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-semibold">{compraCount}</span>
          <span className="text-muted-foreground">Compras</span>
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-semibold">{ventaCount}</span>
          <span className="text-muted-foreground">Ventas</span>
        </Badge>
      </div>

      {/* Filtros y vista */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
          <TabsList className="h-10 p-1">
            <TabsTrigger value="todos" className="px-4 gap-2">
              <Filter className="h-3.5 w-3.5" />
              Todos
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {mandatos.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="compra" className="px-4 gap-2">
              <ShoppingCart className="h-3.5 w-3.5" />
              Compra
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {compraCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="venta" className="px-4 gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Venta
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {ventaCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Actualizar
          </Button>
          <div className="flex items-center rounded-lg border border-border p-1 bg-muted/30">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-1.5 h-8"
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('analytics')}
              className="gap-1.5 h-8"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <PipelineMetrics metrics={metrics} isLoading={loadingMetrics} />

      {/* Main content */}
      <div className="animate-fade-in">
        {viewMode === 'kanban' ? (
          <PipelineKanban
            mandatos={filteredMandatos}
            stages={summary}
            isLoading={loadingMandatos || loadingSummary}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PipelineChart data={summary} />
            <PipelineFunnel data={summary} />
          </div>
        )}
      </div>
    </div>
  );
}
