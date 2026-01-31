import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingUp, Target, DollarSign, Calendar, Users, Edit } from "lucide-react";
import { Mandato } from "@/types";
import { formatCurrency } from "@/lib/mandato-utils";

interface MandatoTipoEspecificoProps {
  mandato: Mandato;
  onEdit?: () => void;
}

export function MandatoTipoEspecifico({ mandato, onEdit }: MandatoTipoEspecificoProps) {
  // Check if buy-side mandate has any investment criteria defined
  const hasInvestmentCriteria = mandato.perfil_empresa_buscada || 
    mandato.rango_inversion_min || 
    mandato.rango_inversion_max || 
    (mandato.sectores_interes && mandato.sectores_interes.length > 0) || 
    mandato.timeline_objetivo;

  if (mandato.tipo === 'compra') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Detalles del Mandato de Compra
            </CardTitle>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Empty state if no investment criteria */}
          {!hasInvestmentCriteria && (
            <div className="text-center py-6">
              <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                No hay criterios de inversión definidos
              </p>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Definir criterios
                </Button>
              )}
            </div>
          )}

          {/* Perfil Empresa Buscada */}
          {mandato.perfil_empresa_buscada && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Perfil de Empresa Buscada</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{mandato.perfil_empresa_buscada}</p>
            </div>
          )}

          {/* Rango de Inversión */}
          {(mandato.rango_inversion_min || mandato.rango_inversion_max) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Rango de Inversión</h4>
              </div>
              <p className="text-sm font-medium pl-6">
                {formatCurrency(mandato.rango_inversion_min)} - {formatCurrency(mandato.rango_inversion_max)}
              </p>
            </div>
          )}

          {/* Sectores de Interés */}
          {mandato.sectores_interes && mandato.sectores_interes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Sectores de Interés</h4>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {mandato.sectores_interes.map((sector, idx) => (
                  <Badge key={idx} variant="secondary">
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Objetivo */}
          {mandato.timeline_objetivo && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Timeline Objetivo</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{mandato.timeline_objetivo}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (mandato.tipo === 'venta') {
    const getEstadoNegociacionColor = (estado?: string) => {
      const colors: Record<string, string> = {
        inicial: 'bg-blue-100 text-blue-800',
        negociacion: 'bg-yellow-100 text-yellow-800',
        due_diligence: 'bg-purple-100 text-purple-800',
        cierre: 'bg-green-100 text-green-800',
      };
      return colors[estado || ''] || 'bg-gray-100 text-gray-800';
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detalles del Mandato de Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valoración Esperada */}
          {mandato.valoracion_esperada && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Valoración Esperada</h4>
              </div>
              <p className="text-lg font-medium pl-6">{formatCurrency(mandato.valoracion_esperada)}</p>
            </div>
          )}

          {/* Tipo de Comprador Buscado */}
          {mandato.tipo_comprador_buscado && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Tipo de Comprador Buscado</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{mandato.tipo_comprador_buscado}</p>
            </div>
          )}

          {/* Estado de Negociación */}
          {mandato.estado_negociacion && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Estado de Negociación</h4>
              </div>
              <div className="pl-6">
                <Badge className={getEstadoNegociacionColor(mandato.estado_negociacion)}>
                  {mandato.estado_negociacion.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          )}

          {/* Ofertas Recibidas */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Ofertas Recibidas</h4>
            </div>
            <p className="text-lg font-medium pl-6">
              {mandato.numero_ofertas_recibidas || 0} {mandato.numero_ofertas_recibidas === 1 ? 'oferta' : 'ofertas'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
