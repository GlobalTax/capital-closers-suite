import { useDroppable } from "@dnd-kit/core";
import { PipelineDealCard } from "./PipelineDealCard";
import type { PipelineMandato, PipelineSummary } from "@/types/pipeline";
import { cn } from "@/lib/utils";

interface PipelineColumnProps {
  stage: PipelineSummary;
  deals: PipelineMandato[];
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toFixed(0)}`;
};

export function PipelineColumn({ stage, deals }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.stage_key,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 bg-muted/30 rounded-lg transition-all",
        isOver && "ring-2 ring-primary/50 bg-muted/50"
      )}
    >
      {/* Header */}
      <div 
        className="p-3 rounded-t-lg border-b border-border/50"
        style={{ borderLeftColor: stage.color, borderLeftWidth: 3 }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm">{stage.stage_name}</h3>
          <span 
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: `${stage.color}20`, 
              color: stage.color 
            }}
          >
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatCurrency(stage.total_value)}</span>
          <span className="text-muted-foreground/50">•</span>
          <span>{stage.default_probability}% prob</span>
        </div>
      </div>

      {/* Deals */}
      <div className="p-2 space-y-2 min-h-[400px] max-h-[calc(100vh-350px)] overflow-y-auto">
        {deals.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
            Sin deals en esta fase
          </div>
        ) : (
          deals.map((deal) => (
            <PipelineDealCard key={deal.id} deal={deal} />
          ))
        )}
      </div>
    </div>
  );
}
