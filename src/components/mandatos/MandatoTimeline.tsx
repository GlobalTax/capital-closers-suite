import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { MandatoEstado } from "@/types";
import { calcularDuracion } from "@/lib/mandato-utils";

interface MandatoTimelineProps {
  fechaInicio?: string;
  fechaCierre?: string;
  estado: MandatoEstado;
}

export function MandatoTimeline({ fechaInicio, fechaCierre, estado }: MandatoTimelineProps) {
  const duracion = calcularDuracion(fechaInicio, fechaCierre);
  
  if (!duracion) return null;

  const getEstadoColor = () => {
    if (estado === 'cerrado') return 'bg-green-500';
    if (duracion.diasRestantes < 0) return 'bg-red-500';
    if (duracion.diasRestantes < 30) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progreso del Mandato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progreso temporal</span>
            <span className="font-medium">{duracion.progresoTemporal.toFixed(0)}%</span>
          </div>
          <Progress value={duracion.progresoTemporal} className="h-2" />
        </div>

        {/* Timeline Events */}
        <div className="relative space-y-4 pl-6">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
          
          {/* Inicio */}
          <div className="relative flex items-start gap-3">
            <div className="absolute -left-[1.4rem] w-3 h-3 rounded-full bg-primary border-2 border-background" />
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Inicio del Mandato</p>
              <p className="text-xs text-muted-foreground">
                {new Date(fechaInicio!).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Hoy */}
          <div className="relative flex items-start gap-3">
            <div className={`absolute -left-[1.4rem] w-3 h-3 rounded-full border-2 border-background ${getEstadoColor()}`} />
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Hoy</p>
                <Badge variant="outline" className="text-xs">
                  {duracion.diasTranscurridos} días transcurridos
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Cierre */}
          {fechaCierre && (
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-[1.4rem] w-3 h-3 rounded-full bg-border border-2 border-background" />
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Cierre Objetivo</p>
                  {duracion.diasRestantes < 0 ? (
                    <Badge variant="destructive" className="text-xs">
                      Retrasado {Math.abs(duracion.diasRestantes)} días
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {duracion.diasRestantes} días restantes
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(fechaCierre).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Duración total</p>
            <p className="text-lg font-medium">{duracion.duracionDias} días</p>
          </div>
          {fechaCierre && (
            <div>
              <p className="text-sm text-muted-foreground">
                {duracion.diasRestantes >= 0 ? 'Días restantes' : 'Días de retraso'}
              </p>
              <p className={`text-lg font-medium ${duracion.diasRestantes < 0 ? 'text-destructive' : ''}`}>
                {Math.abs(duracion.diasRestantes)} días
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
