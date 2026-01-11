import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, FileText, Clock, Link, Building2 } from "lucide-react";
import type { Mandato } from "@/types";
import { 
  MANDATO_CATEGORIA_LABELS, 
  SERVICIO_TIPO_LABELS, 
  ESTRUCTURA_HONORARIOS_LABELS,
  PIPELINE_STAGE_LABELS_SERVICIO
} from "@/lib/constants";
import { Link as RouterLink } from "react-router-dom";

interface ServicioHonorariosCardProps {
  mandato: Mandato;
}

export function ServicioHonorariosCard({ mandato }: ServicioHonorariosCardProps) {
  const categoriaConfig = MANDATO_CATEGORIA_LABELS[mandato.categoria || "asesoria"];
  const pipelineStage = (mandato as any).pipeline_stage;
  const stageLabel = pipelineStage 
    ? PIPELINE_STAGE_LABELS_SERVICIO[pipelineStage] || pipelineStage 
    : "Sin definir";

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {categoriaConfig?.label || "Servicio"}
          </CardTitle>
          <Badge variant="outline">{stageLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del cliente */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-medium">
              {mandato.empresa_principal?.nombre || mandato.cliente_externo || "Sin definir"}
            </p>
          </div>
        </div>

        {/* Tipo de servicio */}
        {mandato.servicio_tipo && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Servicio</p>
              <p className="font-medium">
                {SERVICIO_TIPO_LABELS[mandato.servicio_tipo] || mandato.servicio_tipo}
              </p>
            </div>
          </div>
        )}

        {/* Honorarios */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Euro className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Propuesto</span>
            </div>
            <p className="text-lg font-medium">
              {formatCurrency(mandato.honorarios_propuestos)}
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Euro className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Aceptado</span>
            </div>
            <p className="text-lg font-medium text-green-600">
              {formatCurrency(mandato.honorarios_aceptados)}
            </p>
          </div>
        </div>

        {/* Estructura de honorarios */}
        {mandato.estructura_honorarios && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estructura:</span>
            <Badge variant="secondary">
              {ESTRUCTURA_HONORARIOS_LABELS[mandato.estructura_honorarios] || mandato.estructura_honorarios}
            </Badge>
          </div>
        )}

        {/* Operación vinculada */}
        {mandato.parent_mandato_id && (
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <Link className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Vinculado a operación</p>
              <RouterLink 
                to={`/mandatos/${mandato.parent_mandato_id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver operación principal →
              </RouterLink>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}