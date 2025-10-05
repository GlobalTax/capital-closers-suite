import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { Toolbar } from "@/components/shared/Toolbar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fetchTargets, updateTarget } from "@/services/api";
import { exportToCSV } from "@/lib/utils";
import type { EmpresaTarget, TargetEstado } from "@/types";
import { toast } from "sonner";
import { Download, X } from "lucide-react";
import { TARGET_ESTADOS } from "@/lib/constants";
import { NuevoTargetDrawer } from "@/components/targets/NuevoTargetDrawer";

export default function EmpresasTarget() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [revenueMin, setRevenueMin] = useState("");
  const [revenueMax, setRevenueMax] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openDrawer, setOpenDrawer] = useState(false);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    setLoading(true);
    try {
      const data = await fetchTargets();
      setEmpresas(data);
    } catch (error) {
      console.error("Error cargando targets:", error);
      toast.error("Error al cargar las empresas target");
    } finally {
      setLoading(false);
    }
  };

  // Filtrado combinado
  const filteredEmpresas = empresas.filter((empresa) => {
    const matchesSearch =
      !searchQuery ||
      empresa.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empresa.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      empresa.ubicacion.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEstado = estadoFilter === "all" || empresa.estado === estadoFilter;
    const matchesSector = sectorFilter === "all" || empresa.sector === sectorFilter;

    const revenueValue = empresa.revenue || 0;
    const matchesRevenue =
      (!revenueMin || revenueValue >= Number(revenueMin)) &&
      (!revenueMax || revenueValue <= Number(revenueMax));

    return matchesSearch && matchesEstado && matchesSector && matchesRevenue;
  });

  const handleBulkEstadoChange = async (nuevoEstado: TargetEstado) => {
    try {
      await Promise.all(
        selectedIds.map((id) => updateTarget(id, { estado: nuevoEstado }))
      );
      await cargarEmpresas();
      toast.success(`${selectedIds.length} empresas actualizadas a "${nuevoEstado}"`);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Error al actualizar empresas");
    }
  };

  const handleExport = () => {
    exportToCSV(filteredEmpresas, "empresas-target");
    toast.success("Datos exportados correctamente");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setEstadoFilter("all");
    setSectorFilter("all");
    setRevenueMin("");
    setRevenueMax("");
  };

  const sectores = Array.from(new Set(empresas.map((e) => e.sector)));

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true, filterable: true },
    { key: "sector", label: "Sector", sortable: true, filterable: true },
    { key: "ubicacion", label: "Ubicación", sortable: true, filterable: true },
    {
      key: "revenue",
      label: "Revenue",
      sortable: true,
      render: (value: number | undefined) => {
        if (!value) return <span className="text-muted-foreground">Sin datos</span>;
        return `€${(value / 1000000).toFixed(1)}M`;
      },
    },
    {
      key: "ebitda",
      label: "EBITDA",
      sortable: true,
      render: (value: number | undefined) => {
        if (!value) return <span className="text-muted-foreground">Sin datos</span>;
        return `€${(value / 1000000).toFixed(1)}M`;
      },
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      render: (value: TargetEstado) =>
        value ? <BadgeStatus status={value} type="target" /> : <span className="text-muted-foreground">-</span>,
    },
    {
      key: "mandatoNombre",
      label: "Mandato",
      render: (value: string | undefined) => value || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "ultimaActividad",
      label: "Última Actividad",
      sortable: true,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Empresas Target"
        description="Empresas objetivo para adquisición o inversión"
        actionLabel="Nueva Empresa"
        onAction={() => setOpenDrawer(true)}
      />

      <NuevoTargetDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        onSuccess={cargarEmpresas}
      />

      <Toolbar
        filtros={
          <>
            <Input
              placeholder="Buscar por nombre, sector o ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {TARGET_ESTADOS.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado === "en_dd" ? "Due Diligence" : estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los sectores</SelectItem>
                {sectores.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Revenue mín (€)"
                value={revenueMin}
                onChange={(e) => setRevenueMin(e.target.value)}
                className="w-[140px]"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Revenue máx (€)"
                value={revenueMax}
                onChange={(e) => setRevenueMax(e.target.value)}
                className="w-[140px]"
              />
            </div>
            {(searchQuery || estadoFilter !== "all" || sectorFilter !== "all" || revenueMin || revenueMax) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </>
        }
        acciones={
          <>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedIds.length} seleccionadas</span>
                <Select onValueChange={(value) => handleBulkEstadoChange(value as TargetEstado)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Cambiar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_ESTADOS.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado === "en_dd" ? "Due Diligence" : estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </>
        }
      />

      <DataTableEnhanced
        columns={columns}
        data={filteredEmpresas}
        loading={loading}
        onRowClick={(row) => navigate(`/targets/${row.id}`)}
        selectable
        selectedRows={selectedIds}
        onSelectionChange={setSelectedIds}
        pageSize={10}
      />
    </div>
  );
}
