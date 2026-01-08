import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { Toolbar } from "@/components/shared/Toolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { NuevoMandatoDrawer } from "@/components/mandatos/NuevoMandatoDrawer";
import { MandatoCard } from "@/components/mandatos/MandatoCard";
import { AgingAlertsBanner } from "@/components/alerts/AgingAlertsBanner";
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
import { fetchMandatos, deleteMandato, updateMandato } from "@/services/mandatos";
import { exportToCSV, cn } from "@/lib/utils";
import { MANDATO_ESTADOS, MANDATO_TIPOS } from "@/lib/constants";
import type { Mandato, MandatoEstado } from "@/types";
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
  Settings,
  Upload,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useKanbanConfig } from "@/hooks/useKanbanConfig";
import { KanbanConfigDialog } from "@/components/mandatos/KanbanConfigDialog";

function KanbanColumn({ 
  id, 
  label, 
  color, 
  mandatos 
}: { 
  id: string; 
  label: string; 
  color: string; 
  mandatos: Mandato[] 
}) {
  const { setNodeRef } = useDroppable({ id });
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase text-muted-foreground">
          {label}
        </h3>
        <Badge variant="outline">{mandatos.length}</Badge>
      </div>
      
      <SortableContext
        id={id}
        items={mandatos.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <div 
          ref={setNodeRef}
          className={cn(
            "space-y-2 min-h-[500px] p-3 rounded-lg border-2 border-dashed transition-colors",
            color
          )}
        >
          {mandatos.map((mandato) => (
            <MandatoCard key={mandato.id} mandato={mandato} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Mandatos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>(searchParams.get("tipo") || "todos");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vistaActual, setVistaActual] = useState<"tabla" | "kanban">("tabla");
  const [mandatoArrastrado, setMandatoArrastrado] = useState<Mandato | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const { fases } = useKanbanConfig();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  useEffect(() => {
    cargarMandatos();
  }, []);

  // Actualizar filtros cuando cambian los query params
  useEffect(() => {
    const tipoParam = searchParams.get("tipo");
    
    if (tipoParam && (tipoParam === "compra" || tipoParam === "venta")) {
      setFiltroTipo(tipoParam);
    } else if (!tipoParam) {
      setFiltroTipo("todos");
    }
  }, [searchParams]);

  const cargarMandatos = async () => {
    setLoading(true);
    try {
      const data = await fetchMandatos();
      setMandatos(data);
    } catch (error) {
      console.error("Error cargando mandatos:", error);
      toast.error("Error al cargar los mandatos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMandato(id);
      toast.success("Mandato eliminado");
      cargarMandatos();
    } catch (error) {
      toast.error("Error al eliminar el mandato");
    }
  };

  const handleExportCSV = () => {
    const exportData = mandatosFiltrados.map((m) => ({
      ID: m.id,
      Tipo: m.tipo,
      Estado: m.estado,
      Descripción: m.descripcion,
      Fecha: m.created_at,
    }));
    exportToCSV(exportData, `mandatos-${new Date().toISOString().split("T")[0]}`);
    toast.success("Mandatos exportados a CSV");
  };

  const getMandatosPorEstado = (estado: MandatoEstado) => {
    return mandatosFiltrados.filter((m) => m.estado === estado);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const mandato = mandatos.find((m) => m.id === event.active.id);
    setMandatoArrastrado(mandato || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setMandatoArrastrado(null);

    if (!over) return;

    const mandatoId = active.id as string;
    const nuevoEstado = over.id as MandatoEstado;

    const mandato = mandatos.find((m) => m.id === mandatoId);
    if (!mandato || mandato.estado === nuevoEstado) return;

    try {
      await updateMandato(mandatoId, { estado: nuevoEstado });
      toast.success(`Mandato movido a ${nuevoEstado}`);
      cargarMandatos();
    } catch (error) {
      toast.error("Error al actualizar el mandato");
    }
  };

  // Filtros combinados
  const mandatosFiltrados = mandatos.filter((mandato) => {
    const empresaNombre = mandato.empresa_principal?.nombre || "";
    const matchSearch =
      searchQuery === "" ||
      empresaNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mandato.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchEstado =
      filtroEstado === "todos" || mandato.estado === filtroEstado;

    const matchTipo = filtroTipo === "todos" || mandato.tipo === filtroTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  const columns = [
    { 
      key: "id", 
      label: "ID", 
      sortable: true, 
      filterable: true,
      render: (value: string) => (
        <span className="font-mono text-xs text-muted-foreground" title={value}>
          {value?.substring(0, 8)}
        </span>
      ),
    },
    { 
      key: "empresa_principal", 
      label: "Cliente", 
      sortable: true, 
      render: (value: any) => value?.nombre || "Sin asignar"
    },
    {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      render: (value: string) => (
        <Badge variant={value === "venta" ? "default" : "secondary"}>
          {value === "venta" ? "Venta" : "Compra"}
        </Badge>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      render: (value: string) => (
        <BadgeStatus status={value as any} type="mandato" />
      ),
    },
    {
      key: "empresas",
      label: "Targets",
      sortable: false,
      render: (value: any[]) => (
        <span className="text-muted-foreground">{value?.length || 0}</span>
      ),
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
        
        const isInactive = daysAgo > 14;
        
        return (
          <div className={cn(
            "flex items-center gap-1.5 text-sm",
            isInactive && "text-destructive font-medium"
          )}>
            <Clock className="w-3.5 h-3.5" />
            <span>Hace {daysAgo}d</span>
            {isInactive && <AlertTriangle className="w-3.5 h-3.5" />}
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
                if (confirm("¿Estás seguro de eliminar este mandato?")) {
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
          title="Mandatos M&A"
          description="Gestiona operaciones de compra y venta de empresas"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando mandatos...</p>
        </div>
      </div>
    );
  }

  if (mandatos.length === 0) {
    return (
      <div>
        <PageHeader
          title="Mandatos M&A"
          description="Gestiona operaciones de compra y venta de empresas"
        />
        <EmptyState
          icon={FileText}
          titulo="No hay mandatos M&A registrados"
          descripcion="Crea tu primer mandato para comenzar a gestionar operaciones de compra y venta"
          accionLabel="Crear primer mandato"
          onAccion={() => setDrawerOpen(true)}
        />
        <NuevoMandatoDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onSuccess={cargarMandatos}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Mandatos M&A</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona operaciones de compra y venta de empresas
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
          {vistaActual === "kanban" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setConfigDialogOpen(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurar Fases
            </Button>
          )}
          <Button onClick={() => setDrawerOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Mandato
          </Button>
        </div>
      </div>

      <AgingAlertsBanner variant="expanded" maxItems={5} />

      <Toolbar
        filtros={
          <>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, empresa o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos</SelectItem>
                {MANDATO_TIPOS.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo === "venta" ? "Venta" : "Compra"}
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
                {MANDATO_ESTADOS.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        acciones={
          <>
            <Button variant="outline" onClick={() => navigate("/importar-datos")}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </>
        }
      />

      {/* Vista Tabla */}
      {vistaActual === "tabla" && (
        <DataTableEnhanced
          columns={columns}
          data={mandatosFiltrados}
          loading={false}
          onRowClick={(row) => navigate(`/mandatos/${row.id}`)}
          pageSize={10}
        />
      )}

      {/* Vista Kanban */}
      {vistaActual === "kanban" && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {fases.map((fase) => {
              const mandatosColumna = getMandatosPorEstado(fase.fase_id as MandatoEstado);
              return (
                <KanbanColumn
                  key={fase.id}
                  id={fase.fase_id}
                  label={fase.label}
                  color={fase.color}
                  mandatos={mandatosColumna}
                />
              );
            })}
          </div>
          
          <DragOverlay>
            {mandatoArrastrado ? <MandatoCard mandato={mandatoArrastrado} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <NuevoMandatoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={cargarMandatos}
      />

      <KanbanConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
      />
    </div>
  );
}
