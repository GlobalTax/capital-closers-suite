import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableEnhanced } from "@/components/shared/DataTableEnhanced";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchClientes } from "@/services/api";
import type { Cliente } from "@/types";
import { toast } from "sonner";

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const data = await fetchClientes();
      setClientes(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast.error("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "nombre",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {value.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    { key: "empresa", label: "Empresa", sortable: true, filterable: true },
    { key: "email", label: "Email", filterable: true },
    { key: "telefono", label: "Teléfono" },
    { key: "mandatos", label: "Mandatos Activos", sortable: true },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Base de datos de clientes y contactos"
        actionLabel="Nuevo Cliente"
        onAction={() => toast.info("Función disponible próximamente")}
      />
      <DataTableEnhanced
        columns={columns}
        data={clientes}
        loading={loading}
        onRowClick={(row) => navigate(`/clientes/${row.id}`)}
        pageSize={10}
      />
    </div>
  );
}
