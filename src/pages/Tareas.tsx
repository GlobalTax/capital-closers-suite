import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";

export default function Tareas() {
  const tareasKanban = {
    "Por Hacer": [
      {
        id: 1,
        titulo: "Llamar a cliente TechCorp",
        prioridad: "Alta",
        fecha: "2024-01-25",
        asignado: "María G.",
      },
      {
        id: 2,
        titulo: "Preparar documentación M-003",
        prioridad: "Media",
        fecha: "2024-01-26",
        asignado: "Carlos R.",
      },
    ],
    "En Progreso": [
      {
        id: 3,
        titulo: "Análisis financiero DataStream",
        prioridad: "Alta",
        fecha: "2024-01-24",
        asignado: "Ana M.",
      },
    ],
    Completadas: [
      {
        id: 4,
        titulo: "Reunión con InnovateLab",
        prioridad: "Media",
        fecha: "2024-01-23",
        asignado: "Juan D.",
      },
    ],
  };

  const getPrioridadColor = (prioridad: string) => {
    return prioridad === "Alta" ? "destructive" : "secondary";
  };

  return (
    <div>
      <PageHeader
        title="Tareas"
        description="Gestión de tareas y actividades del equipo"
        actionLabel="Nueva Tarea"
        onAction={() => console.log("Crear nueva tarea")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(tareasKanban).map(([estado, tareas]) => (
          <div key={estado} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{estado}</h3>
              <Badge variant="outline">{tareas.length}</Badge>
            </div>
            <div className="space-y-3">
              {tareas.map((tarea) => (
                <Card key={tarea.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium">
                        {tarea.titulo}
                      </CardTitle>
                      <Badge variant={getPrioridadColor(tarea.prioridad)} className="text-xs">
                        {tarea.prioridad}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{tarea.fecha}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{tarea.asignado}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
