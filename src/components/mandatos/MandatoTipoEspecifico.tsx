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
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
            Detalles del Mandato de Compra
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Perfil Empresa Buscada */}
          {mandato.perfil_empresa_buscada && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-medium text-purple-900">Perfil de Empresa Buscada</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{mandato.perfil_empresa_buscada}</p>
            </div>
          )}

          {/* Rango de Inversión */}
          {(mandato.rango_inversion_min || mandato.rango_inversion_max) && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-medium text-purple-900">Presupuesto de Inversión</h4>
              </div>
              <p className="text-xl font-bold text-purple-700 pl-6">
                {formatCurrency(mandato.rango_inversion_min)} - {formatCurrency(mandato.rango_inversion_max)}
              </p>
            </div>
          )}

          {/* Sectores de Interés */}
          {mandato.sectores_interes && mandato.sectores_interes.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-medium text-purple-900">Sectores de Interés</h4>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {mandato.sectores_interes.map((sector, idx) => (
                  <Badge key={idx} className="bg-purple-100 text-purple-700 border-purple-200">
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Objetivo */}
          {mandato.timeline_objetivo && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-medium text-purple-900">Timeline Objetivo</h4>
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
        inicial: 'bg-blue-100 text-blue-700 border-blue-200',
        negociacion: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        due_diligence: 'bg-purple-100 text-purple-700 border-purple-200',
        cierre: 'bg-green-100 text-green-700 border-green-200',
      };
      return colors[estado || ''] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Detalles del Mandato de Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valoración Esperada */}
          {mandato.valoracion_esperada && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-medium text-green-900">Target Price</h4>
              </div>
              <p className="text-xl font-bold text-green-700 pl-6">
                {formatCurrency(mandato.valoracion_esperada)}
              </p>
            </div>
          )}

          {/* Tipo de Comprador Buscado */}
          {mandato.tipo_comprador_buscado && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-medium text-green-900">Tipo de Comprador Buscado</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{mandato.tipo_comprador_buscado}</p>
            </div>
          )}

          {/* Estado de Negociación */}
          {mandato.estado_negociacion && (
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-medium text-green-900">Estado de Negociación</h4>
              </div>
              <div className="pl-6">
                <Badge variant="outline" className={getEstadoNegociacionColor(mandato.estado_negociacion)}>
                  {mandato.estado_negociacion.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          )}

          {/* Ofertas Recibidas */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">Ofertas Recibidas</h4>
            </div>
            <p className="text-2xl font-bold text-green-700 pl-6">
              {mandato.numero_ofertas_recibidas || 0}
            </p>
            <p className="text-xs text-muted-foreground pl-6 mt-1">
              {mandato.numero_ofertas_recibidas === 1 ? 'oferta recibida' : 'ofertas recibidas'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
