import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, GripVertical, TrendingUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TARGET_FUNNEL_CONFIG, MandatoEmpresaBuySide } from "@/types";

interface TargetPipelineCardProps {
  target: MandatoEmpresaBuySide;
  onClick?: () => void;
  isDragging?: boolean;
}

export function TargetPipelineCard({ target, onClick, isDragging = false }: TargetPipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: target.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const empresa = target.empresa;
  const scoring = target.scoring;
  const ofertas = target.ofertas || [];
  const funnelStage = target.funnel_stage || 'long_list';
  const funnelConfig = TARGET_FUNNEL_CONFIG[funnelStage];
  const matchScore = target.match_score || 0;

  const formatCurrency = (value: number | undefined) => {
    if (!value) return null;
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300";
    if (score >= 40) return "text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300";
    return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300";
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-2 cursor-pointer transition-all hover:shadow-md",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg ring-2 ring-primary",
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Header con drag handle */}
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {empresa?.nombre || "Sin nombre"}
              </span>
            </div>
            {empresa?.sector && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {empresa.sector}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Funnel stage */}
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{ borderColor: funnelConfig.color, color: funnelConfig.color }}
          >
            {funnelConfig.label}
          </Badge>

          {/* Score total */}
          {scoring && (
            <Badge className={cn("text-xs", getScoreColor(scoring.score_total))}>
              {scoring.score_total}%
            </Badge>
          )}

          {/* Match score */}
          {matchScore > 0 && (
            <Badge variant="secondary" className="text-xs gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" />
              {matchScore}%
            </Badge>
          )}

          {/* Ofertas count */}
          {ofertas.length > 0 && (
            <Badge variant="outline" className="text-xs gap-0.5">
              <FileText className="h-2.5 w-2.5" />
              {ofertas.length}
            </Badge>
          )}
        </div>

        {/* Financials */}
        {(empresa?.facturacion || empresa?.revenue) && (
          <div className="text-xs text-muted-foreground">
            {formatCurrency(empresa.facturacion || empresa.revenue)} facturación
          </div>
        )}
      </div>
    </Card>
  );
}
