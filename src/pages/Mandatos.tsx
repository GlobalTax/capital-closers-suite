import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageTransition } from "@/components/shared/PageTransition";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { EmptyState } from "@/components/shared/EmptyState";
import { NuevoMandatoDrawer } from "@/components/mandatos/NuevoMandatoDrawer";
import { MandatoCard } from "@/components/mandatos/MandatoCard";
import { AgingAlertsBanner } from "@/components/alerts/AgingAlertsBanner";
import { FilterPanel, type FilterSection } from "@/components/shared/FilterPanel";
import { FilterChips } from "@/components/shared/FilterChips";
import { ActionCell, type ActionItem } from "@/components/shared/ActionCell";
import { BulkActionsBar, commonBulkActions } from "@/components/shared/BulkActionsBar";
import { useFilters } from "@/hooks/useFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchMandatos, deleteMandato, updateMandato } from "@/services/mandatos";
import { exportToCSV, cn } from "@/lib/utils";
import { MANDATO_ESTADOS, MANDATO_TIPOS } from "@/lib/constants";
import type { Mandato, MandatoEstado } from "@/types";
import { toast } from "sonner";
import {
  Search,
  Download,
  FileText,
  Pencil,
  Trash2,
  Eye,
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
import { useUndoableAction } from "@/hooks/useUndoableAction";

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
        <h3 className="font-medium text-sm uppercase text-muted-foreground">
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

// Definir secciones de filtros
const filterSections: FilterSection[] = [
  {
    id: "estado",
    label: "Estado",
    type: "checkbox",
    defaultOpen: true,
    options: MANDATO_ESTADOS.map((estado) => ({
      value: estado,
      label: estado,
    })),
  },
];

export default function Mandatos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vistaActual, setVistaActual] = useState<"tabla" | "kanban">("tabla");
  const [mandatoArrastrado, setMandatoArrastrado] = useState<Mandato | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(20);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const { fases } = useKanbanConfig();
  const { executeWithUndo } = useUndoableAction();

  // Restauración de scroll
  useScrollRestoration();

  // Hook de filtros Apollo-style
  const {
    values: filterValues,
    handleChange: handleFilterChange,
    handleRemove: handleFilterRemove,
    clearAll: clearAllFilters,
    chips: filterChips,
    hasActiveFilters,
  } = useFilters({ sections: filterSections });

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
      handleFilterChange("tipo", [tipoParam]);
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
    const mandato = mandatos.find(m => m.id === id);
    const nombreMandato = mandato?.codigo || mandato?.empresa_principal?.nombre || id.substring(0, 8);
    
    executeWithUndo({
      message: `Eliminando mandato ${nombreMandato}...`,
      undoMessage: "Eliminación cancelada",
      duration: 5000,
      action: async () => {
        try {
          await deleteMandato(id);
          toast.success("Mandato eliminado");
          cargarMandatos();
        } catch (error) {
          toast.error("Error al eliminar el mandato");
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedRows.length} mandatos seleccionados?`)) return;
    
    try {
      await Promise.all(selectedRows.map((id) => deleteMandato(id)));
      toast.success(`${selectedRows.length} mandatos eliminados`);
      setSelectedRows([]);
      cargarMandatos();
    } catch (error) {
      toast.error("Error al eliminar mandatos");
    }
  };

  const handleBulkExport = () => {
    const selectedMandatos = mandatos.filter((m) => selectedRows.includes(m.id));
    const exportData = selectedMandatos.map((m) => ({
      ID: m.codigo || m.id.substring(0, 8),
      Tipo: m.tipo,
      Estado: m.estado,
      Cliente: m.empresa_principal?.nombre || "",
      Fecha: m.created_at,
    }));
    exportToCSV(exportData, `mandatos-seleccionados-${new Date().toISOString().split("T")[0]}`);
    toast.success(`${selectedRows.length} mandatos exportados`);
  };

  const handleExportCSV = () => {
    const exportData = mandatosFiltrados.map((m) => ({
      ID: m.codigo || m.id.substring(0, 8),
      Tipo: m.tipo,
      Estado: m.estado,
      Cliente: m.empresa_principal?.nombre || "",
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

  // Filtros combinados con el nuevo sistema
  const mandatosFiltrados = useMemo(() => {
    return mandatos.filter((mandato) => {
      const empresaNombre = mandato.empresa_principal?.nombre || "";
      const matchSearch =
        searchQuery === "" ||
        empresaNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mandato.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mandato.codigo && mandato.codigo.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filtros del panel
      const estadoFilter = filterValues.estado || [];
      const tipoFilter = filterValues.tipo || [];
      
      const matchEstado = estadoFilter.length === 0 || estadoFilter.includes(mandato.estado);
      const matchTipo = tipoFilter.length === 0 || tipoFilter.includes(mandato.tipo);

      return matchSearch && matchEstado && matchTipo;
    });
  }, [mandatos, searchQuery, filterValues]);

  // Acciones inline para cada fila
  const getRowActions = (row: Mandato): ActionItem[] => [
    {
      icon: Eye,
      label: "Ver detalle",
      onClick: () => navigate(`/mandatos/${row.id}`),
    },
    {
      icon: Pencil,
      label: "Editar",
      onClick: () => toast.info("Edición disponible próximamente"),
    },
    {
      icon: Trash2,
      label: "Eliminar",
      onClick: () => handleDelete(row.id),
      variant: "destructive",
    },
  ];

  const columns = [
    { 
      key: "codigo", 
      label: "ID", 
      sortable: true, 
      filterable: true,
      render: (value: string, row: Mandato) => (
        <span 
          className="font-mono text-xs font-medium cursor-pointer hover:text-primary transition-colors" 
          title="Clic para editar"
          onClick={(e) => {
            e.stopPropagation();
            const newCodigo = prompt("Editar código:", value || "");
            if (newCodigo !== null && newCodigo !== value) {
              updateMandato(row.id, { codigo: newCodigo }).then(() => {
                toast.success("Código actualizado");
                cargarMandatos();
              }).catch(() => toast.error("Error al actualizar código"));
            }
          }}
        >
          {value || row.id.substring(0, 8)}
        </span>
      ),
    },
    { 
      key: "empresa_principal", 
      label: "Cliente", 
      sortable: true, 
      render: (value: any) => (
        <span className="font-medium">{value?.nombre || "Sin asignar"}</span>
      )
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
      label: "",
      render: (_: any, row: Mandato) => (
        <ActionCell actions={getRowActions(row)} />
      ),
    },
  ];

  if (loading) {
    return (
      <PageTransition>
        <PageHeader
          title="Mandatos M&A"
          description="Gestiona operaciones de compra y venta de empresas"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando mandatos...</p>
        </div>
      </PageTransition>
    );
  }

  if (mandatos.length === 0) {
    return (
      <PageTransition>
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
      </PageTransition>
    );
  }

  return (
    <PageTransition className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-medium text-foreground">Mandatos M&A</h1>
          <p className="text-muted-foreground mt-1">
            {mandatosFiltrados.length} de {mandatos.length} mandatos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg p-1 bg-muted/30">
            <Button
              variant={vistaActual === "tabla" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setVistaActual("tabla")}
              className="gap-1.5"
            >
              <TableIcon className="w-4 h-4" />
              Tabla
            </Button>
            <Button
              variant={vistaActual === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setVistaActual("kanban")}
              className="gap-1.5"
            >
              <Columns className="w-4 h-4" />
              Kanban
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
              Configurar
            </Button>
          )}
          <Button onClick={() => setDrawerOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Mandato
          </Button>
        </div>
      </div>

      <AgingAlertsBanner variant="expanded" maxItems={5} />

      {/* Layout principal con panel de filtros */}
      <div className="flex gap-0">
        {/* Panel de filtros lateral */}
        {vistaActual === "tabla" && (
          <FilterPanel
            sections={filterSections}
            values={filterValues}
            onChange={handleFilterChange}
            onClearAll={clearAllFilters}
            isOpen={filterPanelOpen}
            onToggle={() => setFilterPanelOpen(!filterPanelOpen)}
          />
        )}

        {/* Contenido principal */}
        <div className={cn("flex-1 min-w-0", filterPanelOpen && vistaActual === "tabla" && "pl-4")}>
          {/* Barra de herramientas */}
          <div className="flex items-center gap-3 mb-4">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, código o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Page size */}
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="10">10 / pág</SelectItem>
                <SelectItem value="20">20 / pág</SelectItem>
                <SelectItem value="50">50 / pág</SelectItem>
              </SelectContent>
            </Select>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/importar-datos")} className="h-9">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Filter chips */}
          <FilterChips
            chips={filterChips}
            onRemove={handleFilterRemove}
            onClearAll={clearAllFilters}
          />

          {/* Vista Tabla */}
          {vistaActual === "tabla" && (
            <DataTableEnhanced
              columns={columns}
              data={mandatosFiltrados}
              loading={false}
              onRowClick={(row) => navigate(`/mandatos/${row.id}`)}
              pageSize={pageSize}
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
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
        </div>
      </div>

      {/* Barra de acciones bulk */}
      <BulkActionsBar
        selectedCount={selectedRows.length}
        onClearSelection={() => setSelectedRows([])}
        actions={[
          commonBulkActions.export(handleBulkExport),
          commonBulkActions.delete(handleBulkDelete),
        ]}
      />

      <NuevoMandatoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={cargarMandatos}
      />

      <KanbanConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
      />
    </PageTransition>
  );
}
