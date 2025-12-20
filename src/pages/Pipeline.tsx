import { useState } from "react";
import { ShoppingCart, TrendingUp, LayoutGrid, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PipelineMetrics } from "@/components/pipeline/PipelineMetrics";
import { PipelineKanban } from "@/components/pipeline/PipelineKanban";
import { PipelineChart } from "@/components/pipeline/PipelineChart";
import { PipelineFunnel } from "@/components/pipeline/PipelineFunnel";
import { 
  usePipelineMandatos, 
  usePipelineSummary, 
  usePipelineMetrics 
} from "@/hooks/usePipeline";

type ViewMode = 'kanban' | 'analytics';
type TipoFilter = 'todos' | 'compra' | 'venta';

export default function Pipeline() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');

  const tipo = tipoFilter === 'todos' ? undefined : tipoFilter;
  
  const { data: mandatos = [], isLoading: loadingMandatos } = usePipelineMandatos(tipo);
  const { data: summary = [], isLoading: loadingSummary } = usePipelineSummary();
  const { data: metrics, isLoading: loadingMetrics } = usePipelineMetrics(tipo);

  const filteredMandatos = tipoFilter === 'todos' 
    ? mandatos 
    : mandatos.filter(m => m.tipo === tipoFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline M&A"
        subtitle="Gestiona el ciclo de vida de tus operaciones de M&A"
      />

      {/* Filtros y vista */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
          <TabsList className="h-9">
            <TabsTrigger value="todos" className="text-xs px-3">
              Todos
            </TabsTrigger>
            <TabsTrigger value="compra" className="text-xs px-3 gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Compra
            </TabsTrigger>
            <TabsTrigger value="venta" className="text-xs px-3 gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Venta
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-1.5"
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('analytics')}
            className="gap-1.5"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <PipelineMetrics metrics={metrics} isLoading={loadingMetrics} />

      {/* Main content */}
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
  );
}
