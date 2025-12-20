import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useState } from "react";
import { PipelineColumn } from "./PipelineColumn";
import { PipelineDealCard } from "./PipelineDealCard";
import { useUpdatePipelineStage } from "@/hooks/usePipeline";
import type { PipelineMandato, PipelineSummary } from "@/types/pipeline";
import { Skeleton } from "@/components/ui/skeleton";

interface PipelineKanbanProps {
  mandatos: PipelineMandato[];
  stages: PipelineSummary[];
  isLoading: boolean;
}

export function PipelineKanban({ mandatos, stages, isLoading }: PipelineKanbanProps) {
  const [activeDeal, setActiveDeal] = useState<PipelineMandato | null>(null);
  const updateStage = useUpdatePipelineStage();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const mandatosByStage = useMemo(() => {
    const grouped: Record<string, PipelineMandato[]> = {};
    stages.forEach((stage) => {
      grouped[stage.stage_key] = [];
    });
    mandatos.forEach((mandato) => {
      const stage = mandato.pipeline_stage || 'prospeccion';
      if (grouped[stage]) {
        grouped[stage].push(mandato);
      }
    });
    return grouped;
  }, [mandatos, stages]);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = mandatos.find((m) => m.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as string;
    const deal = mandatos.find((m) => m.id === dealId);

    if (!deal || deal.pipeline_stage === newStage) return;

    // Obtener la probabilidad por defecto del nuevo stage
    const targetStage = stages.find((s) => s.stage_key === newStage);
    const newProbability = targetStage?.default_probability;

    updateStage.mutate({
      mandatoId: dealId,
      newStage,
      probability: newProbability,
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-12 w-full mb-3 rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.stage_key}
            stage={stage}
            deals={mandatosByStage[stage.stage_key] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && <PipelineDealCard deal={activeDeal} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
