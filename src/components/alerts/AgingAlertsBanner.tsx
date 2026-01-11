import { useAgingAlerts } from "@/hooks/useAgingAlerts";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  ChevronRight,
  X
} from "lucide-react";
import { useState } from "react";

interface AgingAlertsBannerProps {
  variant?: "compact" | "expanded";
  showDismiss?: boolean;
  maxItems?: number;
}

export function AgingAlertsBanner({ 
  variant = "expanded", 
  showDismiss = true,
  maxItems = 5 
}: AgingAlertsBannerProps) {
  const navigate = useNavigate();
  const { 
    hasAlerts, 
    totalCount, 
    criticalCount, 
    warningCount, 
    top5,
    stuckDeals,
    inactiveDeals,
    isLoading 
  } = useAgingAlerts();
  
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !hasAlerts || dismissed) return null;

  const displayItems = top5.slice(0, maxItems);
  const hasCritical = criticalCount > 0;

  if (variant === "compact") {
    return (
      <Alert variant={hasCritical ? "destructive" : "default"} className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {totalCount} mandato{totalCount !== 1 ? 's' : ''} requieren atención
          {criticalCount > 0 && (
            <Badge variant="destructive">{criticalCount} críticos</Badge>
          )}
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between mt-2">
          <span>
            {stuckDeals.length} estancados · {inactiveDeals.length} sin actividad
          </span>
          <Button variant="ghost" size="sm" onClick={() => navigate("/mandatos")}>
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`rounded-lg border p-4 mb-6 ${
      hasCritical 
        ? "bg-destructive/10 border-destructive/30" 
        : "bg-yellow-500/10 border-yellow-500/30"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${hasCritical ? "text-destructive" : "text-yellow-600"}`} />
          <h3 className="font-medium">
            {totalCount} Mandato{totalCount !== 1 ? 's' : ''} en Riesgo
          </h3>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} críticos</Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">{warningCount} advertencias</Badge>
            )}
          </div>
        </div>
        {showDismiss && (
          <Button variant="ghost" size="icon" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {displayItems.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-2 rounded bg-background/60 
                       cursor-pointer hover:bg-background transition-colors"
            onClick={() => navigate(`/mandatos/${alert.mandato_id}`)}
          >
            <div className="flex items-center gap-3">
              {alert.alert_type === 'stuck_deal' ? (
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {alert.empresa_nombre || 'Sin empresa'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {alert.alert_type === 'stuck_deal' 
                    ? `${alert.daysValue} días en ${alert.pipeline_stage || 'stage'}`
                    : `${alert.daysValue} días sin actividad`
                  }
                </p>
              </div>
            </div>
            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
              {alert.daysValue}d
            </Badge>
          </div>
        ))}
      </div>

      {totalCount > maxItems && (
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-muted-foreground"
          onClick={() => navigate("/mandatos")}
        >
          Ver {totalCount - maxItems} más <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
