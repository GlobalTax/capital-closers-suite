import { useDroppable } from "@dnd-kit/core";
import { 
  Search, 
  FileText, 
  Eye, 
  Handshake, 
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { PipelineDealCard } from "./PipelineDealCard";
import { Progress } from "@/components/ui/progress";
import type { PipelineMandato, PipelineSummary } from "@/types/pipeline";
import { cn } from "@/lib/utils";

interface PipelineColumnProps {
  stage: PipelineSummary;
  deals: PipelineMandato[];
}

const STAGE_ICONS: Record<string, typeof Search> = {
  prospeccion: Search,
  loi: FileText,
  due_diligence: Eye,
  negociacion: Handshake,
  cierre: CheckCircle2,
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toFixed(0)}`;
};

const MAX_DEALS_PER_COLUMN = 10;

export function PipelineColumn({ stage, deals }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.stage_key,
  });

  const Icon = STAGE_ICONS[stage.stage_key] || Search;
  const capacityPercent = Math.min((deals.length / MAX_DEALS_PER_COLUMN) * 100, 100);
  const isOverloaded = deals.length >= MAX_DEALS_PER_COLUMN;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80 rounded-xl transition-all duration-200",
        "bg-gradient-to-b from-muted/50 to-muted/20",
        "border border-border/50",
        isOver && "ring-2 ring-primary/50 bg-muted/60 scale-[1.01]"
      )}
    >
      {/* Header */}
      <div 
        className="p-4 rounded-t-xl"
        style={{ 
          background: `linear-gradient(135deg, ${stage.color}15 0%, transparent 100%)`,
          borderBottom: `2px solid ${stage.color}40`
        }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-lg shadow-sm"
              style={{ backgroundColor: stage.color }}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{stage.stage_name}</h3>
              <p className="text-xs text-muted-foreground">
                {stage.default_probability}% probabilidad
              </p>
            </div>
          </div>
          <div 
            className={cn(
              "flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-sm font-bold",
              isOverloaded && "animate-pulse"
            )}
            style={{ 
              backgroundColor: isOverloaded ? 'hsl(var(--destructive))' : stage.color, 
              color: 'white' 
            }}
          >
            {deals.length}
          </div>
        </div>

        {/* Capacity bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacidad</span>
            {isOverloaded && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                <span>Saturada</span>
              </div>
            )}
          </div>
          <Progress 
            value={capacityPercent} 
            className="h-1.5"
            style={{
              // @ts-ignore
              '--progress-background': isOverloaded ? 'hsl(var(--destructive))' : stage.color
            }}
          />
        </div>

        {/* Values summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-sm">{formatCurrency(stage.total_value)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Ponderado</p>
            <p className="font-bold text-sm" style={{ color: stage.color }}>
              {formatCurrency(stage.weighted_value)}
            </p>
          </div>
        </div>
      </div>

      {/* Deals */}
      <div className="p-3 space-y-2.5 min-h-[350px] max-h-[calc(100vh-400px)] overflow-y-auto">
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div 
              className="p-3 rounded-full mb-2 opacity-30"
              style={{ backgroundColor: `${stage.color}30` }}
            >
              <Icon className="h-5 w-5" style={{ color: stage.color }} />
            </div>
            <p className="text-sm text-muted-foreground">
              Sin deals en esta fase
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Arrastra un deal aquí
            </p>
          </div>
        ) : (
          deals.map((deal, index) => (
            <div 
              key={deal.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PipelineDealCard deal={deal} stageColor={stage.color} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
