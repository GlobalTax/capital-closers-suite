import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EnrichmentBadgeProps {
  fechaEnriquecimiento?: string | null;
  fuente?: string | null;
  compact?: boolean;
}

export function EnrichmentBadge({ fechaEnriquecimiento, fuente, compact = false }: EnrichmentBadgeProps) {
  if (!fechaEnriquecimiento) {
    if (compact) return null;
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
        <Clock className="h-3 w-3" />
        Sin enriquecer
      </Badge>
    );
  }

  const dateStr = format(new Date(fechaEnriquecimiento), "d MMM yyyy", { locale: es });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="gap-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <Sparkles className="h-3 w-3" />
          {compact ? "IA" : "Enriquecida"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Enriquecida el {dateStr}</p>
        {fuente && <p className="text-xs text-muted-foreground">Fuente: {fuente}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
