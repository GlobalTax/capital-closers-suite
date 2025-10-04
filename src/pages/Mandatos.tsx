import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { fetchMandatos } from "@/services/api";
import type { Mandato } from "@/types";
import { toast } from "sonner";

export default function Mandatos() {
  const navigate = useNavigate();
  const [mandatos, setMandatos] = useState<Mandato[]>([]);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    { key: "id", label: "ID Mandato", sortable: true, filterable: true },
    { key: "empresa", label: "Empresa", sortable: true, filterable: true },
    { key: "cliente", label: "Cliente", sortable: true, filterable: true },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      render: (value: string) => <BadgeStatus status={value as any} type="mandato" />,
    },
    { key: "valor", label: "Valor Estimado", sortable: true },
    { key: "fecha", label: "Fecha Inicio", sortable: true },
  ];

  return (
    <div>
      <PageHeader
        title="Mandatos"
        description="Gestiona todos los mandatos de venta activos"
        actionLabel="Nuevo Mandato"
        onAction={() => toast.info("Función disponible próximamente")}
      />
      <DataTableEnhanced
        columns={columns}
        data={mandatos}
        loading={loading}
        onRowClick={(row) => navigate(`/mandatos/${row.id}`)}
        pageSize={10}
      />
    </div>
  );
}
