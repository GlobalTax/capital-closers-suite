import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, DollarSign, MapPin, Calendar, Building2, Edit } from "lucide-react";
import type { Mandato } from "@/types";

interface CriteriosInversionCardProps {
  mandato: Mandato;
  onEdit?: () => void;
}

export function CriteriosInversionCard({ mandato, onEdit }: CriteriosInversionCardProps) {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return "N/A";
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };

  const rangoMin = mandato.rango_inversion_min || 0;
  const rangoMax = mandato.rango_inversion_max || 0;
  const sectores = mandato.sectores_interes || [];
  const perfil = mandato.perfil_empresa_buscada;
  const timeline = mandato.timeline_objetivo;

  // Calcular progreso visual del rango (posición relativa)
  const rangoMedio = rangoMax > 0 ? ((rangoMin + rangoMax) / 2) : 0;

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-orange-500" />
            </div>
            <CardTitle className="text-base">Criterios de Inversión</CardTitle>
          </div>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Perfil de empresa buscada */}
        {perfil && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>Perfil buscado</span>
            </div>
            <p className="text-sm">{perfil}</p>
          </div>
        )}

        {/* Rango de inversión */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Rango de inversión</span>
            </div>
            <span className="font-medium">
              {formatCurrency(rangoMin)} - {formatCurrency(rangoMax)}
            </span>
          </div>
          <div className="relative">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                style={{ 
                  width: rangoMax > 0 ? '100%' : '0%',
                }}
              />
            </div>
            {rangoMax > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatCurrency(rangoMin)}</span>
                <span className="text-orange-600 font-medium">
                  Objetivo: {formatCurrency(rangoMedio)}
                </span>
                <span>{formatCurrency(rangoMax)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sectores de interés */}
        {sectores.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>Sectores objetivo</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sectores.map((sector, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary"
                  className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                >
                  {sector}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Timeline objetivo */}
        {timeline && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Timeline:</span>
            <span className="text-sm font-medium">{timeline}</span>
          </div>
        )}

        {/* Empty state si no hay criterios */}
        {!perfil && !rangoMax && sectores.length === 0 && !timeline && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              No hay criterios de inversión definidos
            </p>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                Definir criterios
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
