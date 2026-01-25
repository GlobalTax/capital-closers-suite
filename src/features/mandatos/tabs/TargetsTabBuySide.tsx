import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Kanban, List } from "lucide-react";
import { CriteriosInversionCard } from "@/components/mandatos/buyside/CriteriosInversionCard";
import { TargetFunnel } from "@/components/mandatos/buyside/TargetFunnel";
import { TargetPipelineKanban } from "@/components/mandatos/buyside/TargetPipelineKanban";
import { TargetListView } from "@/components/mandatos/buyside/TargetListView";
import { TargetFiltersPanel, defaultFilters, type TargetFilters } from "@/components/mandatos/buyside/TargetFiltersPanel";
import { TargetDetailDrawer } from "@/components/mandatos/buyside/TargetDetailDrawer";
import { useTargetPipeline } from "@/hooks/useTargetPipeline";
import { useTargetTags } from "@/hooks/useTargetTags";
import { NuevoTargetDrawer } from "@/components/targets/NuevoTargetDrawer";
import { AsociarEmpresaDialog } from "@/components/empresas/AsociarEmpresaDialog";
import type { Mandato, TargetFunnelStage, MandatoEmpresaBuySide, BuyerType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface TargetsTabBuySideProps {
  mandato: Mandato;
  onRefresh: () => void;
}

export function TargetsTabBuySide({ mandato, onRefresh }: TargetsTabBuySideProps) {
  const [nuevoTargetOpen, setNuevoTargetOpen] = useState(false);
  const [asociarOpen, setAsociarOpen] = useState(false);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<TargetFunnelStage | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTarget, setSelectedTarget] = useState<MandatoEmpresaBuySide | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<TargetFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    targets,
    stats,
    isLoading,
    moveToPipeline,
    moveToFunnel,
    updateScoring,
    createOferta,
    isMoving,
    isSavingScoring,
    isSavingOferta,
    refetch,
  } = useTargetPipeline(mandato.id);

  const { distinctTags, addTag, removeTag, updateBuyerType } = useTargetTags(mandato.id);

  const handleRefresh = () => {
    refetch();
    onRefresh();
  };

  const handleTargetClick = (target: MandatoEmpresaBuySide) => {
    setSelectedTarget(target);
    setDetailDrawerOpen(true);
  };

  // Filtrar targets
  const filteredTargets = useMemo(() => {
    let result = targets;

    // Filtrar por funnel stage seleccionado
    if (selectedFunnelStage) {
      result = result.filter(t => (t.funnel_stage || 'long_list') === selectedFunnelStage);
    }

    // Aplicar filtros avanzados
    if (filters.buyerTypes.length > 0) {
      result = result.filter(t => t.buyer_type && (filters.buyerTypes as string[]).includes(t.buyer_type));
    }
    if (filters.funnelStages.length > 0) {
      result = result.filter(t => (filters.funnelStages as string[]).includes(t.funnel_stage || 'long_list'));
    }
    if (filters.pipelineStages.length > 0) {
      result = result.filter(t => (filters.pipelineStages as string[]).includes(t.pipeline_stage_target || 'identificada'));
    }
    if (filters.tags.length > 0) {
      result = result.filter(t => filters.tags.some(tag => (t.tags || []).includes(tag)));
    }
    if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) {
      result = result.filter(t => {
        const score = t.scoring?.score_total || 0;
        return score >= filters.scoreRange[0] && score <= filters.scoreRange[1];
      });
    }
    if (filters.matchScoreRange[0] > 0 || filters.matchScoreRange[1] < 100) {
      result = result.filter(t => {
        const score = t.match_score || 0;
        return score >= filters.matchScoreRange[0] && score <= filters.matchScoreRange[1];
      });
    }
    if (filters.hideNoContactar) {
      result = result.filter(t => !t.no_contactar);
    }
    if (filters.hideConflictos) {
      result = result.filter(t => !t.tiene_conflicto);
    }
    if (filters.onlyConflictos) {
      result = result.filter(t => t.tiene_conflicto);
    }

    return result;
  }, [targets, selectedFunnelStage, filters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Criterios de inversión */}
      <CriteriosInversionCard mandato={mandato} />

      {/* Funnel visual */}
      <Card>
        <CardContent className="pt-4">
          <TargetFunnel
            stats={stats?.byFunnelStage || { long_list: 0, short_list: 0, finalista: 0, descartado: 0 }}
            total={targets.length}
            selectedStage={selectedFunnelStage}
            onSelectStage={setSelectedFunnelStage}
          />
        </CardContent>
      </Card>

      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'list')}>
            <TabsList className="h-8">
              <TabsTrigger value="kanban" className="text-xs px-2">
                <Kanban className="h-3.5 w-3.5 mr-1" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2">
                <List className="h-3.5 w-3.5 mr-1" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {selectedFunnelStage && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedFunnelStage(null)}
            >
              Limpiar filtro
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <TargetFiltersPanel
            filters={filters}
            onChange={setFilters}
            distinctTags={distinctTags}
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen(!filtersOpen)}
          />
          <Button variant="outline" size="sm" onClick={() => setAsociarOpen(true)}>
            <Building2 className="h-4 w-4 mr-1" />
            Buscar
          </Button>
          <Button size="sm" onClick={() => setNuevoTargetOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Target
          </Button>
        </div>
      </div>

      {/* Vista principal */}
      {viewMode === 'kanban' ? (
        <TargetPipelineKanban
          targets={filteredTargets as MandatoEmpresaBuySide[]}
          onMoveTarget={(targetId, stage) => moveToPipeline({ targetId, stage })}
          onTargetClick={handleTargetClick}
          isMoving={isMoving}
        />
      ) : (
        <TargetListView
          targets={filteredTargets as MandatoEmpresaBuySide[]}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onTargetClick={handleTargetClick}
          distinctTags={distinctTags}
          onAddTag={(targetId, tag) => addTag.mutate({ targetId, tag })}
          onRemoveTag={(targetId, tag) => removeTag.mutate({ targetId, tag })}
          onBuyerTypeChange={(targetId, type) => updateBuyerType.mutate({ targetId, buyerType: type })}
        />
      )}

      {/* Empty state */}
      {targets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              No hay targets asociados a este mandato de compra
            </p>
            <Button onClick={() => setNuevoTargetOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir primer target
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Drawer de detalle */}
      <TargetDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        target={selectedTarget}
        mandatoId={mandato.id}
        onMoveToFunnel={(targetId, stage) => moveToFunnel({ targetId, stage })}
        onMoveToPipeline={(targetId, stage) => moveToPipeline({ targetId, stage })}
        onUpdateScoring={(targetId, scoring) => updateScoring({ targetId, scoring })}
        onCreateOferta={(targetId, oferta) => createOferta({ targetId, oferta })}
        isMoving={isMoving}
        isSavingScoring={isSavingScoring}
        isSavingOferta={isSavingOferta}
        onRefresh={handleRefresh}
      />

      {/* Drawers */}
      <NuevoTargetDrawer
        open={nuevoTargetOpen}
        onOpenChange={setNuevoTargetOpen}
        mandatoId={mandato.id}
        onSuccess={handleRefresh}
      />

      <AsociarEmpresaDialog
        open={asociarOpen}
        onOpenChange={setAsociarOpen}
        mandatoId={mandato.id}
        onSuccess={handleRefresh}
        defaultRol="target"
      />
    </div>
  );
}
