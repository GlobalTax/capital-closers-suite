import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { fetchMandatos, deleteMandato } from "@/services/mandatos";
import { exportToCSV } from "@/lib/utils";
import { MANDATO_ESTADOS, MANDATO_TIPOS } from "@/lib/constants";
import type { Mandato } from "@/types";
import { toast } from "sonner";
import {
  Search,
  Download,
  MoreVertical,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";

export default function Mandatos() {
  const navigate = useNavigate();
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    cargarMandatos();
  }, []);

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

  // Filtros combinados
  const mandatosFiltrados = mandatos.filter((mandato) => {
    const matchSearch =
      searchQuery === "" ||
      mandato.empresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mandato.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mandato.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchEstado =
      filtroEstado === "todos" || mandato.estado === filtroEstado;

    const matchTipo = filtroTipo === "todos" || mandato.tipo === filtroTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  const columns = [
    { key: "id", label: "ID", sortable: true, filterable: true },
    { key: "cliente", label: "Cliente", sortable: true, filterable: true },
    { key: "empresa", label: "Empresa", sortable: true, filterable: true },
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
      key: "targetsCount",
      label: "Targets",
      sortable: true,
      render: (value: number) => (
        <span className="text-muted-foreground">{value || 0}</span>
      ),
    },
    {
      key: "tareasAbiertas",
      label: "Tareas abiertas",
      sortable: true,
      render: (value: number) => (
        <span className="font-medium">{value || 0}</span>
      ),
    },
    {
      key: "ultimaActualizacion",
      label: "Última actualización",
      sortable: true,
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
          title="Mandatos"
          description="Gestiona todos los mandatos de venta activos"
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
          title="Mandatos"
          description="Gestiona todos los mandatos de venta activos"
        />
        <EmptyState
          icon={FileText}
          titulo="No hay mandatos registrados"
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
      <PageHeader
        title="Mandatos"
        description="Gestiona todos los mandatos de venta activos"
        actionLabel="Nuevo Mandato"
        onAction={() => setDrawerOpen(true)}
      />

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
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {MANDATO_TIPOS.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo === "venta" ? "Venta" : "Compra"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="todos">Todos los estados</SelectItem>
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
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        }
      />

      <DataTableEnhanced
        columns={columns}
        data={mandatosFiltrados}
        loading={false}
        onRowClick={(row) => navigate(`/mandatos/${row.id}`)}
        pageSize={10}
      />

      <NuevoMandatoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSuccess={cargarMandatos}
      />
    </div>
  );
}
