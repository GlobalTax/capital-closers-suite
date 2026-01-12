import { useState } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TARGET_PIPELINE_CONFIG, TargetPipelineStage, MandatoEmpresaBuySide } from "@/types";
import { TargetPipelineCard } from "./TargetPipelineCard";
import { cn } from "@/lib/utils";

interface TargetPipelineKanbanProps {
  targets: MandatoEmpresaBuySide[];
  onMoveTarget: (targetId: string, stage: TargetPipelineStage) => void;
  onTargetClick?: (target: MandatoEmpresaBuySide) => void;
  isMoving?: boolean;
}

export function TargetPipelineKanban({ 
  targets, 
  onMoveTarget, 
  onTargetClick,
  isMoving = false,
}: TargetPipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const stages = Object.entries(TARGET_PIPELINE_CONFIG)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key as TargetPipelineStage);

  const getTargetsByStage = (stage: TargetPipelineStage) => {
    return targets.filter(t => (t.pipeline_stage_target || 'identificada') === stage);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const targetId = active.id as string;
    const overId = over.id as string;

    // Determinar la columna destino
    let targetStage: TargetPipelineStage | null = null;

    // Si se suelta sobre una columna
    if (stages.includes(overId as TargetPipelineStage)) {
      targetStage = overId as TargetPipelineStage;
    } else {
      // Si se suelta sobre otro target, encontrar su columna
      const overTarget = targets.find(t => t.id === overId);
      if (overTarget) {
        targetStage = (overTarget.pipeline_stage_target || 'identificada') as TargetPipelineStage;
      }
    }

    if (targetStage) {
      const currentTarget = targets.find(t => t.id === targetId);
      if (currentTarget && currentTarget.pipeline_stage_target !== targetStage) {
        onMoveTarget(targetId, targetStage);
      }
    }
  };

  const activeTarget = activeId ? targets.find(t => t.id === activeId) : null;

  // Calcular conversión entre etapas
  const getConversionRate = (fromStage: TargetPipelineStage, toStage: TargetPipelineStage) => {
    const fromCount = getTargetsByStage(fromStage).length;
    const toCount = getTargetsByStage(toStage).length;
    if (fromCount === 0) return null;
    return Math.round((toCount / fromCount) * 100);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event) => setActiveId(event.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage, idx) => {
          const config = TARGET_PIPELINE_CONFIG[stage];
          const stageTargets = getTargetsByStage(stage);
          const prevStage = idx > 0 ? stages[idx - 1] : null;
          const conversionRate = prevStage ? getConversionRate(prevStage, stage) : null;

          return (
            <div 
              key={stage}
              className="flex-shrink-0 w-64"
            >
              <Card className="h-full">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <CardTitle className="text-sm font-medium">
                        {config.label}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stageTargets.length}
                    </Badge>
                  </div>
                  {conversionRate !== null && (
                    <div className="text-xs text-muted-foreground">
                      ↓ {conversionRate}% conversión
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <ScrollArea className="h-[400px]">
                    <SortableContext 
                      items={stageTargets.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                      id={stage}
                    >
                      <div 
                        className={cn(
                          "space-y-2 min-h-[100px] p-1 rounded-lg transition-colors",
                          isMoving && "bg-muted/50"
                        )}
                        data-stage={stage}
                      >
                        {stageTargets.map(target => (
                          <TargetPipelineCard
                            key={target.id}
                            target={target}
                            onClick={() => onTargetClick?.(target)}
                          />
                        ))}
                        {stageTargets.length === 0 && (
                          <div className="py-8 text-center text-xs text-muted-foreground">
                            Arrastra targets aquí
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTarget && (
          <TargetPipelineCard 
            target={activeTarget} 
            isDragging 
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
