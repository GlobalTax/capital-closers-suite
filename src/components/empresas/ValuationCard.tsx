import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Link2, 
  Link2Off,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CompanyValuation, SectorMultiple } from "@/services/valuations.service";

interface ValuationCardProps {
  valuation: CompanyValuation;
  sectorMultiple?: SectorMultiple | null;
  onUnlink?: (valuationId: string) => void;
  isUnlinking?: boolean;
}

export function ValuationCard({ 
  valuation, 
  sectorMultiple, 
  onUnlink,
  isUnlinking 
}: ValuationCardProps) {
  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value.toFixed(0)}`;
  };

  const getMatchBadge = () => {
    switch (valuation.match_type) {
      case 'linked':
        return <Badge variant="default" className="bg-green-600">Vinculada</Badge>;
      case 'cif_match':
        return <Badge variant="secondary">Match por CIF</Badge>;
      case 'name_match':
        return <Badge variant="outline">Match por Nombre</Badge>;
      default:
        return null;
    }
  };

  const getMultipleComparison = () => {
    if (!valuation.ebitda_multiple_used || !sectorMultiple) return null;
    
    const median = sectorMultiple.ebitda_multiple_median;
    const diff = valuation.ebitda_multiple_used - median;
    const percentDiff = ((diff / median) * 100).toFixed(0);

    if (diff > 0.5) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowUpRight className="h-4 w-4" />
          <span className="text-sm font-medium">+{percentDiff}% vs sector</span>
        </div>
      );
    } else if (diff < -0.5) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <ArrowDownRight className="h-4 w-4" />
          <span className="text-sm font-medium">{percentDiff}% vs sector</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm">En línea con sector</span>
      </div>
    );
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-background">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Valoración</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(valuation.created_at), "d MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getMatchBadge()}
            {valuation.match_type === 'linked' && onUnlink && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onUnlink(valuation.id)}
                disabled={isUnlinking}
              >
                <Link2Off className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Valuation */}
        <div className="text-center py-4 bg-background rounded-lg border">
          <p className="text-sm text-muted-foreground mb-1">Valoración Final</p>
          <p className="text-4xl font-bold text-purple-600">
            {formatCurrency(valuation.final_valuation)}
          </p>
          {(valuation.valuation_range_min || valuation.valuation_range_max) && (
            <p className="text-sm text-muted-foreground mt-1">
              Rango: {formatCurrency(valuation.valuation_range_min)} - {formatCurrency(valuation.valuation_range_max)}
            </p>
          )}
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-background rounded-lg border text-center">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-semibold">{formatCurrency(valuation.revenue)}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border text-center">
            <p className="text-xs text-muted-foreground">EBITDA</p>
            <p className="text-lg font-semibold">{formatCurrency(valuation.ebitda)}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border text-center">
            <p className="text-xs text-muted-foreground">Múltiplo</p>
            <p className="text-lg font-semibold">
              {valuation.ebitda_multiple_used?.toFixed(1) || "-"}x
            </p>
          </div>
        </div>

        {/* Sector Comparison */}
        {sectorMultiple && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{sectorMultiple.sector_name}</span>
              </div>
              {getMultipleComparison()}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Min:</span>{" "}
                <span className="font-medium">{sectorMultiple.ebitda_multiple_min}x</span>
              </div>
              <div>
                <span className="text-muted-foreground">Med:</span>{" "}
                <span className="font-medium">{sectorMultiple.ebitda_multiple_median}x</span>
              </div>
              <div>
                <span className="text-muted-foreground">Max:</span>{" "}
                <span className="font-medium">{sectorMultiple.ebitda_multiple_max}x</span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Sector</p>
            <p className="font-medium">{valuation.industry}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Empleados</p>
            <p className="font-medium">{valuation.employee_range}</p>
          </div>
          {valuation.location && (
            <div>
              <p className="text-muted-foreground">Ubicación</p>
              <p className="font-medium">{valuation.location}</p>
            </div>
          )}
          {valuation.cif && (
            <div>
              <p className="text-muted-foreground">CIF</p>
              <p className="font-medium">{valuation.cif}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ValuationCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </CardContent>
    </Card>
  );
}
