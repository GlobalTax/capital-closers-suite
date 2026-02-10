import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Kanban, List, Upload, FileSpreadsheet, Search, ChevronDown, Archive } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CriteriosInversionCard } from "@/components/mandatos/buyside/CriteriosInversionCard";
import { TargetFunnel } from "@/components/mandatos/buyside/TargetFunnel";
import { TargetPipelineKanban } from "@/components/mandatos/buyside/TargetPipelineKanban";
import { TargetListView } from "@/components/mandatos/buyside/TargetListView";
import { TargetFiltersPanel, defaultFilters, type TargetFilters } from "@/components/mandatos/buyside/TargetFiltersPanel";
import { TargetDetailDrawer } from "@/components/mandatos/buyside/TargetDetailDrawer";
import { ArchivedTargetsView } from "@/components/mandatos/buyside/ArchivedTargetsView";
import { BulkActionsBar } from "@/components/mandatos/buyside/BulkActionsBar";
import { useTargetPipeline } from "@/hooks/useTargetPipeline";
import { useTargetTags } from "@/hooks/useTargetTags";
import { NuevoTargetDrawer } from "@/components/targets/NuevoTargetDrawer";
import { AsociarEmpresaDialog } from "@/components/empresas/AsociarEmpresaDialog";
import { ImportTargetsExcelDrawer } from "@/components/targets/ImportTargetsExcelDrawer";
import { ImportTargetsApolloDrawer } from "@/components/targets/ImportTargetsApolloDrawer";
import type { Mandato, TargetFunnelStage, MandatoEmpresaBuySide, BuyerType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface TargetsTabBuySideProps {
  mandato: Mandato;
  onRefresh: () => void;
  onEditMandato?: () => void;
}

export function TargetsTabBuySide({ mandato, onRefresh, onEditMandato }: TargetsTabBuySideProps) {
  const [nuevoTargetOpen, setNuevoTargetOpen] = useState(false);
  const [asociarOpen, setAsociarOpen] = useState(false);
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const [apolloImportOpen, setApolloImportOpen] = useState(false);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState<TargetFunnelStage | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTarget, setSelectedTarget] = useState<MandatoEmpresaBuySide | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<TargetFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const {
    targets,
    stats,
    isLoading,
    moveToPipeline,
    moveToFunnel,
    updateScoring,
    createOferta,
    archiveTarget,
    archiveTargetsBulk,
    unarchiveTarget,
    unlinkTarget,
    isMoving,
    isSavingScoring,
    isSavingOferta,
    isArchiving,
    isArchivingBulk,
    isUnlinking,
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

  const handleBulkArchive = () => {
    if (selectedIds.length === 0) return;
    archiveTargetsBulk(selectedIds);
    setSelectedIds([]);
  };

  // Conteo de archivados
  const archivedCount = useMemo(
    () => targets.filter((t) => t.is_archived).length,
    [targets]
  );

  // Filtrar targets
  const filteredTargets = useMemo(() => {
    let result = targets;

    // Cuando showArchived está activo, mostrar SOLO archivados
    if (showArchived) {
      return result.filter((t) => t.is_archived);
    }

    // Por defecto, excluir archivados
    result = result.filter((t) => !t.is_archived);

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

    // Filtrar por actividad (usamos pipeline_stage_changed_at como indicador de actividad)
    if (filters.activityFilter !== "all") {
      const now = new Date();
      result = result.filter(t => {
        // Usamos pipeline_stage_changed_at o archived_at o created_at como fecha de referencia
        const activityDate = t.pipeline_stage_changed_at || t.archived_at || t.created_at;
        const dateToCheck = activityDate ? new Date(activityDate) : null;
        if (!dateToCheck) return filters.activityFilter.startsWith("inactive");
        
        const diffDays = Math.floor((now.getTime() - dateToCheck.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.activityFilter) {
          case "7d":
            return diffDays <= 7;
          case "30d":
            return diffDays <= 30;
          case "60d":
            return diffDays <= 60;
          case "inactive_30d":
            return diffDays > 30;
          case "inactive_60d":
            return diffDays > 60;
          default:
            return true;
        }
      });
    }

    return result;
  }, [targets, selectedFunnelStage, filters, showArchived]);

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
      <CriteriosInversionCard mandato={mandato} onEdit={onEditMandato} />

      {/* Funnel visual - ocultar cuando se ven archivados */}
      {!showArchived && (
        <Card>
          <CardContent className="pt-4">
            <TargetFunnel
              stats={stats?.byFunnelStage || { long_list: 0, short_list: 0, finalista: 0, descartado: 0 }}
              total={stats?.total ?? filteredTargets.length}
              selectedStage={selectedFunnelStage}
              onSelectStage={setSelectedFunnelStage}
            />
          </CardContent>
        </Card>
      )}

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
          
          {/* Toggle para mostrar archivados */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${showArchived ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'}`}>
            <Archive className={`h-3.5 w-3.5 ${showArchived ? 'text-primary' : 'text-muted-foreground'}`} />
            <Switch 
              checked={showArchived} 
              onCheckedChange={setShowArchived}
              id="show-archived"
              className="h-4 w-7"
            />
            <Label htmlFor="show-archived" className={`text-xs cursor-pointer ${showArchived ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Archivados
            </Label>
            {archivedCount > 0 && (
              <Badge variant={showArchived ? "default" : "secondary"} className="h-5 px-1.5 text-[10px]">
                {archivedCount}
              </Badge>
            )}
          </div>
          
          {/* Menú de importación */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Importar
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExcelImportOpen(true)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Desde Excel/CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setApolloImportOpen(true)}>
                <Search className="h-4 w-4 mr-2" />
                Desde Apollo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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

      {/* Barra de acciones masivas */}
      {viewMode === 'list' && !showArchived && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onArchive={handleBulkArchive}
          isArchiving={isArchivingBulk}
        />
      )}

      {/* Vista principal */}
      {showArchived ? (
        <ArchivedTargetsView
          targets={targets as MandatoEmpresaBuySide[]}
          onUnarchive={(targetId) => {
            unarchiveTarget(targetId);
          }}
          onTargetClick={handleTargetClick}
          isUnarchiving={isArchiving}
        />
      ) : viewMode === 'kanban' ? (
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

      {/* Empty state - solo para vista normal */}
      {!showArchived && targets.filter(t => !t.is_archived).length === 0 && (
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
        onArchiveTarget={(targetId) => {
          archiveTarget(targetId);
          setDetailDrawerOpen(false);
          setSelectedTarget(null);
        }}
        onUnarchiveTarget={(targetId) => {
          unarchiveTarget(targetId);
          setDetailDrawerOpen(false);
          setSelectedTarget(null);
        }}
        onUnlinkTarget={(targetId) => {
          unlinkTarget(targetId);
          setDetailDrawerOpen(false);
          setSelectedTarget(null);
        }}
        isMoving={isMoving}
        isSavingScoring={isSavingScoring}
        isSavingOferta={isSavingOferta}
        isArchiving={isArchiving}
        isUnlinking={isUnlinking}
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

      {/* Import Drawers */}
      <ImportTargetsExcelDrawer
        open={excelImportOpen}
        onOpenChange={setExcelImportOpen}
        mandatoId={mandato.id}
        onSuccess={handleRefresh}
      />

      <ImportTargetsApolloDrawer
        open={apolloImportOpen}
        onOpenChange={setApolloImportOpen}
        mandatoId={mandato.id}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
