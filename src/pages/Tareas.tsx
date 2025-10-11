import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, Table as TableIcon, Columns, Plus, X, AlertCircle } from "lucide-react";
import { useTareas, useUpdateTarea, useCreateTarea } from "@/hooks/queries/useTareas";
import type { Tarea, TareaEstado } from "@/types";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NuevaTareaDrawer } from "@/components/tareas/NuevaTareaDrawer";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface TareaCardProps {
  tarea: Tarea;
  isDragging?: boolean;
}

function TareaCard({ tarea, isDragging = false }: TareaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: tarea.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case "urgente": return "destructive";
      case "alta": return "default";
      case "media": return "secondary";
      case "baja": return "outline";
      default: return "secondary";
    }
  };

  const isOverdue = tarea.fecha_vencimiento && new Date(tarea.fecha_vencimiento) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 bg-card border rounded-lg cursor-move hover:shadow-md transition-shadow ${
        isOverdue && tarea.estado !== "completada" ? "border-destructive" : ""
      }`}
    >
      <h4 className="font-medium text-sm mb-2">{tarea.titulo}</h4>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {tarea.prioridad && (
          <Badge variant={getPriorityColor(tarea.prioridad)} className="text-xs">
            {tarea.prioridad}
          </Badge>
        )}
        {tarea.fecha_vencimiento && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(tarea.fecha_vencimiento), "dd MMM", { locale: es })}</span>
          </div>
        )}
        {tarea.asignado_a && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{tarea.asignado_a}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tareas() {
  const { data: tareas = [], isLoading, refetch } = useTareas();
  const updateMutation = useUpdateTarea();
  const createMutation = useCreateTarea();

  const [filtroResponsable, setFiltroResponsable] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<TareaEstado | "">("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vistaActual, setVistaActual] = useState<"tabla" | "kanban">("kanban");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [nuevasTareas, setNuevasTareas] = useState<{ [key: string]: string }>({
    pendiente: "",
    en_progreso: "",
    completada: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const tareaId = active.id as string;
    const nuevoEstado = over.id as TareaEstado;

    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea || tarea.estado === nuevoEstado) return;

    try {
      await updateMutation.mutateAsync({
        id: tareaId,
        data: { estado: nuevoEstado },
      });
      refetch();
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
    }
  };

  const handleQuickAdd = async (estado: TareaEstado) => {
    const titulo = nuevasTareas[estado].trim();
    if (!titulo) return;

    try {
      await createMutation.mutateAsync({
        titulo,
        estado,
        prioridad: "media",
      });
      setNuevasTareas((prev) => ({ ...prev, [estado]: "" }));
      refetch();
    } catch (error) {
      console.error("Error al crear tarea:", error);
    }
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    if (filtroResponsable && tarea.asignado_a !== filtroResponsable) return false;
    if (filtroEstado && tarea.estado !== filtroEstado) return false;
    if (filtroPrioridad && tarea.prioridad !== filtroPrioridad) return false;
    return true;
  });

  const responsablesUnicos = Array.from(new Set(tareas.map((t) => t.asignado_a).filter(Boolean)));
  const prioridadesUnicas = Array.from(new Set(tareas.map((t) => t.prioridad).filter(Boolean)));

  const tareasPorEstado = {
    pendiente: tareasFiltradas.filter((t) => t.estado === "pendiente"),
    en_progreso: tareasFiltradas.filter((t) => t.estado === "en_progreso"),
    completada: tareasFiltradas.filter((t) => t.estado === "completada"),
  };

  const columnasTabla = [
    {
      key: "titulo",
      label: "Tarea",
      render: (value: string, row: Tarea) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.descripcion && <div className="text-sm text-muted-foreground">{row.descripcion}</div>}
        </div>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      render: (value: string) => {
        const estadoLabels = {
          pendiente: { label: "Pendiente", variant: "secondary" as const },
          en_progreso: { label: "En Progreso", variant: "default" as const },
          completada: { label: "Completada", variant: "outline" as const },
        };
        const estado = estadoLabels[value as TareaEstado] || estadoLabels.pendiente;
        return <Badge variant={estado.variant}>{estado.label}</Badge>;
      },
    },
    {
      key: "prioridad",
      label: "Prioridad",
      render: (value: string) => {
        const prioridadColors = {
          urgente: "destructive" as const,
          alta: "default" as const,
          media: "secondary" as const,
          baja: "outline" as const,
        };
        return <Badge variant={prioridadColors[value as keyof typeof prioridadColors] || "secondary"}>{value}</Badge>;
      },
    },
    {
      key: "asignado_a",
      label: "Responsable",
      render: (value: string) => value || "Sin asignar",
    },
    {
      key: "fecha_vencimiento",
      label: "Vencimiento",
      render: (value: string) => {
        if (!value) return "Sin fecha";
        const fecha = new Date(value);
        const isOverdue = fecha < new Date();
        return (
          <span className={isOverdue ? "text-destructive font-medium" : ""}>
            {format(fecha, "dd/MM/yyyy", { locale: es })}
          </span>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tareas" description="Gestiona las tareas del equipo" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Tareas</h1>
          <p className="text-muted-foreground mt-1">Gestiona las tareas del equipo</p>
        </div>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      {/* Filtros y Vista Toggle */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Filtro Responsable */}
            {responsablesUnicos.length > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Responsable:</span>
                <div className="flex gap-1">
                  <Badge
                    variant={filtroResponsable === "" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFiltroResponsable("")}
                  >
                    Todos
                  </Badge>
                  {responsablesUnicos.map((responsable) => (
                    <Badge
                      key={responsable}
                      variant={filtroResponsable === responsable ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFiltroResponsable(responsable!)}
                    >
                      {responsable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Filtro Estado */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Estado:</span>
              <div className="flex gap-1">
                <Badge
                  variant={filtroEstado === "" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFiltroEstado("")}
                >
                  Todos
                </Badge>
                <Badge
                  variant={filtroEstado === "pendiente" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFiltroEstado("pendiente")}
                >
                  Pendiente
                </Badge>
                <Badge
                  variant={filtroEstado === "en_progreso" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFiltroEstado("en_progreso")}
                >
                  En Progreso
                </Badge>
                <Badge
                  variant={filtroEstado === "completada" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFiltroEstado("completada")}
                >
                  Completada
                </Badge>
              </div>
            </div>

            {/* Filtro Prioridad */}
            {prioridadesUnicas.length > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Prioridad:</span>
                <div className="flex gap-1">
                  <Badge
                    variant={filtroPrioridad === "" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFiltroPrioridad("")}
                  >
                    Todas
                  </Badge>
                  {prioridadesUnicas.map((prioridad) => (
                    <Badge
                      key={prioridad}
                      variant={filtroPrioridad === prioridad ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFiltroPrioridad(prioridad!)}
                    >
                      {prioridad}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toggle Vista */}
          <div className="flex gap-2">
            <Button
              variant={vistaActual === "tabla" ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaActual("tabla")}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Tabla
            </Button>
            <Button
              variant={vistaActual === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaActual("kanban")}
            >
              <Columns className="h-4 w-4 mr-2" />
              Kanban
            </Button>
          </div>
        </div>
      </Card>

      {/* Vista Tabla */}
      {vistaActual === "tabla" && (
        <DataTableEnhanced
          data={tareasFiltradas}
          columns={columnasTabla}
        />
      )}

      {/* Vista Kanban */}
      {vistaActual === "kanban" && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["pendiente", "en_progreso", "completada"] as TareaEstado[]).map((estado) => (
              <SortableContext key={estado} items={tareasPorEstado[estado].map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                      {estado === "pendiente" ? "Pendiente" : estado === "en_progreso" ? "En Progreso" : "Completada"}
                    </h3>
                    <Badge variant="secondary">{tareasPorEstado[estado].length}</Badge>
                  </div>

                  {/* Quick Add */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="+ Añadir tarea rápida"
                        value={nuevasTareas[estado]}
                        onChange={(e) => setNuevasTareas((prev) => ({ ...prev, [estado]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleQuickAdd(estado);
                        }}
                        className="text-sm"
                      />
                      {nuevasTareas[estado] && (
                        <Button size="sm" variant="ghost" onClick={() => setNuevasTareas((prev) => ({ ...prev, [estado]: "" }))}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 min-h-[200px]">
                    {tareasPorEstado[estado].map((tarea) => (
                      <TareaCard key={tarea.id} tarea={tarea} />
                    ))}
                    {tareasPorEstado[estado].length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No hay tareas en esta columna
                      </div>
                    )}
                  </div>
                </Card>
              </SortableContext>
            ))}
          </div>

          <DragOverlay>
            {activeDragId ? <TareaCard tarea={tareas.find((t) => t.id === activeDragId)!} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <NuevaTareaDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={() => {
          setDrawerOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
