// ============================================
// CANDIDATE FUNNEL CHART
// Horizontal funnel visualization with conversion rates
// ============================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Eye, 
  Send, 
  CheckCircle2, 
  FileText, 
  DollarSign,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  type CandidateFunnelStats, 
  type CandidateFunnelStage,
  FUNNEL_STAGES 
} from '@/types/candidateFunnel';

interface CandidateFunnelChartProps {
  stats: CandidateFunnelStats | null;
  onStageClick?: (stage: CandidateFunnelStage) => void;
  activeStage?: CandidateFunnelStage | null;
  isLoading?: boolean;
}

const STAGE_ICONS = {
  teaser_sent: Mail,
  teaser_opened: Eye,
  nda_sent: Send,
  nda_signed: CheckCircle2,
  cim_opened: FileText,
  ioi_received: DollarSign,
};

export function CandidateFunnelChart({ 
  stats, 
  onStageClick, 
  activeStage,
  isLoading 
}: CandidateFunnelChartProps) {
  const stageData = useMemo(() => {
    if (!stats) return [];
    
    const data = [
      { stage: 'teaser_sent' as const, count: stats.teaser_sent, rate: 100 },
      { stage: 'teaser_opened' as const, count: stats.teaser_opened, rate: stats.open_rate },
      { stage: 'nda_sent' as const, count: stats.nda_sent, rate: stats.teaser_sent > 0 ? (stats.nda_sent / stats.teaser_sent) * 100 : 0 },
      { stage: 'nda_signed' as const, count: stats.nda_signed, rate: stats.nda_conversion },
      { stage: 'cim_opened' as const, count: stats.cim_opened, rate: stats.cim_conversion },
      { stage: 'ioi_received' as const, count: stats.ioi_received, rate: stats.ioi_conversion },
    ];
    
    // Calculate conversion rate from previous stage
    return data.map((item, index) => {
      const prevCount = index > 0 ? data[index - 1].count : item.count;
      const conversionFromPrev = prevCount > 0 ? (item.count / prevCount) * 100 : 0;
      return { ...item, conversionFromPrev };
    });
  }, [stats]);

  const maxCount = Math.max(...stageData.map(d => d.count), 1);
  const totalConversion = stats && stats.teaser_sent > 0 
    ? ((stats.ioi_received / stats.teaser_sent) * 100).toFixed(1) 
    : '0';

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Funnel de Candidatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2 py-8">
            {FUNNEL_STAGES.map((stage, i) => (
              <div key={stage.key} className="flex items-center">
                <div className="w-20 h-16 bg-muted animate-pulse rounded" />
                {i < FUNNEL_STAGES.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-1 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Funnel de Candidatos</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="w-4 h-4" />
            <span>Conversión total: <strong className="text-foreground">{totalConversion}%</strong></span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 md:gap-2 py-4">
          {stageData.map((item, index) => {
            const config = FUNNEL_STAGES.find(s => s.key === item.stage)!;
            const Icon = STAGE_ICONS[item.stage];
            const barHeight = Math.max((item.count / maxCount) * 100, 10);
            const isActive = activeStage === item.stage;
            
            return (
              <div key={item.stage} className="flex items-end flex-1">
                <button
                  onClick={() => onStageClick?.(item.stage)}
                  className={cn(
                    "flex flex-col items-center flex-1 p-2 rounded-lg transition-all",
                    "hover:bg-muted/50 cursor-pointer",
                    isActive && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {/* Count */}
                  <span className="text-lg md:text-2xl font-bold mb-1">
                    {item.count}
                  </span>
                  
                  {/* Bar */}
                  <div 
                    className="w-full rounded-t transition-all duration-500 ease-out"
                    style={{ 
                      height: `${barHeight}px`,
                      backgroundColor: config.color,
                      opacity: isActive ? 1 : 0.7,
                    }}
                  />
                  
                  {/* Icon and label */}
                  <div className="flex flex-col items-center mt-2">
                    <Icon 
                      className="w-4 h-4 md:w-5 md:h-5 mb-1" 
                      style={{ color: config.color }} 
                    />
                    <span className="text-[10px] md:text-xs text-center text-muted-foreground leading-tight">
                      {config.shortLabel}
                    </span>
                  </div>
                  
                  {/* Conversion rate from previous */}
                  {index > 0 && (
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {item.conversionFromPrev.toFixed(0)}%
                    </span>
                  )}
                </button>
                
                {/* Arrow between stages */}
                {index < stageData.length - 1 && (
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground/40 shrink-0 mb-12" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Click hint */}
        {onStageClick && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Haz clic en una etapa para filtrar la tabla
          </p>
        )}
      </CardContent>
    </Card>
  );
}
