import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Kanban, List, BarChart3 } from "lucide-react";
import { CriteriosInversionCard } from "@/components/mandatos/buyside/CriteriosInversionCard";
import { TargetFunnel } from "@/components/mandatos/buyside/TargetFunnel";
import { TargetPipelineKanban } from "@/components/mandatos/buyside/TargetPipelineKanban";
import { useTargetPipeline } from "@/hooks/useTargetPipeline";
import { NuevoTargetDrawer } from "@/components/targets/NuevoTargetDrawer";
import { AsociarEmpresaDialog } from "@/components/empresas/AsociarEmpresaDialog";
import type { Mandato, TargetFunnelStage, TargetPipelineStage } from "@/types";
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

  const {
    targets,
    stats,
    isLoading,
    moveToPipeline,
    isMoving,
    refetch,
  } = useTargetPipeline(mandato.id);

  const handleRefresh = () => {
    refetch();
    onRefresh();
  };

  // Filtrar por funnel stage si está seleccionado
  const filteredTargets = selectedFunnelStage
    ? targets.filter(t => (t.funnel_stage || 'long_list') === selectedFunnelStage)
    : targets;

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
          targets={filteredTargets as any}
          onMoveTarget={(targetId, stage) => moveToPipeline({ targetId, stage })}
          isMoving={isMoving}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Vista de lista - Próximamente
          </CardContent>
        </Card>
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
