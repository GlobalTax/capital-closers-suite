import { useState, useEffect, useMemo, useCallback } from "react";
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
import { ColumnToggle, type ColumnConfig } from "@/components/shared/ColumnToggle";
import { ViewDensityToggle, useViewDensity } from "@/components/shared/ViewDensityToggle";
import { type ViewDensity } from "@/components/shared/DataTableEnhanced";
import { useFilters } from "@/hooks/useFilters";
import { 
  InlineEditText, 
  InlineEditSelect, 
  InlineEditNumber,
  InlineEditCheckbox 
} from "@/components/shared/InlineEdit";
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
  ArrowUp,
  ArrowDown,
  Minus,
  Users,
  TrendingUp,
  Calendar,
  Trophy,
  XCircle,
  Send,
  FileDown,
  Loader2,
  Target,
  CircleOff,
} from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useKanbanConfig } from "@/hooks/useKanbanConfig";
import { KanbanConfigDialog } from "@/components/mandatos/KanbanConfigDialog";
import { SendTeasersDialog } from "@/components/mandatos/SendTeasersDialog";
import { useUndoableAction } from "@/hooks/useUndoableAction";
import { useTeasersForMandatos, useTeaserDownload } from "@/hooks/useTeaser";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Configuración de columnas disponibles
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "codigo", label: "ID", visible: true, locked: true },
  { key: "empresa_principal", label: "Cliente", visible: true, locked: true },
  { key: "potencial_sf", label: "SF", visible: true },
  { key: "teaser", label: "Teaser", visible: true },
  { key: "facturacion", label: "Facturación", visible: true },
  { key: "ebitda", label: "EBITDA", visible: true },
  { key: "año_datos", label: "Año", visible: true },
  { key: "tipo", label: "Tipo", visible: true },
  { key: "estado", label: "Estado", visible: true },
  { key: "categoria", label: "Categoría", visible: false },
  { key: "prioridad", label: "Prioridad", visible: false },
  { key: "valor", label: "Valor Deal", visible: false },
  { key: "valoracion_esperada", label: "Valoración", visible: false },
  { key: "fecha_inicio", label: "Inicio", visible: false },
  { key: "fecha_cierre", label: "Fecha Cierre", visible: false },
  { key: "empresas", label: "Targets", visible: true },
  { key: "contactos", label: "Contactos", visible: false },
  { key: "honorarios_aceptados", label: "Fee", visible: false },
  { key: "total_ingresos", label: "Ingresos", visible: false },
  { key: "balance_neto", label: "Balance", visible: false },
  { key: "outcome", label: "Resultado", visible: false },
  { key: "last_activity_at", label: "Última actividad", visible: true },
  { key: "actions", label: "", visible: true, locked: true },
];

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
  {
    id: "potencial_searchfund",
    label: "Potencial SF",
    type: "checkbox",
    defaultOpen: false,
    options: [
      { value: "true", label: "Potencial Searchfund" },
    ],
  },
];

