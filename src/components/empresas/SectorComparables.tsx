import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, DollarSign, Percent } from "lucide-react";
import type { SectorMultiple } from "@/services/valuations.service";

interface SectorComparablesProps {
  multiples: SectorMultiple[];
  currentSector?: string;
  currentMultiple?: number;
  isLoading?: boolean;
}

export function SectorComparables({
  multiples,
  currentSector,
  currentMultiple,
  isLoading,
}: SectorComparablesProps) {
  if (isLoading) {
    return <SectorComparablesSkeleton />;
  }

  if (!multiples || multiples.length === 0) {
    return null;
  }

  // Find current sector or similar
  const matchedSector = currentSector
    ? multiples.find(m => 
        m.sector_name.toLowerCase().includes(currentSector.toLowerCase()) ||
        currentSector.toLowerCase().includes(m.sector_name.toLowerCase())
      )
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          Múltiplos por Sector
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {multiples.slice(0, 8).map((sector) => {
            const isCurrentSector = matchedSector?.sector_name === sector.sector_name;
            
            return (
              <div
                key={sector.sector_name}
                className={`p-3 rounded-lg border transition-colors ${
                  isCurrentSector 
                    ? 'bg-purple-50 border-purple-200' 
                    : 'bg-background hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{sector.sector_name}</span>
                    {isCurrentSector && (
                      <Badge variant="secondary" className="text-xs">Tu sector</Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* EBITDA Multiple */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="h-3 w-3" />
                      EBITDA
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium">
                        {sector.ebitda_multiple_median.toFixed(1)}x
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({sector.ebitda_multiple_min.toFixed(1)}-{sector.ebitda_multiple_max.toFixed(1)})
                      </span>
                    </div>
                    {isCurrentSector && currentMultiple && (
                      <div className="mt-1">
                        <Badge 
                          variant={currentMultiple >= sector.ebitda_multiple_median ? "default" : "outline"}
                          className="text-xs"
                        >
                          Tu múltiplo: {currentMultiple.toFixed(1)}x
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Revenue Multiple */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <DollarSign className="h-3 w-3" />
                      Revenue
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium">
                        {sector.revenue_multiple_median.toFixed(1)}x
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({sector.revenue_multiple_min.toFixed(1)}-{sector.revenue_multiple_max.toFixed(1)})
                      </span>
                    </div>
                  </div>

                  {/* Net Profit Multiple */}
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Percent className="h-3 w-3" />
                      Beneficio Neto
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-medium">
                        {sector.net_profit_multiple_median.toFixed(1)}x
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({sector.net_profit_multiple_min.toFixed(1)}-{sector.net_profit_multiple_max.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SectorComparablesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
