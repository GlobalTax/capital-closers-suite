import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, Table as TableIcon, Columns, Plus, X, AlertCircle } from "lucide-react";
import { fetchTareas, updateTarea, createTarea } from "@/services/tareas";
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
import { DataTableEnhanced, Column } from "@/components/shared/DataTableEnhanced";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { Toolbar } from "@/components/shared/Toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { NuevaTareaDrawer } from "@/components/tareas/NuevaTareaDrawer";

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
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
        isPast(new Date(tarea.fecha_vencimiento)) &&
          tarea.estado !== "completada" &&
          "border-destructive"
      )}
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
            <span>{tarea.fecha_vencimiento}</span>
          </div>
          {tarea.asignado_a && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{tarea.asignado_a}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTarea, setActiveTarea] = useState<Tarea | null>(null);
  const [vistaActual, setVistaActual] = useState<"tabla" | "kanban">("kanban");
  
  // Filtros
  const [responsablesFiltro, setResponsablesFiltro] = useState<string[]>([]);
  const [estadosFiltro, setEstadosFiltro] = useState<TareaEstado[]>([]);
  const [prioridadesFiltro, setPrioridadesFiltro] = useState<string[]>([]);
  
  // Quick add state
  const [showQuickAdd, setShowQuickAdd] = useState<TareaEstado | null>(null);
  const [quickAddData, setQuickAddData] = useState({ titulo: "", asignado: "", fechaVencimiento: new Date() });
  
  // Drawer state
  const [showNuevaTareaDrawer, setShowNuevaTareaDrawer] = useState(false);

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

  // Responsables únicos
  const responsablesUnicos = Array.from(new Set(tareas.map((t) => t.asignado_a).filter(Boolean)));
  
  // Filtrado
  const tareasFiltradas = tareas.filter((t) => {
    if (responsablesFiltro.length && !responsablesFiltro.includes(t.asignado_a || "")) return false;
    if (estadosFiltro.length && !estadosFiltro.includes(t.estado)) return false;
    if (prioridadesFiltro.length && !prioridadesFiltro.includes(t.prioridad)) return false;
    return true;
  });
  
  const getTareasPorEstado = (estado: TareaEstado) => {
    return tareasFiltradas.filter((t) => t.estado === estado);
  };
  
  // Contador de tareas vencidas
  const tareasVencidas = tareas.filter(
    (t) => isPast(new Date(t.fecha_vencimiento)) && t.estado !== "completada"
  );
  
  // Quick add handler
  const handleQuickAdd = async (estado: TareaEstado) => {
    if (!quickAddData.titulo.trim() || !quickAddData.asignado) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }
    
    try {
      await createTarea({
        titulo: quickAddData.titulo,
        asignado_a: quickAddData.asignado,
        fecha_vencimiento: format(quickAddData.fechaVencimiento, "yyyy-MM-dd"),
        estado,
        prioridad: "media",
      });
      
      toast.success("Tarea creada");
      setShowQuickAdd(null);
      setQuickAddData({ titulo: "", asignado: "", fechaVencimiento: new Date() });
      cargarTareas();
    } catch (error) {
      toast.error("Error al crear la tarea");
    }
  };
  
  const limpiarFiltros = () => {
    setResponsablesFiltro([]);
    setEstadosFiltro([]);
    setPrioridadesFiltro([]);
  };

  // Columnas para vista tabla
  const columnasTabla: Column<Tarea>[] = [
    {
      key: "titulo",
      label: "Título",
      sortable: true,
    },
    {
      key: "mandatoNombre",
      label: "Mandato",
      render: (value) => value || "-",
    },
    {
      key: "asignado",
      label: "Responsable",
      render: (value) => value || "Sin asignar",
    },
    {
      key: "fechaVencimiento",
      label: "Vencimiento",
      sortable: true,
      render: (value, row) => {
        const isOverdue = isPast(new Date(value)) && row.estado !== "completada";
        return (
          <div className="flex items-center gap-2">
            {isOverdue && <AlertCircle className="w-4 h-4 text-destructive" />}
            <span className={cn(isOverdue && "text-destructive font-medium")}>{value}</span>
          </div>
        );
      },
    },
    {
      key: "estado",
      label: "Estado",
      render: (value) => <BadgeStatus status={value} type="tarea" />,
    },
    {
      key: "prioridad",
      label: "Prioridad",
      render: (value) => (
        <Badge
          variant={
            value === "alta" ? "destructive" : value === "media" ? "default" : "secondary"
          }
        >
          {value === "alta" ? "Alta" : value === "media" ? "Media" : "Baja"}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Tareas"
          description="Gestión de tareas y actividades del equipo"
          actionLabel="Nueva Tarea"
          onAction={() => setShowNuevaTareaDrawer(true)}
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Tareas</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de tareas y actividades del equipo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={vistaActual === "tabla" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setVistaActual("tabla")}
            >
              <TableIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={vistaActual === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setVistaActual("kanban")}
            >
              <Columns className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setShowNuevaTareaDrawer(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Toolbar con filtros */}
      <Toolbar
        filtros={
          <>
            <Select
              value={responsablesFiltro[0] || "todos"}
              onValueChange={(value) =>
                setResponsablesFiltro(value === "todos" ? [] : [value])
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los responsables</SelectItem>
                {responsablesUnicos.map((responsable) => (
                  <SelectItem key={responsable} value={responsable}>
                    {responsable}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={estadosFiltro[0] || "todos"}
              onValueChange={(value) =>
                setEstadosFiltro(value === "todos" ? [] : [value as TareaEstado])
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={prioridadesFiltro[0] || "todos"}
              onValueChange={(value) =>
                setPrioridadesFiltro(value === "todos" ? [] : [value])
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>

            {tareasVencidas.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                {tareasVencidas.length} vencida{tareasVencidas.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </>
        }
        acciones={
          <>
            {(responsablesFiltro.length > 0 ||
              estadosFiltro.length > 0 ||
              prioridadesFiltro.length > 0) && (
              <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            )}
          </>
        }
      />

      {/* Vista Tabla */}
      {vistaActual === "tabla" && (
        <DataTableEnhanced
          columns={columnasTabla}
          data={tareasFiltradas}
          rowClassName={(row) =>
            isPast(new Date(row.fecha_vencimiento)) && row.estado !== "completada"
              ? "bg-destructive/5"
              : ""
          }
        />
      )}

      {/* Vista Kanban */}
      {vistaActual === "kanban" && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(
              [
                { id: "pendiente", label: "Pendiente" },
                { id: "en_progreso", label: "En Progreso" },
                { id: "completada", label: "Completada" },
              ] as const
            ).map((columna) => {
              const tareasColumna = getTareasPorEstado(columna.id as TareaEstado);
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{tareasColumna.length}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowQuickAdd(columna.id);
                            setQuickAddData({
                              titulo: "",
                              asignado: "",
                              fechaVencimiento: new Date(),
                            });
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 min-h-[400px] p-2 rounded-lg border-2 border-dashed border-muted">
                      {/* Quick Add Form */}
                      {showQuickAdd === columna.id && (
                        <Card className="p-3 border-primary">
                          <div className="space-y-2">
                            <Input
                              placeholder="Título de la tarea"
                              value={quickAddData.titulo}
                              onChange={(e) =>
                                setQuickAddData({ ...quickAddData, titulo: e.target.value })
                              }
                            />
                            <Select
                              value={quickAddData.asignado}
                              onValueChange={(value) =>
                                setQuickAddData({ ...quickAddData, asignado: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Responsable" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Juan Díaz">Juan Díaz</SelectItem>
                                <SelectItem value="Ana Martínez">Ana Martínez</SelectItem>
                                <SelectItem value="Pedro López">Pedro López</SelectItem>
                              </SelectContent>
                            </Select>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {format(quickAddData.fechaVencimiento, "PPP")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={quickAddData.fechaVencimiento}
                                  onSelect={(date) =>
                                    date &&
                                    setQuickAddData({ ...quickAddData, fechaVencimiento: date })
                                  }
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleQuickAdd(columna.id)}
                              >
                                Crear
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowQuickAdd(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}

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
      )}

      {/* Drawer Nueva Tarea */}
      <NuevaTareaDrawer
        open={showNuevaTareaDrawer}
        onOpenChange={setShowNuevaTareaDrawer}
        onSuccess={cargarTareas}
      />
    </div>
  );
}
