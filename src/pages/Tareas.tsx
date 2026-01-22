import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, Table as TableIcon, Columns, Plus, X, AlertCircle, Sparkles, Users, Lock, Share2 } from "lucide-react";
import { useTareas, useUpdateTarea, useCreateTarea } from "@/hooks/queries/useTareas";
import type { Tarea, TareaEstado, TareaTipo } from "@/types";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NuevaTareaDrawer } from "@/components/tareas/NuevaTareaDrawer";
import { EditarTareaDrawer } from "@/components/tareas/EditarTareaDrawer";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { TaskCommandBar } from "@/components/tasks/TaskCommandBar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Hook to get user names map
function useUserNamesMap() {
  return useQuery({
    queryKey: ['admin-users-names-map'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('user_id, full_name')
        .eq('is_active', true);
      return new Map<string, string>(
        data?.map(u => [u.user_id, u.full_name || 'Sin nombre']) || []
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface TareaCardProps {
  tarea: Tarea;
  isDragging?: boolean;
  onClick?: () => void;
  getUserName?: (userId: string | null | undefined) => string | null;
}

function TareaCard({ tarea, isDragging = false, onClick, getUserName }: TareaCardProps) {
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

  const isOverdue = tarea.fecha_vencimiento && 
    new Date(tarea.fecha_vencimiento) < new Date() && 
    tarea.estado !== "completada";

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "p-3 bg-card border rounded-lg cursor-move hover:shadow-md transition-shadow",
        isOverdue && "border-destructive bg-destructive/5"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {/* Visibility indicator */}
        {tarea.tipo === 'individual' ? (
          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <Users className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <h4 className="font-medium text-sm flex-1">{tarea.titulo}</h4>
        {tarea.compartido_con && tarea.compartido_con.length > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <Share2 className="h-2.5 w-2.5 mr-0.5" />
            {tarea.compartido_con.length}
          </Badge>
        )}
        {tarea.ai_generated && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
            IA
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
        {tarea.prioridad && (
          <Badge variant={getPriorityColor(tarea.prioridad)} className="text-xs">
            {tarea.prioridad}
          </Badge>
        )}
        {isOverdue && (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Vencida
          </Badge>
        )}
        {tarea.fecha_vencimiento && !isOverdue && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(tarea.fecha_vencimiento), "dd MMM", { locale: es })}</span>
          </div>
        )}
        {tarea.asignado_a && (
          <Avatar className="h-5 w-5" title={getUserName?.(tarea.asignado_a) || undefined}>
            <AvatarFallback className="text-[10px] bg-primary/10">
              {getInitials(getUserName?.(tarea.asignado_a) || undefined)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  id: TareaEstado;
  label: string;
  tareas: Tarea[];
  quickAddValue: string;
  onQuickAddChange: (value: string) => void;
  onQuickAdd: () => void;
  onTareaClick: (tarea: Tarea) => void;
  getUserName?: (userId: string | null | undefined) => string | null;
}

function KanbanColumn({ 
  id, 
  label, 
  tareas, 
  quickAddValue, 
  onQuickAddChange, 
  onQuickAdd,
  onTareaClick,
  getUserName
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{label}</h3>
        <Badge variant="secondary">{tareas.length}</Badge>
      </div>

      {/* Quick Add */}
      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="+ Añadir tarea rápida"
            value={quickAddValue}
            onChange={(e) => onQuickAddChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") onQuickAdd();
            }}
            className="text-sm"
          />
          {quickAddValue && (
            <Button size="sm" variant="ghost" onClick={() => onQuickAddChange("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <SortableContext items={tareas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div 
          ref={setNodeRef}
          className={cn(
            "space-y-2 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors",
            isOver ? "border-primary bg-primary/5" : "border-transparent"
          )}
        >
          {tareas.map((tarea) => (
            <TareaCard 
              key={tarea.id} 
              tarea={tarea} 
              onClick={() => onTareaClick(tarea)}
              getUserName={getUserName}
            />
          ))}
          {tareas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No hay tareas en esta columna
            </div>
          )}
        </div>
      </SortableContext>
    </Card>
  );
}

const COLUMN_CONFIG: { id: TareaEstado; label: string }[] = [
  { id: "pendiente", label: "Pendiente" },
  { id: "en_progreso", label: "En Progreso" },
  { id: "completada", label: "Completada" },
];

export default function Tareas() {
  const { data: tareas = [], isLoading, refetch } = useTareas();
  const updateMutation = useUpdateTarea();
  const createMutation = useCreateTarea();
  const { data: userNamesMap } = useUserNamesMap();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Helper to get user name
  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return null;
    return userNamesMap?.get(userId) || null;
  };
  const [filtroTipo, setFiltroTipo] = useState<"mis_tareas" | "equipo" | "compartidas">("mis_tareas");
  const [filtroResponsable, setFiltroResponsable] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<TareaEstado | "">("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
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
    const overId = over.id as string;

    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea) return;

    // Check if dropping on a column
    const isColumn = COLUMN_CONFIG.some(col => col.id === overId);

    if (isColumn) {
      const nuevoEstado = overId as TareaEstado;
      if (tarea.estado !== nuevoEstado) {
        try {
          await updateMutation.mutateAsync({
            id: tareaId,
            data: { estado: nuevoEstado, order_index: 0 },
          });
          refetch();
        } catch (error) {
          console.error("Error al mover tarea:", error);
        }
      }
    } else {
      // Dropping on another task - reorder within column
      const targetTarea = tareas.find(t => t.id === overId);
      if (targetTarea) {
        const nuevoEstado = targetTarea.estado;
        const tareasColumna = tareas
          .filter(t => t.estado === nuevoEstado)
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        
        const oldIndex = tareasColumna.findIndex(t => t.id === tareaId);
        const newIndex = tareasColumna.findIndex(t => t.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          try {
            await updateMutation.mutateAsync({
              id: tareaId,
              data: { 
                estado: nuevoEstado,
                order_index: newIndex 
              },
            });
            refetch();
          } catch (error) {
            console.error("Error al reordenar tarea:", error);
          }
        } else if (tarea.estado !== nuevoEstado) {
          // Moving to a different column by dropping on a task
          try {
            await updateMutation.mutateAsync({
              id: tareaId,
              data: { estado: nuevoEstado, order_index: newIndex },
            });
            refetch();
          } catch (error) {
            console.error("Error al mover tarea:", error);
          }
        }
      }
    }
  };

  const handleQuickAdd = async (estado: TareaEstado) => {
    const titulo = nuevasTareas[estado].trim();
    if (!titulo || !currentUser) return;

    try {
      await createMutation.mutateAsync({
        titulo,
        estado,
        prioridad: "media",
        order_index: 0,
        creado_por: currentUser.id,
        tipo: 'individual',
      });
      setNuevasTareas((prev) => ({ ...prev, [estado]: "" }));
      refetch();
    } catch (error) {
      console.error("Error al crear tarea:", error);
    }
  };

  const handleTareaClick = (tarea: Tarea) => {
    setTareaEditando(tarea);
    setEditDrawerOpen(true);
  };

  // Filter tasks by visibility type first
  const tareasPorVisibilidad = useMemo(() => {
    if (!currentUser) return tareas;
    
    return tareas.filter((tarea) => {
      if (filtroTipo === "mis_tareas") {
        // Individual tasks I created OR assigned to me
        return (
          tarea.creado_por === currentUser.id ||
          tarea.asignado_a === currentUser.id
        );
      } else if (filtroTipo === "equipo") {
        // Group tasks visible to everyone
        return tarea.tipo === "grupal";
      } else if (filtroTipo === "compartidas") {
        // Individual tasks shared with me
        return (
          tarea.tipo === "individual" &&
          tarea.compartido_con?.includes(currentUser.id)
        );
      }
      return true;
    });
  }, [tareas, filtroTipo, currentUser]);

  const tareasFiltradas = tareasPorVisibilidad.filter((tarea) => {
    if (filtroResponsable && tarea.asignado_a !== filtroResponsable) return false;
    if (filtroEstado && tarea.estado !== filtroEstado) return false;
    if (filtroPrioridad && tarea.prioridad !== filtroPrioridad) return false;
    return true;
  });

  const responsablesUnicos = Array.from(new Set(tareasPorVisibilidad.map((t) => t.asignado_a).filter(Boolean)));
  const prioridadesUnicas = Array.from(new Set(tareasPorVisibilidad.map((t) => t.prioridad).filter(Boolean)));

  const tareasPorEstado = {
    pendiente: tareasFiltradas
      .filter((t) => t.estado === "pendiente")
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    en_progreso: tareasFiltradas
      .filter((t) => t.estado === "en_progreso")
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    completada: tareasFiltradas
      .filter((t) => t.estado === "completada")
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
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
      render: (value: string) => getUserName(value) || "Sin asignar",
    },
    {
      key: "fecha_vencimiento",
      label: "Vencimiento",
      render: (value: string, row: Tarea) => {
        if (!value) return "Sin fecha";
        const fecha = new Date(value);
        const isOverdue = fecha < new Date() && row.estado !== "completada";
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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-medium">Tareas</h1>
            <p className="text-sm text-muted-foreground mt-0.5 md:mt-1">Gestiona las tareas del equipo</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 md:p-4">
              <Skeleton className="h-5 md:h-6 w-24 md:w-32 mb-3 md:mb-4" />
              <div className="space-y-2 md:space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-16 md:h-20 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-medium">Tareas</h1>
          <p className="text-sm text-muted-foreground mt-0.5 md:mt-1">Gestiona las tareas del equipo</p>
        </div>
        <Button onClick={() => setDrawerOpen(true)} size="sm" className="w-fit h-8 md:h-9">
          <Plus className="mr-1.5 h-4 w-4" />
          <span className="hidden xs:inline">Nueva Tarea</span>
          <span className="xs:hidden">Nueva</span>
        </Button>
      </div>

      {/* AI Command Bar */}
      <TaskCommandBar onSuccess={() => refetch()} />

      {/* Tabs de Visibilidad */}
      <Tabs value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="mis_tareas" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Mis Tareas</span>
            <span className="sm:hidden">Mías</span>
          </TabsTrigger>
          <TabsTrigger value="equipo" className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="compartidas" className="gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compartidas</span>
            <span className="sm:hidden">Comp.</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtros y Vista Toggle */}
      <Card className="p-3 md:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            {/* Filtro Responsable - hide label on mobile */}
            {responsablesUnicos.length > 0 && (
              <div className="flex gap-2 items-center overflow-x-auto">
                <span className="text-xs md:text-sm text-muted-foreground shrink-0 hidden sm:inline">Responsable:</span>
                <div className="flex gap-1">
                  <Badge
                    variant={filtroResponsable === "" ? "default" : "outline"}
                    className="cursor-pointer text-xs shrink-0"
                    onClick={() => setFiltroResponsable("")}
                  >
                    Todos
                  </Badge>
                  {responsablesUnicos.slice(0, 3).map((responsable) => (
                    <Badge
                      key={responsable}
                      variant={filtroResponsable === responsable ? "default" : "outline"}
                      className="cursor-pointer text-xs shrink-0"
                      onClick={() => setFiltroResponsable(responsable!)}
                    >
                      {getUserName(responsable) || responsable}
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
          <div className="flex gap-1.5 md:gap-2 shrink-0">
            <Button
              variant={vistaActual === "tabla" ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaActual("tabla")}
              className="h-7 md:h-8 px-2 md:px-3"
            >
              <TableIcon className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Tabla</span>
            </Button>
            <Button
              variant={vistaActual === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setVistaActual("kanban")}
              className="h-7 md:h-8 px-2 md:px-3"
            >
              <Columns className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Kanban</span>
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

      {/* Vista Kanban - horizontal scroll on mobile */}
      {vistaActual === "kanban" && (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 pb-4">
            <div className="grid grid-flow-col md:grid-flow-row md:grid-cols-3 gap-3 md:gap-4 min-w-max md:min-w-0">
              {COLUMN_CONFIG.map((col) => (
                <div key={col.id} className="w-72 md:w-auto shrink-0 md:shrink">
                  <KanbanColumn
                    id={col.id}
                    label={col.label}
                    tareas={tareasPorEstado[col.id]}
                    quickAddValue={nuevasTareas[col.id]}
                    onQuickAddChange={(value) => setNuevasTareas(prev => ({ ...prev, [col.id]: value }))}
                    onQuickAdd={() => handleQuickAdd(col.id)}
                    onTareaClick={handleTareaClick}
                    getUserName={getUserName}
                  />
                </div>
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeDragId ? <TareaCard tarea={tareas.find((t) => t.id === activeDragId)!} isDragging getUserName={getUserName} /> : null}
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

      <EditarTareaDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        tarea={tareaEditando}
        onSuccess={() => {
          setEditDrawerOpen(false);
          setTareaEditando(null);
          refetch();
        }}
      />
    </div>
  );
}