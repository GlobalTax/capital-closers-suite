import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { fetchTargets } from "@/services/api";
import type { EmpresaTarget } from "@/types";
import { toast } from "sonner";

export default function EmpresasTarget() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaTarget[]>([]);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    { key: "nombre", label: "Empresa", sortable: true, filterable: true },
    { key: "sector", label: "Sector", sortable: true, filterable: true },
    { key: "facturacion", label: "Facturación", sortable: true },
    { key: "empleados", label: "Empleados", sortable: true },
    { key: "ubicacion", label: "Ubicación", sortable: true, filterable: true },
    {
      key: "interes",
      label: "Nivel de Interés",
      sortable: true,
      render: (value: string) => <BadgeStatus status={value as any} type="interes" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Empresas Target"
        description="Empresas objetivo para adquisición o inversión"
        actionLabel="Nueva Empresa"
        onAction={() => toast.info("Función disponible próximamente")}
      />
      <DataTableEnhanced
        columns={columns}
        data={empresas}
        loading={loading}
        onRowClick={(row) => navigate(`/targets/${row.id}`)}
        pageSize={10}
      />
    </div>
  );
}
