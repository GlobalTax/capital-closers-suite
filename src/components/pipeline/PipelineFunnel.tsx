import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  FileText, 
  Eye, 
  Handshake, 
  CheckCircle2,
  ChevronDown,
  ArrowDown
} from "lucide-react";
import type { PipelineSummary } from "@/types/pipeline";
import { cn } from "@/lib/utils";

interface PipelineFunnelProps {
  data: PipelineSummary[];
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

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const maxDeals = Math.max(...data.map(d => d.deal_count), 1);
  
  // Calculate conversion rates between stages
  const getConversionRate = (currentIndex: number) => {
    if (currentIndex === 0) return null;
    const prevDeals = data[currentIndex - 1]?.deal_count || 0;
    const currentDeals = data[currentIndex]?.deal_count || 0;
    if (prevDeals === 0) return 0;
    return Math.round((currentDeals / prevDeals) * 100);
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <ChevronDown className="h-4 w-4 text-purple-500" />
          </div>
          <CardTitle className="text-base font-semibold">Funnel de Conversión</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-2">
          {data.map((stage, index) => {
            const Icon = STAGE_ICONS[stage.stage_key] || Search;
            const widthPercent = Math.max((stage.deal_count / maxDeals) * 100, 25);
            const conversionRate = getConversionRate(index);
            
            return (
              <div 
                key={stage.stage_key} 
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Conversion arrow between stages */}
                {index > 0 && (
                  <div className="flex items-center justify-center py-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-px w-8 bg-border" />
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                        <ArrowDown className="h-3 w-3" />
                        <span className="font-medium">
                          {conversionRate}%
                        </span>
                      </div>
                      <div className="h-px w-8 bg-border" />
                    </div>
                  </div>
                )}
                
                {/* Funnel bar */}
                <div 
                  className={cn(
                    "relative mx-auto rounded-xl transition-all duration-300",
                    "hover:scale-[1.02] hover:shadow-lg cursor-pointer",
                    "border border-transparent hover:border-border/50"
                  )}
                  style={{ 
                    width: `${widthPercent}%`,
                    minWidth: '240px',
                  }}
                >
                  <div 
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${stage.color}25 0%, ${stage.color}10 100%)`,
                      borderLeft: `4px solid ${stage.color}`,
                    }}
                  >
                    {/* Left side - Icon and info */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2.5 rounded-lg shadow-sm"
                        style={{ backgroundColor: stage.color }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{stage.stage_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stage.default_probability}% probabilidad
                        </p>
                      </div>
                    </div>

                    {/* Center - Deal count */}
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white shadow-lg"
                      style={{ backgroundColor: stage.color }}
                    >
                      {stage.deal_count}
                    </div>

                    {/* Right side - Values */}
                    <div className="text-right">
                      <p className="font-bold text-base">{formatCurrency(stage.total_value)}</p>
                      <p className="text-xs text-muted-foreground">
                        Pond: <span className="font-medium" style={{ color: stage.color }}>
                          {formatCurrency(stage.weighted_value)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-muted-foreground">Conversión total:</span>
            </div>
            <span className="font-bold">
              {data.length > 1 && data[0].deal_count > 0
                ? `${Math.round((data[data.length - 1]?.deal_count / data[0].deal_count) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
