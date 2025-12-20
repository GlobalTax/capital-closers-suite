import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineSummary } from "@/types/pipeline";
import { cn } from "@/lib/utils";

interface PipelineFunnelProps {
  data: PipelineSummary[];
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

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const maxValue = Math.max(...data.map(d => d.total_value), 1);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Funnel de Conversión</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((stage, index) => {
            const widthPercent = Math.max((stage.total_value / maxValue) * 100, 15);
            
            return (
              <div key={stage.stage_key} className="relative">
                <div 
                  className="flex items-center justify-between p-3 rounded-md transition-all hover:opacity-90"
                  style={{ 
                    width: `${widthPercent}%`,
                    backgroundColor: `${stage.color}20`,
                    borderLeft: `4px solid ${stage.color}`,
                    minWidth: '200px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: stage.color, color: 'white' }}
                    >
                      {stage.deal_count}
                    </span>
                    <span className="font-medium text-sm">{stage.stage_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(stage.total_value)}</p>
                    <p className="text-xs text-muted-foreground">
                      Pond: {formatCurrency(stage.weighted_value)}
                    </p>
                  </div>
                </div>
                
                {/* Connecting arrow */}
                {index < data.length - 1 && (
                  <div className="flex justify-center py-1">
                    <svg width="20" height="16" viewBox="0 0 20 16" className="text-muted-foreground/30">
                      <path d="M10 16L0 0H20L10 16Z" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
