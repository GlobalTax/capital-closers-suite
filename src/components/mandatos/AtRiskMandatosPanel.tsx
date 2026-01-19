import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAtRiskMandatos, AtRiskMandato } from "@/hooks/useAtRiskMandatos";
import { TimeEntry } from "@/types";

const formatCurrency = (value?: number) => {
  if (!value) return '-';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface AtRiskMandatosPanelProps {
  entries: TimeEntry[];
  minHoursThreshold?: number;
  maxProbability?: number;
  loading?: boolean;
  className?: string;
}

function AtRiskMandatoItem({ 
  mandato, 
  onClick 
}: { 
  mandato: AtRiskMandato; 
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-background/60 
                 cursor-pointer hover:bg-background transition-colors border border-transparent
                 hover:border-amber-500/20 group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{mandato.codigo}</span>
            <span className="text-sm text-muted-foreground truncate max-w-[180px] md:max-w-[280px]">
              {mandato.descripcion}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
            <span className="text-amber-600 font-medium">
              Prob: {mandato.probability}%
            </span>
            {mandato.valor && (
              <>
                <span>·</span>
                <span>{formatCurrency(mandato.valor)}</span>
              </>
            )}
            <span>·</span>
            <Badge variant="outline" className="text-xs py-0 h-5">
              {mandato.pipeline_stage || mandato.estado}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="text-lg font-semibold text-amber-600">
          {mandato.total_hours.toFixed(1)}h
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
      <div>
        <p className="font-medium text-green-700 dark:text-green-400">
          No hay mandatos en riesgo
        </p>
        <p className="text-sm text-muted-foreground">
          Todos los mandatos con tiempo significativo tienen buena probabilidad de cierre
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/60">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function AtRiskMandatosPanel({
  entries,
  minHoursThreshold = 30,
  maxProbability = 40,
  loading = false,
  className = "",
}: AtRiskMandatosPanelProps) {
  const navigate = useNavigate();
  
  const { atRiskMandatos, count, totalHoursAtRisk, config } = useAtRiskMandatos(entries, {
    minHoursThreshold,
    maxProbability,
  });

  const handleMandatoClick = (mandatoId: string) => {
    navigate(`/mandatos/${mandatoId}`);
  };

  return (
    <Card className={`border-amber-500/30 bg-amber-500/5 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-base font-semibold">
              {count > 0 ? (
                <>
                  {count} Mandato{count !== 1 ? 's' : ''} en Riesgo
                </>
              ) : (
                'Mandatos en Riesgo'
              )}
            </span>
            {count > 0 && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400">
                {totalHoursAtRisk.toFixed(0)}h invertidas
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            &gt;{config.minHoursThreshold}h · &lt;{config.maxProbability}% prob
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <LoadingSkeleton />
        ) : count === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {atRiskMandatos.map((mandato) => (
              <AtRiskMandatoItem
                key={mandato.mandato_id}
                mandato={mandato}
                onClick={() => handleMandatoClick(mandato.mandato_id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
