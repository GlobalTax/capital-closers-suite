import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { Toolbar } from "@/components/shared/Toolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { NuevoMandatoDrawer } from "@/components/mandatos/NuevoMandatoDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchServicios, deleteMandato, updateMandato } from "@/services/mandatos";
import { exportToCSV, cn } from "@/lib/utils";
import { MANDATO_CATEGORIA_LABELS, PIPELINE_STAGE_LABELS_SERVICIO } from "@/lib/constants";
import type { Mandato, MandatoCategoria } from "@/types";
import { toast } from "sonner";
import {
  Search,
  Download,
  MoreVertical,
  FileText,
  Pencil,
  Trash2,
  Table as TableIcon,
  Columns,
  Plus,
  Clock,
  Briefcase,
} from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MandatoCard } from "@/components/mandatos/MandatoCard";

const SERVICIO_CATEGORIAS: MandatoCategoria[] = ["due_diligence", "spa_legal", "valoracion", "asesoria"];

const SERVICIO_PIPELINE_STAGES = [
  { id: "propuesta", label: "Propuesta", color: "bg-blue-500/10 border-blue-500/30" },
  { id: "en_ejecucion", label: "En Ejecución", color: "bg-amber-500/10 border-amber-500/30" },
  { id: "entregado", label: "Entregado", color: "bg-green-500/10 border-green-500/30" },
];

