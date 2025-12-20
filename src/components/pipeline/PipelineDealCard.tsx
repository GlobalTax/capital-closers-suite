import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Building2, Calendar, Clock, TrendingUp, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PipelineMandato } from "@/types/pipeline";

interface PipelineDealCardProps {
  deal: PipelineMandato;
  isDragging?: boolean;
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

export function PipelineDealCard({ deal, isDragging = false }: PipelineDealCardProps) {
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
    // Solo navegar si no estamos arrastrando
    if (!transform) {
      navigate(`/mandatos/${deal.id}`);
    }
  };

  const isStuck = deal.days_in_stage > 30;
  const TypeIcon = deal.tipo === 'compra' ? ShoppingCart : TrendingUp;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "cursor-grab active:cursor-grabbing border-border/50 hover:border-border hover:shadow-sm transition-all",
        isDragging && "opacity-50 shadow-lg rotate-2",
        isStuck && "border-destructive/50"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight truncate">
              {deal.empresa_principal?.nombre || deal.descripcion || 'Sin nombre'}
            </p>
            {deal.empresa_principal?.sector && (
              <p className="text-xs text-muted-foreground truncate">
                {deal.empresa_principal.sector}
              </p>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 shrink-0",
              deal.tipo === 'compra' 
                ? "border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-950/30" 
                : "border-green-500/30 text-green-600 bg-green-50 dark:bg-green-950/30"
            )}
          >
            <TypeIcon className="h-3 w-3 mr-0.5" />
            {deal.tipo === 'compra' ? 'C' : 'V'}
          </Badge>
        </div>

        {/* Value */}
        {deal.valor && (
          <div className="flex items-center justify-between">
            <span className="text-base font-bold">
              {formatCurrency(deal.valor)}
            </span>
            <span className="text-xs text-muted-foreground">
              {deal.probability}%
            </span>
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={cn(isStuck && "text-destructive font-medium")}>
              {deal.days_in_stage}d
            </span>
          </div>
          {deal.expected_close_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
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
