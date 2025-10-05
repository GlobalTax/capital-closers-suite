import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Badge } from "@/components/ui/badge";
import { fetchEmpresas } from "@/services/empresas";
import type { Empresa } from "@/types";
import { toast } from "sonner";

export default function Empresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTarget, setFiltroTarget] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    cargarEmpresas();
  }, [filtroTarget]);

  const cargarEmpresas = async () => {
    setLoading(true);
    try {
      const data = await fetchEmpresas(filtroTarget);
      setEmpresas(data);
    } catch (error) {
      console.error("Error cargando empresas:", error);
      toast.error("Error al cargar las empresas");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "nombre",
      label: "Empresa",
      sortable: true,
      filterable: true,
      render: (value: string, row: Empresa) => (
        <div>
          <p className="font-medium">{value}</p>
          {row.es_target && (
            <Badge variant="outline" className="mt-1">Target</Badge>
          )}
        </div>
      ),
    },
    { key: "sector", label: "Sector", sortable: true, filterable: true },
    { 
      key: "ubicacion", 
      label: "Ubicación",
      render: (value: string) => value || "-"
    },
    {
      key: "facturacion",
      label: "Facturación",
      sortable: true,
      render: (value: number) => value ? `€${(value / 1000000).toFixed(1)}M` : "-"
    },
    {
      key: "empleados",
      label: "Empleados",
      sortable: true,
      render: (value: number) => value || "-"
    },
    {
      key: "nivel_interes",
      label: "Interés",
      render: (value: string, row: Empresa) => {
        if (!row.es_target || !value) return "-";
        const colors: Record<string, string> = {
          Alto: "destructive",
          Medio: "default",
          Bajo: "secondary"
        };
        return <Badge variant={colors[value] as any}>{value}</Badge>;
      }
    },
  ];

  return (
    <div>
      <PageHeader
        title="Empresas"
        description="Base de datos de empresas y targets potenciales"
        actionLabel="Nueva Empresa"
        onAction={() => toast.info("Función disponible próximamente")}
      />
      
      <div className="mb-4 flex gap-2">
        <Badge 
          variant={filtroTarget === undefined ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFiltroTarget(undefined)}
        >
          Todas
        </Badge>
        <Badge 
          variant={filtroTarget === true ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFiltroTarget(true)}
        >
          Targets
        </Badge>
        <Badge 
          variant={filtroTarget === false ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFiltroTarget(false)}
        >
          No Targets
        </Badge>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={empresas}
        loading={loading}
        onRowClick={(row) => navigate(`/empresas/${row.id}`)}
        pageSize={10}
      />
    </div>
  );
}
