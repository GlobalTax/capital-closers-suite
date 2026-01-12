import { cn } from "@/lib/utils";
import { TARGET_FUNNEL_CONFIG, TargetFunnelStage } from "@/types";
import { ChevronRight } from "lucide-react";

interface TargetFunnelProps {
  stats: Record<TargetFunnelStage, number>;
  total: number;
  selectedStage?: TargetFunnelStage | null;
  onSelectStage: (stage: TargetFunnelStage | null) => void;
}

export function TargetFunnel({ stats, total, selectedStage, onSelectStage }: TargetFunnelProps) {
  const stages: TargetFunnelStage[] = ['long_list', 'short_list', 'finalista'];
  const descartados = stats.descartado || 0;

  return (
    <div className="space-y-3">
      {/* Funnel principal */}
      <div className="flex items-center gap-2">
        {stages.map((stage, idx) => {
          const config = TARGET_FUNNEL_CONFIG[stage];
          const count = stats[stage] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const isSelected = selectedStage === stage;

          return (
            <div key={stage} className="flex items-center flex-1">
              <button
                onClick={() => onSelectStage(isSelected ? null : stage)}
                className={cn(
                  "flex-1 p-3 rounded-lg border-2 transition-all",
                  "hover:shadow-md hover:scale-[1.02]",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
              >
                <div className="text-center">
                  <div 
                    className="text-2xl font-medium"
                    style={{ color: config.color }}
                  >
                    {count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {config.label}
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                </div>
              </button>
              {idx < stages.length - 1 && (
                <ChevronRight className="h-5 w-5 text-muted-foreground mx-1 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Descartados (si hay) */}
      {descartados > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => onSelectStage(selectedStage === 'descartado' ? null : 'descartado')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-all",
              selectedStage === 'descartado'
                ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <span className="font-medium">{descartados}</span>
            <span className="ml-1">descartados</span>
          </button>
        </div>
      )}

      {/* Resumen */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>Total targets: {total}</span>
        <span>
          Conversión: {total > 0 
            ? Math.round(((stats.short_list || 0) + (stats.finalista || 0)) / total * 100) 
            : 0}%
        </span>
      </div>
    </div>
  );
}