function KanbanColumn({ 
  id, 
  label, 
  color, 
  servicios 
}: { 
  id: string; 
  label: string; 
  color: string; 
  servicios: Mandato[] 
}) {
  const { setNodeRef } = useDroppable({ id });
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm uppercase text-muted-foreground">
          {label}
        </h3>
        <Badge variant="outline">{servicios.length}</Badge>
      </div>
      
      <SortableContext
        id={id}
        items={servicios.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div 
          ref={setNodeRef}
          className={cn(
            "space-y-2 min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-colors",
            color
          )}
        >
          {servicios.map((servicio) => (
            <MandatoCard key={servicio.id} mandato={servicio} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Servicios() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [servicios, setServicios] = useState<Mandato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>(searchParams.get("tipo") || "todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vistaActual, setVistaActual] = useState<"tabla" | "kanban">("tabla");
  const [servicioArrastrado, setServicioArrastrado] = useState<Mandato | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  useEffect(() => {
    cargarServicios();
  }, []);

  useEffect(() => {
    const tipoParam = searchParams.get("tipo");
    if (tipoParam && SERVICIO_CATEGORIAS.includes(tipoParam as MandatoCategoria)) {
      setFiltroTipo(tipoParam);
    } else if (!tipoParam) {
      setFiltroTipo("todos");
    }
  }, [searchParams]);

  const cargarServicios = async () => {
    setLoading(true);
    try {
      const data = await fetchServicios();
      setServicios(data);
    } catch (error) {
      console.error("Error cargando servicios:", error);
      toast.error("Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMandato(id);
      toast.success("Servicio eliminado");
      cargarServicios();
    } catch (error) {
      toast.error("Error al eliminar el servicio");
    }
  };

  const handleExportCSV = () => {
    const exportData = serviciosFiltrados.map((s) => ({
      ID: s.id,
      Tipo: MANDATO_CATEGORIA_LABELS[s.categoria || "asesoria"]?.label || s.categoria,
      Estado: s.estado,
      Cliente: s.empresa_principal?.nombre || s.cliente_externo || "Sin asignar",
      Honorarios: s.honorarios_propuestos,
      Fecha: s.created_at,
    }));
    exportToCSV(exportData, `servicios-${new Date().toISOString().split("T")[0]}`);
    toast.success("Servicios exportados a CSV");
  };

  const getServiciosPorEstado = (estado: string) => {
    return serviciosFiltrados.filter((s) => s.estado === estado);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const servicio = servicios.find((s) => s.id === event.active.id);
    setServicioArrastrado(servicio || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setServicioArrastrado(null);

    if (!over) return;

    const servicioId = active.id as string;
    const nuevoEstado = over.id as string;

    const servicio = servicios.find((s) => s.id === servicioId);
    if (!servicio || servicio.estado === nuevoEstado) return;

    try {
      await updateMandato(servicioId, { estado: nuevoEstado as any });
      toast.success(`Servicio movido a ${PIPELINE_STAGE_LABELS_SERVICIO[nuevoEstado] || nuevoEstado}`);
      cargarServicios();
    } catch (error) {
      toast.error("Error al actualizar el servicio");
    }
  };

  const serviciosFiltrados = servicios.filter((servicio) => {
    const clienteNombre = servicio.empresa_principal?.nombre || servicio.cliente_externo || "";
    const matchSearch =
      searchQuery === "" ||
      clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      servicio.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTipo = filtroTipo === "todos" || servicio.categoria === filtroTipo;
    const matchEstado = filtroEstado === "todos" || servicio.estado === filtroEstado;

    return matchSearch && matchTipo && matchEstado;
  });

  const getTipoLabel = (categoria: string | undefined) => {
    return MANDATO_CATEGORIA_LABELS[categoria || "asesoria"]?.label || categoria;
  };

  const columns = [
    { key: "id", label: "ID", sortable: true, filterable: true },
    { 
      key: "empresa_principal", 
      label: "Cliente", 
      sortable: true, 
      render: (value: any, row: Mandato) => value?.nombre || row.cliente_externo || "Sin asignar"
    },
    {
      key: "categoria",
      label: "Tipo",
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline">
          {getTipoLabel(value)}
        </Badge>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      render: (value: string) => (
        <Badge variant={value === "entregado" ? "default" : value === "en_ejecucion" ? "secondary" : "outline"}>
          {PIPELINE_STAGE_LABELS_SERVICIO[value] || value}
        </Badge>
      ),
    },
    {
      key: "honorarios_propuestos",
      label: "Honorarios",
      sortable: true,
      render: (value: number) => value ? `€${value.toLocaleString()}` : "—",
    },
    {
      key: "last_activity_at",
      label: "Última actividad",
      sortable: true,
      render: (value: string, row: Mandato) => {
        const dateToUse = value || (row as any).created_at;
        const daysAgo = dateToUse 
          ? Math.floor((Date.now() - new Date(dateToUse).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        
        if (daysAgo === null) return <span className="text-muted-foreground">—</span>;
        
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Hace {daysAgo}d</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_: any, row: Mandato) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/mandatos/${row.id}`);
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                toast.info("Edición disponible próximamente");
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("¿Estás seguro de eliminar este servicio?")) {
                  handleDelete(row.id);
                }
              }}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Servicios"
          description="Gestiona proyectos de Due Diligence, SPA, Valoraciones y Asesoría"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (servicios.length === 0) {
    return (
      <div>
        <PageHeader
          title="Servicios"
          description="Gestiona proyectos de Due Diligence, SPA, Valoraciones y Asesoría"
        />
        <EmptyState
          icon={Briefcase}
          titulo="No hay servicios registrados"
          descripcion="Crea tu primer servicio para gestionar proyectos de DD, SPA, Valoraciones o Asesoría"
          accionLabel="Crear primer servicio"
          onAccion={() => setDrawerOpen(true)}
        />
        <NuevoMandatoDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onSuccess={cargarServicios}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-medium text-foreground">Servicios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona proyectos de Due Diligence, SPA, Valoraciones y Asesoría
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
          <Button onClick={() => setDrawerOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      <Toolbar
        filtros={
          <>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de servicio" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {SERVICIO_CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {MANDATO_CATEGORIA_LABELS[cat]?.label || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos estados</SelectItem>
                {SERVICIO_PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        acciones={
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        }
      />

      {vistaActual === "tabla" && (
        <DataTableEnhanced
          columns={columns}
          data={serviciosFiltrados}
          loading={false}
          onRowClick={(row) => navigate(`/mandatos/${row.id}`)}
          pageSize={10}
        />
      )}

      {vistaActual === "kanban" && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SERVICIO_PIPELINE_STAGES.map((stage) => {
              const serviciosColumna = getServiciosPorEstado(stage.id);
              return (
                <KanbanColumn
                  key={stage.id}
                  id={stage.id}
                  label={stage.label}
                  color={stage.color}
                  servicios={serviciosColumna}
                />
              );
            })}
          </div>
          
          <DragOverlay>
            {servicioArrastrado ? <MandatoCard mandato={servicioArrastrado} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <NuevoMandatoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={cargarServicios}
      />
    </div>
  );
}
