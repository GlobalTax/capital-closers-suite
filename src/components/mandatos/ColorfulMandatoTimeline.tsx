import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  CheckCircle,
  Handshake,
  Trophy,
  XCircle,
  Calendar,
} from "lucide-react";
import { calcularDuracion } from "@/lib/mandato-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ColorfulMandatoTimelineProps {
  fechaInicio?: string;
  fechaCierre?: string;
  estado: string;
}

const estadoConfig = {
  prospecto: {
    label: 'Prospecto',
    icon: Eye,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    progress: 10,
  },
  activo: {
    label: 'Activo',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    progress: 50,
  },
  en_negociacion: {
    label: 'En Negociación',
    icon: Handshake,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    progress: 75,
  },
  cerrado: {
    label: 'Cerrado',
    icon: Trophy,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    progress: 100,
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    progress: 0,
  },
};

export function ColorfulMandatoTimeline({
  fechaInicio,
  fechaCierre,
  estado,
}: ColorfulMandatoTimelineProps) {
  const config = estadoConfig[estado as keyof typeof estadoConfig] || estadoConfig.activo;
  const Icon = config.icon;

  const duracion = calcularDuracion(fechaInicio, fechaCierre);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline del Mandato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado Actual */}
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-full", config.bgColor)}>
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado Actual</p>
            <p className={cn("text-lg font-semibold", config.color)}>
              {config.label}
            </p>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{config.progress}%</span>
          </div>
          <Progress value={config.progress} className="h-2" />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          {fechaInicio && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Inicio</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {format(new Date(fechaInicio), "d MMM yyyy", { locale: es })}
              </Badge>
            </div>
          )}
          
          {fechaCierre && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cierre</p>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {format(new Date(fechaCierre), "d MMM yyyy", { locale: es })}
              </Badge>
            </div>
          )}
        </div>

        {/* Duración */}
        {duracion && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{duracion.duracionDias}</p>
              <p className="text-xs text-muted-foreground">Días Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{duracion.diasTranscurridos}</p>
              <p className="text-xs text-muted-foreground">Transcurridos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {duracion.diasRestantes > 0 ? duracion.diasRestantes : 0}
              </p>
              <p className="text-xs text-muted-foreground">Restantes</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
