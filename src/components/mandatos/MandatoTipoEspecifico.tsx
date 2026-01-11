import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, TrendingUp, Target, DollarSign, Calendar, Users } from "lucide-react";
import { Mandato } from "@/types";
import { formatCurrency } from "@/lib/mandato-utils";

interface MandatoTipoEspecificoProps {
  mandato: Mandato;
}

export function MandatoTipoEspecifico({ mandato }: MandatoTipoEspecificoProps) {
  if (mandato.tipo === 'compra') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Detalles del Mandato de Compra
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
