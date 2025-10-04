import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { fetchTareas, updateTarea } from "@/services/api";
import type { Tarea, TareaEstado } from "@/types";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TareaCardProps {
  tarea: Tarea;
}

function TareaCard({ tarea }: TareaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPrioridadVariant = (prioridad: string) => {
    if (prioridad === "alta") return "destructive";
    if (prioridad === "media") return "default";
    return "secondary";
  };

  const getPrioridadLabel = (prioridad: string) => {
    if (prioridad === "alta") return "Alta";
    if (prioridad === "media") return "Media";
    return "Baja";
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">{tarea.titulo}</CardTitle>
          <Badge variant={getPrioridadVariant(tarea.prioridad)} className="text-xs">
            {getPrioridadLabel(tarea.prioridad)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{tarea.fechaVencimiento}</span>
          </div>
          {tarea.asignado && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{tarea.asignado}</span>
            </div>
          )}
        </div>
        {tarea.mandatoNombre && (
          <div className="mt-2 text-xs text-muted-foreground">
            {tarea.mandatoNombre}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTarea, setActiveTarea] = useState<Tarea | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    setLoading(true);
    try {
      const data = await fetchTareas();
      setTareas(data);
    } catch (error) {
      console.error("Error cargando tareas:", error);
      toast.error("Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const tarea = tareas.find((t) => t.id === event.active.id);
    setActiveTarea(tarea || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTarea(null);

    if (!over) return;

    const tareaId = active.id as string;
    const nuevoEstado = over.id as TareaEstado;

    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea || tarea.estado === nuevoEstado) return;

    // Optimistic update
    setTareas((prev) =>
      prev.map((t) => (t.id === tareaId ? { ...t, estado: nuevoEstado } : t))
    );

    try {
      await updateTarea(tareaId, { estado: nuevoEstado });
      toast.success("Tarea actualizada");
    } catch (error) {
      console.error("Error actualizando tarea:", error);
      toast.error("Error al actualizar la tarea");
      // Revertir cambio
      setTareas((prev) =>
        prev.map((t) => (t.id === tareaId ? tarea : t))
      );
    }
  };

  const columnas: { id: TareaEstado; label: string }[] = [
    { id: "pendiente", label: "Pendiente" },
    { id: "en-progreso", label: "En Progreso" },
    { id: "completada", label: "Completada" },
  ];

  const getTareasPorEstado = (estado: TareaEstado) => {
    return tareas.filter((t) => t.estado === estado);
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Tareas"
          description="Gestión de tareas y actividades del equipo"
          actionLabel="Nueva Tarea"
          onAction={() => toast.info("Función disponible próximamente")}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tareas"
        description="Gestión de tareas y actividades del equipo"
        actionLabel="Nueva Tarea"
        onAction={() => toast.info("Función disponible próximamente")}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columnas.map((columna) => {
            const tareasColumna = getTareasPorEstado(columna.id);
            return (
              <SortableContext
                key={columna.id}
                id={columna.id}
                items={tareasColumna.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{columna.label}</h3>
                    <Badge variant="outline">{tareasColumna.length}</Badge>
                  </div>
                  <div
                    className="space-y-3 min-h-[400px] p-2 rounded-lg border-2 border-dashed border-muted"
                    data-droppable-id={columna.id}
                  >
                    {tareasColumna.map((tarea) => (
                      <TareaCard key={tarea.id} tarea={tarea} />
                    ))}
                  </div>
                </div>
              </SortableContext>
            );
          })}
        </div>

        <DragOverlay>
          {activeTarea ? <TareaCard tarea={activeTarea} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
