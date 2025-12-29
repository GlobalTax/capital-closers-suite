import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  ShoppingCart,
  AlertTriangle,
  Building2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { PipelineMandato } from "@/types/pipeline";

interface PipelineDealCardProps {
  deal: PipelineMandato;
  isDragging?: boolean;
  stageColor?: string;
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

export function PipelineDealCard({ deal, isDragging = false, stageColor }: PipelineDealCardProps) {
  const navigate = useNavigate();
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    if (!transform) {
      navigate(`/mandatos/${deal.id}`);
    }
  };

  const isStuck = deal.days_in_stage > 30;
  const isCompra = deal.tipo === 'compra';
  const TypeIcon = isCompra ? ShoppingCart : TrendingUp;
  
  const typeConfig = isCompra 
    ? { 
        label: 'COMPRA', 
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/30',
        iconBg: 'bg-blue-500'
      }
    : { 
        label: 'VENTA', 
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        iconBg: 'bg-emerald-500'
      };

  const getDaysColor = () => {
    if (deal.days_in_stage <= 7) return 'text-emerald-500';
    if (deal.days_in_stage <= 14) return 'text-amber-500';
    if (deal.days_in_stage <= 30) return 'text-orange-500';
    return 'text-destructive';
  };

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all duration-200",
        "border-l-[3px] hover:shadow-lg hover:scale-[1.02]",
        "bg-card hover:bg-accent/5",
        isDragging && "opacity-60 shadow-xl rotate-1 scale-105",
        isStuck && "ring-1 ring-destructive/30"
      )}
      style={{
        ...style,
        borderLeftColor: stageColor || 'hsl(var(--border))'
      }}
    >
      <CardContent className="p-3 space-y-3">
        {/* Type badge + Alert */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 gap-1",
              typeConfig.bg,
              typeConfig.text,
              typeConfig.border
            )}
          >
            <TypeIcon className="h-3 w-3" />
            {typeConfig.label}
          </Badge>
          {isStuck && (
            <div className="flex items-center gap-1 text-[10px] text-destructive font-medium">
              <AlertTriangle className="h-3 w-3" />
              Estancado
            </div>
          )}
        </div>

        {/* Company info */}
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <div className={cn("p-1.5 rounded-lg shrink-0", typeConfig.iconBg)}>
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-tight truncate">
                {deal.empresa_principal?.nombre || deal.descripcion || 'Sin nombre'}
              </p>
              {deal.empresa_principal?.sector && (
                <Badge variant="secondary" className="text-[10px] mt-1 px-1.5 py-0">
                  {deal.empresa_principal.sector}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Value section */}
        {deal.valor && (
          <div className="bg-muted/50 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-bold tracking-tight">
                {formatCurrency(deal.valor)}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {deal.probability}% prob.
              </span>
            </div>
            <Progress 
              value={deal.probability} 
              className="h-1.5"
              style={{
                // @ts-ignore
                '--progress-background': stageColor || 'hsl(var(--primary))'
              }}
            />
            {deal.weighted_value && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Pond: <span className="font-medium">{formatCurrency(deal.weighted_value)}</span>
              </p>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={cn("font-medium", getDaysColor())}>
              {deal.days_in_stage} días
            </span>
          </div>
          {deal.expected_close_date && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">
                {new Date(deal.expected_close_date).toLocaleDateString('es-ES', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
