import { Phone, Mail, MessageCircle, Calendar, FileText, Linkedin, MapPin, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Interaccion } from "@/services/interacciones";

interface TimelineActividadProps {
  interacciones: Interaccion[];
}

const iconMap = {
  llamada: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  reunion: Calendar,
  nota: FileText,
  linkedin: Linkedin,
  visita: MapPin,
};

const colorMap = {
  llamada: "text-blue-500",
  email: "text-purple-500",
  whatsapp: "text-green-500",
  reunion: "text-orange-500",
  nota: "text-gray-500",
  linkedin: "text-blue-600",
  visita: "text-red-500",
};

const resultadoColorMap = {
  positivo: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  negativo: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pendiente_seguimiento: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function TimelineActividad({ interacciones }: TimelineActividadProps) {
  if (interacciones.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay interacciones registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interacciones.map((interaccion, index) => {
        const Icon = iconMap[interaccion.tipo];
        const colorClass = colorMap[interaccion.tipo];

        return (
          <div key={interaccion.id} className="relative pl-8 pb-8 last:pb-0">
            {/* Línea vertical del timeline */}
            {index < interacciones.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
            )}

            {/* Icono del tipo de interacción */}
            <div className={`absolute left-0 top-0 p-2 rounded-full bg-background border-2 ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Card con el contenido */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{interaccion.titulo}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {format(new Date(interaccion.fecha), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </span>
                      {interaccion.duracion_minutos && (
                        <span className="text-xs">({interaccion.duracion_minutos} min)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {interaccion.tipo}
                    </Badge>
                    {interaccion.resultado && (
                      <Badge className={resultadoColorMap[interaccion.resultado]}>
                        {interaccion.resultado.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>

                {interaccion.descripcion && (
                  <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">
                    {interaccion.descripcion}
                  </p>
                )}

                {interaccion.siguiente_accion && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Siguiente acción
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          {interaccion.siguiente_accion}
                        </p>
                        {interaccion.fecha_siguiente_accion && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Fecha: {format(new Date(interaccion.fecha_siguiente_accion), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {interaccion.documentos_adjuntos && Array.isArray(interaccion.documentos_adjuntos) && interaccion.documentos_adjuntos.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{interaccion.documentos_adjuntos.length} documento(s) adjunto(s)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