// Función para formatear moneda
const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return "—";
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toLocaleString("es-ES")}`;
};

// Componente para prioridad
function PriorityBadge({ priority }: { priority: string | null | undefined }) {
  if (!priority) return <span className="text-muted-foreground">—</span>;
  
  const config: Record<string, { color: string; icon: typeof ArrowUp; label: string }> = {
    urgente: { color: "text-red-500", icon: AlertTriangle, label: "Urgente" },
    alta: { color: "text-orange-500", icon: ArrowUp, label: "Alta" },
    media: { color: "text-yellow-600", icon: Minus, label: "Media" },
    baja: { color: "text-green-500", icon: ArrowDown, label: "Baja" },
  };
  
  const cfg = config[priority] || config.media;
  const Icon = cfg.icon;
  
  return (
    <div className={cn("flex items-center gap-1.5", cfg.color)}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{cfg.label}</span>
    </div>
  );
}

// Componente para resultado (outcome)
function OutcomeBadge({ outcome }: { outcome: string | null | undefined }) {
  if (!outcome || outcome === "open") {
    return <Badge variant="outline" className="text-xs">Abierto</Badge>;
  }
  
  const variants: Record<string, string> = {
    won: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-muted text-muted-foreground",
  };
  
  const labels: Record<string, string> = {
    won: "Ganado",
    lost: "Perdido",
    cancelled: "Cancelado",
  };
  
  const icons: Record<string, typeof Trophy> = {
    won: Trophy,
    lost: XCircle,
    cancelled: XCircle,
  };
  
  const Icon = icons[outcome] || XCircle;
  
  return (
    <Badge className={cn("text-xs gap-1", variants[outcome])}>
      <Icon className="w-3 h-3" />
      {labels[outcome] || outcome}
    </Badge>
  );
}

// Componente para fecha de cierre con indicador de urgencia
function CloseDateBadge({ date }: { date: string | null | undefined }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  
  const targetDate = new Date(date);
  const days = differenceInDays(targetDate, new Date());
  
  if (days < 0) {
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <AlertTriangle className="w-3 h-3" />
        Vencido
      </Badge>
    );
  }
  
  if (days <= 7) {
    return (
      <Badge className="text-xs gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        <Calendar className="w-3 h-3" />
        {days}d
      </Badge>
    );
  }
  
  if (days <= 30) {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Calendar className="w-3 h-3" />
        {days}d
      </Badge>
    );
  }
  
  return (
    <span className="text-sm text-muted-foreground">
      {format(targetDate, "d MMM", { locale: es })}
    </span>
  );
}

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
  const [sendTeasersOpen, setSendTeasersOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(20);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [downloadingTeaser, setDownloadingTeaser] = useState<string | null>(null);

  // Columnas personalizables - cargar desde localStorage
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem("mandatos-columns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge con DEFAULT_COLUMNS para incluir nuevas columnas
        return DEFAULT_COLUMNS.map(defaultCol => {
          const savedCol = parsed.find((c: ColumnConfig) => c.key === defaultCol.key);
          return savedCol ? { ...defaultCol, visible: savedCol.visible } : defaultCol;
        });
      } catch {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });

  // Densidad de vista
  const [viewDensity, setViewDensity] = useViewDensity("mandatos-density", "comfortable");

  const { fases } = useKanbanConfig();
  const { executeWithUndo } = useUndoableAction();
  const { downloadTeaser } = useTeaserDownload();

  // Obtener IDs de mandatos para cargar teasers
  const mandatoIds = useMemo(() => mandatos.map(m => m.id), [mandatos]);
  const { data: teasersMap } = useTeasersForMandatos(mandatoIds);
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
      console.log('[Mandatos] Datos cargados:', data.length, 'mandatos');
      console.log('[Mandatos] Pipeline stages:', [...new Set(data.map(m => m.pipeline_stage))]);
      console.log('[Mandatos] Tipos:', [...new Set(data.map(m => m.tipo))]);
      setMandatos(data);
    } catch (error) {
      console.error("[Mandatos] Error cargando mandatos:", error);
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

  const handleBulkMarkSF = async () => {
    try {
      await Promise.all(
        selectedRows.map((id) => updateMandato(id, { potencial_searchfund: true }))
      );
      toast.success(`${selectedRows.length} mandato${selectedRows.length !== 1 ? 's' : ''} marcado${selectedRows.length !== 1 ? 's' : ''} como SF`);
      setSelectedRows([]);
      cargarMandatos();
    } catch (error) {
      console.error("Error al marcar SF:", error);
      toast.error("Error al marcar mandatos como SF");
    }
  };

  const handleBulkUnmarkSF = async () => {
    try {
      await Promise.all(
        selectedRows.map((id) => updateMandato(id, { potencial_searchfund: false }))
      );
      toast.success(`${selectedRows.length} mandato${selectedRows.length !== 1 ? 's' : ''} desmarcado${selectedRows.length !== 1 ? 's' : ''} de SF`);
      setSelectedRows([]);
      cargarMandatos();
    } catch (error) {
      console.error("Error al desmarcar SF:", error);
      toast.error("Error al desmarcar mandatos de SF");
    }
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

  const handleColumnChange = useCallback((newConfig: ColumnConfig[]) => {
    setColumnConfig(newConfig);
    localStorage.setItem("mandatos-columns", JSON.stringify(newConfig));
  }, []);

  // Función para obtener mandatos por pipeline_stage (para el Kanban)
  const getMandatosPorStage = (stage: string) => {
    return mandatosFiltrados.filter((m) => m.pipeline_stage === stage);
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
    const nuevoStage = over.id as string;

    const mandato = mandatos.find((m) => m.id === mandatoId);
    if (!mandato || mandato.pipeline_stage === nuevoStage) return;

    try {
      await updateMandato(mandatoId, { pipeline_stage: nuevoStage as any });
      toast.success(`Mandato movido a ${nuevoStage}`);
      cargarMandatos();
    } catch (error) {
      console.error("Error al mover mandato:", error);
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
      const sfFilter = filterValues.potencial_searchfund || [];
      
      const matchEstado = estadoFilter.length === 0 || estadoFilter.includes(mandato.estado);
      const matchTipo = tipoFilter.length === 0 || tipoFilter.includes(mandato.tipo);
      const matchSF = sfFilter.length === 0 || (sfFilter.includes("true") && (mandato as any).potencial_searchfund === true);

      return matchSearch && matchEstado && matchTipo && matchSF;
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

  // Helper para guardar y recargar
  const handleInlineUpdate = useCallback(async (id: string, updates: Partial<Mandato>) => {
    await updateMandato(id, updates);
    toast.success("Actualizado");
    cargarMandatos();
  }, []);

  // Definiciones de todas las columnas con sus renders
  const allColumnDefinitions = useMemo(() => ({
    codigo: { 
      key: "codigo", 
      label: "ID", 
      sortable: true, 
      filterable: true,
      render: (value: string, row: Mandato) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div onClick={(e) => e.stopPropagation()}>
                <InlineEditText
                  value={value || row.id.substring(0, 8)}
                  onSave={async (newValue) => handleInlineUpdate(row.id, { codigo: newValue })}
                  className="font-mono text-xs font-medium"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">UUID: {row.id.substring(0, 8)}...</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    empresa_principal: { 
      key: "empresa_principal", 
      label: "Cliente", 
      sortable: true, 
      render: (value: any, row: Mandato) => {
        const clientName = value?.nombre 
          || (row.empresas?.[0] as any)?.empresa?.nombre
          || row.cliente_externo
          || "Sin asignar";
        return <span className="font-medium">{clientName}</span>;
      }
    },
    potencial_sf: {
      key: "potencial_sf",
      label: "SF",
      sortable: true,
      render: (_: any, row: Mandato) => {
        const isSF = (row as any).potencial_searchfund;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <InlineEditCheckbox
              checked={isSF || false}
              onSave={async (newValue) => handleInlineUpdate(row.id, { potencial_searchfund: newValue } as any)}
              label={isSF ? (
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-1.5">
                  SF
                </Badge>
              ) : null}
            />
          </div>
        );
      },
    },
    teaser: {
      key: "teaser",
      label: "Teaser",
      sortable: false,
      render: (_: any, row: Mandato) => {
        const teaser = teasersMap?.[row.id];
        const isDownloading = downloadingTeaser === row.id;
        
        if (!teaser) {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground text-xs">—</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sin teaser</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-primary hover:text-primary/80"
                  disabled={isDownloading}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setDownloadingTeaser(row.id);
                    const success = await downloadTeaser(teaser);
                    if (success) {
                      toast.success(`Descargando ${teaser.file_name}`);
                    } else {
                      toast.error("Error al descargar teaser");
                    }
                    setDownloadingTeaser(null);
                  }}
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{teaser.file_name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    facturacion: {
      key: "facturacion",
      label: "Facturación",
      sortable: true,
      render: (_: any, row: Mandato) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.empresa_principal?.facturacion 
            ? formatCurrency(row.empresa_principal.facturacion) 
            : "—"}
        </span>
      ),
    },
    ebitda: {
      key: "ebitda",
      label: "EBITDA",
      sortable: true,
      render: (_: any, row: Mandato) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.empresa_principal?.ebitda 
            ? formatCurrency(row.empresa_principal.ebitda) 
            : "—"}
        </span>
      ),
    },
    año_datos: {
      key: "año_datos",
      label: "Año",
      sortable: true,
      render: (_: any, row: Mandato) => (
        <span className="text-sm text-muted-foreground">
          {(row.empresa_principal as any)?.año_datos_financieros || "—"}
        </span>
      ),
    },
    tipo: {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      render: (value: string, row: Mandato) => (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineEditSelect
            value={value}
            options={MANDATO_TIPOS.map(t => ({ value: t, label: t === "venta" ? "Venta" : "Compra" }))}
            onSave={async (newValue) => handleInlineUpdate(row.id, { tipo: newValue as any })}
            renderDisplay={(val) => (
              <Badge variant={val === "venta" ? "default" : "secondary"}>
                {val === "venta" ? "Venta" : "Compra"}
              </Badge>
            )}
          />
        </div>
      ),
    },
    estado: {
      key: "estado",
      label: "Estado",
      sortable: true,
      render: (value: string, row: Mandato) => (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineEditSelect
            value={value}
            options={MANDATO_ESTADOS.map(e => ({ value: e, label: e }))}
            onSave={async (newValue) => handleInlineUpdate(row.id, { estado: newValue as MandatoEstado })}
            renderDisplay={(val) => <BadgeStatus status={val as any} type="mandato" />}
          />
        </div>
      ),
    },
    categoria: {
      key: "categoria",
      label: "Categoría",
      sortable: true,
      render: (value: string, row: Mandato) => (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineEditSelect
            value={value || ""}
            options={[
              { value: "operacion_ma", label: "Operación M&A" },
              { value: "due_diligence", label: "Due Diligence" },
              { value: "spa_legal", label: "SPA / Legal" },
              { value: "valoracion", label: "Valoración" },
              { value: "asesoria", label: "Asesoría" },
            ]}
            onSave={async (newValue) => handleInlineUpdate(row.id, { categoria: newValue as any })}
            placeholder="Sin categoría"
            renderDisplay={(val) => val ? (
              <Badge variant="outline" className="text-xs">{val}</Badge>
            ) : <span className="text-muted-foreground">—</span>}
          />
        </div>
      ),
    },
    prioridad: {
      key: "prioridad",
      label: "Prioridad",
      sortable: true,
      render: (value: string, row: Mandato) => (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineEditSelect
            value={value || ""}
            options={[
              { value: "urgente", label: "Urgente" },
              { value: "alta", label: "Alta" },
              { value: "media", label: "Media" },
              { value: "baja", label: "Baja" },
            ]}
            onSave={async (newValue) => handleInlineUpdate(row.id, { prioridad: newValue as any })}
            placeholder="Sin prioridad"
            renderDisplay={(val) => <PriorityBadge priority={val} />}
          />
        </div>
      ),
    },
    valor: {
      key: "valor",
      label: "Valor Deal",
      sortable: true,
      render: (value: number, row: Mandato) => (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineEditNumber
            value={value}
            onSave={async (newValue) => handleInlineUpdate(row.id, { valor: newValue } as any)}
            format={formatCurrency}
            className="text-sm tabular-nums"
          />
        </div>
      ),
    },
    valoracion_esperada: {
      key: "valoracion_esperada",
      label: "Valoración",
      sortable: true,
      render: (value: number, row: Mandato) => (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineEditNumber
            value={value}
            onSave={async (newValue) => handleInlineUpdate(row.id, { valoracion_esperada: newValue })}
            format={formatCurrency}
            className="text-sm tabular-nums text-primary"
          />
        </div>
      ),
    },
    fecha_inicio: {
      key: "fecha_inicio",
      label: "Inicio",
      sortable: true,
      render: (value: string) => value ? (
        <span className="text-sm text-muted-foreground">
          {format(new Date(value), "d MMM yy", { locale: es })}
        </span>
      ) : <span className="text-muted-foreground">—</span>,
    },
    fecha_cierre: {
      key: "fecha_cierre",
      label: "Fecha Cierre",
      sortable: true,
      render: (value: string) => <CloseDateBadge date={value} />,
    },
    empresas: {
      key: "empresas",
      label: "Targets",
      sortable: false,
      render: (value: any[]) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{value?.length || 0}</span>
        </div>
      ),
    },
    contactos: {
      key: "contactos",
      label: "Contactos",
      sortable: false,
      render: (value: any[]) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{value?.length || 0}</span>
        </div>
      ),
    },
    honorarios_aceptados: {
      key: "honorarios_aceptados",
      label: "Fee",
      sortable: true,
      render: (value: number, row: Mandato) => (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineEditNumber
            value={value}
            onSave={async (newValue) => handleInlineUpdate(row.id, { honorarios_aceptados: newValue })}
            format={formatCurrency}
            className="text-sm tabular-nums text-green-600 dark:text-green-400"
          />
        </div>
      ),
    },
    total_ingresos: {
      key: "total_ingresos",
      label: "Ingresos",
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-sm tabular-nums text-green-600 dark:text-green-400">
          {formatCurrency(value)}
        </span>
      ),
    },
    balance_neto: {
      key: "balance_neto",
      label: "Balance",
      sortable: true,
      render: (value: number) => {
        if (!value) return <span className="text-muted-foreground">—</span>;
        const isPositive = value >= 0;
        return (
          <span className={cn(
            "font-mono text-sm tabular-nums",
            isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {isPositive ? "+" : ""}{formatCurrency(value)}
          </span>
        );
      },
    },
    outcome: {
      key: "outcome",
      label: "Resultado",
      sortable: true,
      render: (value: string) => <OutcomeBadge outcome={value} />,
    },
    last_activity_at: {
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
    actions: {
      key: "actions",
      label: "",
      render: (_: any, row: Mandato) => (
        <ActionCell actions={getRowActions(row)} />
      ),
    },
  }), []);

  // Filtrar y ordenar columnas según configuración
  const visibleColumns = useMemo(() => {
    return columnConfig
      .filter(col => col.visible)
      .map(col => allColumnDefinitions[col.key as keyof typeof allColumnDefinitions])
      .filter(Boolean);
  }, [columnConfig, allColumnDefinitions]);

  // Contar columnas visibles para mostrar en UI
  const visibleCount = columnConfig.filter(c => c.visible).length;
  const totalCount = columnConfig.length;

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

            {/* Columnas Toggle - solo en vista tabla */}
            {vistaActual === "tabla" && (
              <ColumnToggle
                columns={columnConfig}
                onChange={handleColumnChange}
                storageKey="mandatos-columns"
              />
            )}

            {/* Densidad Toggle - solo en vista tabla */}
            {vistaActual === "tabla" && (
              <ViewDensityToggle
                value={viewDensity}
                onChange={setViewDensity}
                storageKey="mandatos-density"
              />
            )}

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
              columns={visibleColumns}
              data={mandatosFiltrados}
              loading={false}
              onRowClick={(row) => navigate(`/mandatos/${row.id}`)}
              pageSize={pageSize}
              selectable
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              density={viewDensity}
            />
          )}

          {/* Vista Kanban */}
          {vistaActual === "kanban" && (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Debug: mostrar estado cuando no hay datos */}
              {mandatosFiltrados.length === 0 && !loading && (
                <EmptyState
                  icon={FileText}
                  titulo="No hay mandatos para mostrar"
                  descripcion="No se encontraron mandatos M&A. Verifica que estés autenticado correctamente o que existan mandatos en el sistema."
                />
              )}
              
              {fases.length === 0 && mandatosFiltrados.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay fases de Kanban configuradas. Configura las fases en el diálogo de configuración.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {fases.map((fase) => {
                  const mandatosColumna = getMandatosPorStage(fase.fase_id);
                  console.log(`[Kanban] Fase ${fase.fase_id} (${fase.label}): ${mandatosColumna.length} mandatos`);
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
          {
            icon: Target,
            label: "Marcar SF",
            onClick: handleBulkMarkSF,
          },
          {
            icon: CircleOff,
            label: "Quitar SF",
            onClick: handleBulkUnmarkSF,
          },
          {
            icon: Send,
            label: "Enviar teasers",
            onClick: () => setSendTeasersOpen(true),
          },
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

      <SendTeasersDialog
        open={sendTeasersOpen}
        onOpenChange={setSendTeasersOpen}
        selectedMandatos={mandatos.filter(m => selectedRows.includes(m.id))}
      />
    </PageTransition>
  );
}
