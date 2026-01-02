import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, Percent } from "lucide-react";
import { useMandatoCosts } from "@/hooks/useMandatoCosts";

interface CostSummaryCardProps {
  mandatoId: string;
}

export function CostSummaryCard({ mandatoId }: CostSummaryCardProps) {
  const { data: costData, isLoading } = useMandatoCosts(mandatoId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  if (!costData || costData.totalHours === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            Coste Estimado de Ejecución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sin horas registradas para calcular el coste
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-5 h-5 text-primary" />
          Coste Estimado de Ejecución
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold">
              €{costData.totalCost.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Coste Total</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold">
              {costData.totalHours}h
            </div>
            <div className="text-xs text-muted-foreground">Total Horas</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Percent className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <div className="text-2xl font-bold">
              {costData.billablePercentage}%
            </div>
            <div className="text-xs text-muted-foreground">Facturable</div>
          </div>
        </div>

        {/* Work Type Breakdown */}
        {costData.costByWorkType.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Por Tipo de Trabajo</h4>
            <div className="space-y-2">
              {costData.costByWorkType.map((item) => {
                const percentage = costData.totalCost > 0 
                  ? (item.cost / costData.totalCost) * 100 
                  : 0;
                return (
                  <div key={item.workType} className="flex items-center gap-3">
                    <div className="w-28 text-sm truncate">{item.workType}</div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm text-muted-foreground">
                      {item.hours}h
                    </div>
                    <div className="w-20 text-right text-sm font-medium">
                      €{item.cost.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Breakdown (if more than one user) */}
        {costData.costByUser.length > 1 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Por Usuario</h4>
            <div className="space-y-2">
              {costData.costByUser.slice(0, 5).map((user) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{user.userName}</span>
                    <Badge variant="outline" className="text-xs">
                      €{user.rate}/h
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{user.hours}h</span>
                    <span className="text-sm font-medium">€{user.cost.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
